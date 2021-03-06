import { App, Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { CloudFrontWebDistribution, OriginProtocolPolicy, CloudFrontAllowedMethods, ViewerCertificate } from 'aws-cdk-lib/aws-cloudfront';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Bucket, BlockPublicAccess, StorageClass } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Vpc, SubnetType, SecurityGroup, Peer, Port, InterfaceVpcEndpointAwsService } from 'aws-cdk-lib/aws-ec2';
import { FileSystem as efsFileSystem }  from 'aws-cdk-lib/aws-efs';
import { Rule } from 'aws-cdk-lib/aws-events'
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets'
import { Function, Code, Runtime, FileSystem, LayerVersion} from 'aws-cdk-lib/aws-lambda';
import { LambdaDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import { PolicyStatement, Effect, AnyPrincipal, ServicePrincipal, Role } from 'aws-cdk-lib/aws-iam';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { CfnLocationS3, CfnLocationEFS , CfnTask } from 'aws-cdk-lib/aws-datasync';
import { AwsCustomResource, PhysicalResourceId, AwsCustomResourcePolicy } from 'aws-cdk-lib/custom-resources';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

import * as fs from 'fs';
import * as toml from 'toml';
const config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));

interface myStackProps extends StackProps {
  apigw: LambdaRestApi;
  postsTable: Table;
}

export class HugoServerlessStack extends Stack {
  constructor(scope: App, id: string, props: myStackProps) {
    super(scope, id, props);
    const { apigw, postsTable } = props;
    var sourceBucket;
    if (config.deploy.createNew) {
      //~ //Create a bucket to cache the source info for Hugo
      sourceBucket = new Bucket(this, 'Hugo Serverless Source', {
        bucketName: config.deploy.siteName+'-source',
        versioned: true,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        removalPolicy: RemovalPolicy.RETAIN,
        lifecycleRules: [{
          noncurrentVersionExpiration: Duration.days(30),
          transitions: [{
            storageClass: StorageClass.INFREQUENT_ACCESS,
            transitionAfter: Duration.days(30),
          }]
        }],
      });
    } else {
      sourceBucket = Bucket.fromBucketName(this, 'imported-bucket-from-name',
        config.deploy.siteName+'-source',
      );
    }
    sourceBucket.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.DENY,
        resources: [
          sourceBucket.arnForObjects("*"),
          sourceBucket.bucketArn,
        ],
        actions: ["s3:DeleteObject"],
        principals: [new AnyPrincipal()],
      })
    );
    
    //Create the theme bucket
    const themeBucket = new Bucket(this, config.deploy.siteName + '-theme', {
      bucketName: config.deploy.siteName+'-theme',
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });
    new BucketDeployment(this, 'DeployWebsite', {
      sources: [Source.asset('./hugo-serverless-theme')],
      destinationBucket: themeBucket,
      destinationKeyPrefix: 'themes/hugo-serverless-theme'
    });
   
    //Create the website bucket
    const websiteBucket = new Bucket(this, config.deploy.siteName + '-website', {
      websiteIndexDocument: 'index.html',
      bucketName: config.deploy.siteName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: true,
    });
    const certificateArn = StringParameter.valueForStringParameter(this, config.deploy.certificateArnSSM)
    const distribution = new CloudFrontWebDistribution(this, config.deploy.siteName + '-cfront', {
      originConfigs: [
        {
          customOriginSource: {
            domainName: `${apigw.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
            //~ originProtocolPolicy: cf.OriginProtocolPolicy.MATCH_VIEWER
            originPath: `/${apigw.deploymentStage.stageName}`
          },
          behaviors: [{
            pathPattern: '/api/*',
            allowedMethods: CloudFrontAllowedMethods.ALL,
            maxTtl: Duration.minutes(0),
            minTtl: Duration.minutes(0),
            defaultTtl: Duration.minutes(0),
            forwardedValues: {
              queryString: true,
              cookies: { forward: 'all'},
              headers: [ "Referer", "Authorization" ]
            },
          }]
        },
        {
          customOriginSource: {
            domainName: websiteBucket.bucketWebsiteDomainName,
            originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
          },
          behaviors : [ {isDefaultBehavior: true}]
        },
      ],
      viewerCertificate: ViewerCertificate.fromAcmCertificate(Certificate.fromCertificateArn(this, 'domainCert', certificateArn), {
        aliases: [config.deploy.siteName]
      })
    });
    
    // Create a file system in EFS to store information
    const vpc = new Vpc(this, 'Vpc', {
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Ingress',
          subnetType: SubnetType.ISOLATED,
        }
      ]
    });
    const dsSG = new SecurityGroup(this, 'SecurityGroup datasync', {
      vpc: vpc,
      allowAllOutbound: true,
    });
    dsSG.addIngressRule(Peer.anyIpv4(), Port.tcp(2049), 'datasync Ingress');
    dsSG.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'ssm Ingress');
    const fs = new efsFileSystem(this, 'DeployFileSystem', {
      vpc: vpc,
      removalPolicy: RemovalPolicy.DESTROY,
      securityGroup: dsSG
    });
    const accessPoint = fs.addAccessPoint('AccessPoint',{
      createAcl: {
        ownerGid: '65534',
        ownerUid: '65534',
        permissions: '777'
      },
      posixUser: {
        gid: '65534',
        uid: '65534'
      }
    });
    
    //create dataSync agent and task
    const dsRole = new Role(this, 'dataSyncRole', {
      assumedBy: new ServicePrincipal('datasync.amazonaws.com')
    });
    sourceBucket.grantReadWrite(dsRole)
    websiteBucket.grantReadWrite(dsRole)
    themeBucket.grantReadWrite(dsRole);
    
    const dsSourceBucket = new CfnLocationS3(this, 'sourceBucket datasync', {
      s3BucketArn: sourceBucket.bucketArn,
      s3Config: {
        bucketAccessRoleArn: dsRole.roleArn
      }
    });
    dsSourceBucket.node.addDependency(dsRole) 
    
    const dsWebsiteBucket = new CfnLocationS3(this, 'websiteBucket datasync', {
      s3BucketArn: websiteBucket.bucketArn,
      s3Config: {
        bucketAccessRoleArn: dsRole.roleArn
      }
    });
    dsWebsiteBucket.node.addDependency(dsRole) 
    
    const dsThemeBucket = new CfnLocationS3(this, 'themeBucket datasync', {
      s3BucketArn: themeBucket.bucketArn,
      s3Config: {
        bucketAccessRoleArn: dsRole.roleArn
      }
    });
    dsThemeBucket.node.addDependency(dsRole) 
    
    const dsSourceEFS = new CfnLocationEFS(this, 'EFS Source', {
      ec2Config: { 
        securityGroupArns: [`arn:aws:ec2:${props.env?.region}:${props.env?.account}:security-group/${dsSG.securityGroupId}`],
        subnetArn: `arn:aws:ec2:${props.env?.region}:${props.env?.account}:subnet/${vpc.selectSubnets({subnetGroupName: 'Ingress'}).subnets[0].subnetId}`
      },
      efsFilesystemArn: fs.fileSystemArn
    });
    dsSourceEFS.node.addDependency(fs)
    
    const dsWebsiteEFS = new CfnLocationEFS(this, 'EFS Website', {
      ec2Config: { 
        securityGroupArns: [`arn:aws:ec2:${props.env?.region}:${props.env?.account}:security-group/${dsSG.securityGroupId}`],
        subnetArn: `arn:aws:ec2:${props.env?.region}:${props.env?.account}:subnet/${vpc.selectSubnets({subnetGroupName: 'Ingress'}).subnets[0].subnetId}`
      },
      efsFilesystemArn: fs.fileSystemArn,
      subdirectory: '/public/'
    });
    dsWebsiteEFS.node.addDependency(fs)
    
    const dsSourceTask = new CfnTask(this, 'datasync source task', {
      destinationLocationArn: dsSourceEFS.attrLocationArn,
      sourceLocationArn: dsSourceBucket.attrLocationArn,
      excludes: [{
        filterType: 'SIMPLE_PATTERN',
        value: '/themes/hugo-serverless-theme',
      }]
    });
    const dsThemeTask = new CfnTask(this, 'datasync theme task', {
      destinationLocationArn: dsSourceEFS.attrLocationArn,
      sourceLocationArn: dsThemeBucket.attrLocationArn,
      includes: [{
        filterType: 'SIMPLE_PATTERN',
        value: '/themes/hugo-serverless-theme',
      }]
    });
    const dsWebsiteTask = new CfnTask(this, 'datasync website task', {
      destinationLocationArn: dsWebsiteBucket.attrLocationArn,
      sourceLocationArn: dsWebsiteEFS.attrLocationArn
    });
    
    // Create the lambda for all of the backend support
    const handler = new Function(this, 'hugoServerlessLambda', {
      functionName: 'hugoServerlessLambda',
      code: Code.fromAsset('functions/adminLambda', {exclude: ['test/*']}),
      handler: 'index.handler',
      memorySize: 128 ,
      timeout: Duration.seconds(600),
      runtime: Runtime.NODEJS_14_X,
      retryAttempts: 0,
    });
    websiteBucket.grantReadWrite(handler);
    //allow lambda to trigger dataSync
    handler.addToRolePolicy(new PolicyStatement({
      resources: [dsSourceTask.attrTaskArn,
        dsWebsiteTask.attrTaskArn,
        dsThemeTask.attrTaskArn],
      actions: ['datasync:StartTaskExecution',
        'datasync:DescribeTask'],
    }))
    handler.addToRolePolicy(new PolicyStatement({
      resources: ['*'],
      actions: ['ec2:DescribeNetworkInterfaces',
        'ec2:CreateNetworkInterface',
        'ec2:DeleteNetworkInterface',
        'ec2:DescribeInstances',
        'ec2:AttachNetworkInterface',
        //invalidate cloudfront
        'cloudfront:CreateInvalidation',
        'cloudfront:GetInvalidation',
        //manage vpc endpoints
        'ec2:CreateVpcEndpoint',
        'ec2:describeVpcEndpoints',
        'ec2:DeleteVpcEndpoints'
       ],
    }))
    
    // Allow Lambda to get SSM parameters
    handler.addToRolePolicy(new PolicyStatement({
      resources: [`arn:aws:ssm:${props.env?.region}:${props.env?.account}:parameter/hugoServerless`],
      actions: ['ssm:*'],
    }))
    
    // Create the s3 trigger
    const rsrc = new AwsCustomResource(this, 'SourceS3Notification', {
      policy: AwsCustomResourcePolicy.fromStatements([new PolicyStatement({
        actions: ["S3:PutBucketNotification"],
        resources: [sourceBucket.bucketArn],
      })]),
      onCreate: {
        service: 'S3',
        action: 'putBucketNotificationConfiguration',
        parameters: {
          // This bucket must be in the same region you are deploying to
          Bucket: sourceBucket.bucketName,
          NotificationConfiguration: {
            LambdaFunctionConfigurations: [{
              Events: ['s3:ObjectCreated:*'],
              LambdaFunctionArn: handler.functionArn,
              Filter: {
                Key: {
                  FilterRules: [{ Name: 'suffix', Value: 'md' }]
                }
              }
            }]
          }
        },
        // Always update physical ID so function gets executed
        physicalResourceId: PhysicalResourceId.of('S3NotifCustomResource' + Date.now().toString())
      }
    });
    handler.addPermission('AllowS3Invocation', {
      action: 'lambda:InvokeFunction',
      principal: new ServicePrincipal('s3.amazonaws.com'),
      sourceArn: sourceBucket.bucketArn,
    });
    rsrc.node.addDependency(handler.permissionsNode.findChild('AllowS3Invocation'));
    
    // Create the VPC lambda for Hugo generation
    const vpcHandler = new Function(this, 'hugoServerlessVpcLambda', {
      functionName: `hugoServerlessVpcLambda`,
      code: Code.fromAsset('functions/siteGeneratorLambda', {exclude: ['test/*']}),
      handler: 'index.handler',
      memorySize: config.deploy.buildMemory,
      timeout: Duration.seconds(600),
      runtime: Runtime.NODEJS_14_X,
      retryAttempts: 0,
      vpc: vpc,
      securityGroups: [ dsSG ],
      onSuccess: new LambdaDestination(handler, {
        responseOnly: true,
      }),
      filesystem: FileSystem.fromEfsAccessPoint(accessPoint, '/mnt/hugo')
    });
    
    vpcHandler.addToRolePolicy(new PolicyStatement({
      resources: ['*'],
      actions: ['ec2:DescribeNetworkInterfaces',
        'ec2:CreateNetworkInterface',
        'ec2:DeleteNetworkInterface',
        'ec2:DescribeInstances',
        'ec2:AttachNetworkInterface'],
    }))

    // Allow Lambda to get SSM parameters
    vpcHandler.addToRolePolicy(new PolicyStatement({
      resources: [`arn:aws:ssm:${props.env?.region}:${props.env?.account}:parameter/hugoServerless`],
      actions: ['ssm:*'],
    }))
    
    fs.grant(vpcHandler,'elasticfilesystem:*')
    
    const rule = new Rule(this, 'DataSyncRule', {
      eventPattern: {source: [ "aws.datasync" ],
        detailType: ["DataSync Task Execution State Change"],
        detail: { State: [ "SUCCESS"]}
      },
      targets: [ new LambdaFunction(vpcHandler),
        new LambdaFunction(handler)]
    });
   
    // setup route53 for website
    const hostedZoneId = StringParameter.valueForStringParameter(this, config.deploy.hostedZoneIdSSM)
    const myHostedZone = HostedZone.fromHostedZoneAttributes(this, config.deploy.siteName + '-hosted-zone', {
      hostedZoneId: hostedZoneId,
      zoneName: config.deploy.zoneName,
    });

    const aliasRecord = new ARecord(this, config.deploy.siteName + '-alias-record', {
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone: myHostedZone,
      recordName: config.deploy.siteName,
    });

    new StringParameter(this, "distID", {
      parameterName: '/hugoServerless/distID',
      stringValue: distribution.distributionId,
    });
    new StringParameter(this, "sourceBucket", {
      parameterName: '/hugoServerless/sourceBucket',
      stringValue: sourceBucket.bucketName,
    });
    new StringParameter(this, "themeBucket", {
      parameterName: '/hugoServerless/themeBucket',
      stringValue: themeBucket.bucketName,
    });
    new StringParameter(this, "deploymentLambda", {
      parameterName: '/hugoServerless/deploymentLambda',
      stringValue: vpcHandler.functionName,
    });
    new StringParameter(this, "routingLambda", {
      parameterName: '/hugoServerless/routingLambda',
      stringValue: handler.functionName,
    });
    new StringParameter(this, "siteName", {
      parameterName: '/hugoServerless/siteName',
      stringValue: config.deploy.siteName,
    });
    new StringParameter(this, "datasyncSourceTask", {
      parameterName: '/hugoServerless/datasyncSourceTask',
      stringValue: dsSourceTask.attrTaskArn,
    });
    new StringParameter(this, "datasyncThemeTask", {
      parameterName: '/hugoServerless/datasyncThemeTask',
      stringValue: dsThemeTask.attrTaskArn,
    });
    new StringParameter(this, "datasyncWebsiteTask", {
      parameterName: '/hugoServerless/datasyncWebsiteTask',
      stringValue: dsWebsiteTask.attrTaskArn,
    });
    new StringParameter(this, "vpcID", {
      parameterName: '/hugoServerless/vpcID',
      stringValue: vpc.vpcId,
    });
    new StringParameter(this, "subnetID", {
      parameterName: '/hugoServerless/subnetID',
      stringValue: vpc.isolatedSubnets[0].subnetId,
    });
    new StringParameter(this, "securityGroupID", {
      parameterName: '/hugoServerless/securityGroupID',
      stringValue: dsSG.securityGroupId,
    });
    
    if (config.email) {
      new StringParameter(this, "myEmail", {
        parameterName: '/hugoServerless/myEmail',
        stringValue: StringParameter.valueForStringParameter(this, config.email.myEmailSSM),
      });
      new StringParameter(this, "noReplyEmail", {
        parameterName: '/hugoServerless/noReplyEmail',
        stringValue: StringParameter.valueForStringParameter(this, config.email.noReplyEmailSSM),
      });
      //Lambda permisions for DynamoDB
      postsTable.grantReadWriteData(handler)
      
      //Let Lambda send email
      handler.addToRolePolicy(new PolicyStatement({
        resources: [`arn:aws:ses:${props.env?.region}:${props.env?.account}:identity/${config.deploy.zoneName}`],
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      }))
    }
  }
}
