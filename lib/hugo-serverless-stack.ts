import * as cdk from '@aws-cdk/core';
import { CloudFrontWebDistribution, OriginProtocolPolicy, CloudFrontAllowedMethods } from '@aws-cdk/aws-cloudfront'
import { Bucket, BlockPublicAccess } from '@aws-cdk/aws-s3';
import { Vpc, SubnetType, SecurityGroup, Peer, Port, InterfaceVpcEndpointAwsService } from '@aws-cdk/aws-ec2';
import { FileSystem as efsFileSystem }  from '@aws-cdk/aws-efs';
import { Rule } from'@aws-cdk/aws-events'
import { LambdaFunction } from '@aws-cdk/aws-events-targets'
import { Function, Code, Runtime, FileSystem, LayerVersion} from '@aws-cdk/aws-lambda';
import { LambdaDestination } from '@aws-cdk/aws-lambda-destinations';
import { PolicyStatement, Effect, AnyPrincipal, ServicePrincipal, Role } from '@aws-cdk/aws-iam';
import { HostedZone, ARecord, RecordTarget } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { CfnLocationS3, CfnLocationEFS , CfnTask } from '@aws-cdk/aws-datasync';
import { AwsCustomResource, PhysicalResourceId, AwsCustomResourcePolicy } from '@aws-cdk/custom-resources';
import { LambdaRestApi } from '@aws-cdk/aws-apigateway';

import * as fs from 'fs';
import * as toml from 'toml';
const config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));

interface myStackProps extends cdk.StackProps {
  apigw: LambdaRestApi;
}

export class HugoServerlessStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: myStackProps) {
    super(scope, id, props);
    const { apigw } = props;
    var sourceBucket;
    if (config.deploy.createNew) {
      //~ //Create a bucket to cache the source info for Hugo
      sourceBucket = new Bucket(this, 'Hugo Serverless Source', {
        bucketName: config.deploy.siteName+'-source',
        versioned: true,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        lifecycleRules: [{
          noncurrentVersionExpiration: cdk.Duration.days(30)
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
   
    //Create the website bucket
    const websiteBucket = new Bucket(this, config.deploy.siteName + '-website', {
      websiteIndexDocument: 'index.html',
      bucketName: config.deploy.siteName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
          },
          originPath: `/${apigw.deploymentStage.stageName}`,
          behaviors: [{
            pathPattern: '/api/*',
            allowedMethods: CloudFrontAllowedMethods.ALL,
            maxTtl: cdk.Duration.minutes(0),
            minTtl: cdk.Duration.minutes(0),
            defaultTtl: cdk.Duration.minutes(0),
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
      aliasConfiguration: {
        acmCertRef: certificateArn,
        names: [config.deploy.siteName]
      }
    });
    
    //Create the cloudfront distribution to cache the bucket
    //~ const distribution = new CloudFrontWebDistribution(this, config.deploy.siteName + '-cfront', {
      //~ originConfigs: [
        //~ {
          //~ customOriginSource: {
            //~ domainName: websiteBucket.bucketWebsiteDomainName,
            //~ originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
          //~ },
          //~ behaviors : [ {isDefaultBehavior: true}]
        //~ }
      //~ ],
      //~ aliasConfiguration: {
        //~ acmCertRef: certificateArn,
        //~ names: [config.deploy.siteName]
      //~ }
    //~ });
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
    const fs = new efsFileSystem(this, 'FileSystem', {
      vpc: vpc,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
      sourceLocationArn: dsSourceBucket.attrLocationArn
    });
    const dsWebsiteTask = new CfnTask(this, 'datasync website task', {
      destinationLocationArn: dsWebsiteBucket.attrLocationArn,
      sourceLocationArn: dsWebsiteEFS.attrLocationArn
    });
    
    // Create the lambda for all of the backend support
    const handler = new Function(this, 'hugoServerlessLambda', {
      functionName: 'hugoServerlessLambda',
      code: Code.fromAsset('functions/adminLambda'),
      handler: 'index.handler',
      memorySize: 128 ,
      timeout: cdk.Duration.seconds(600),
      runtime: Runtime.NODEJS_14_X,
      retryAttempts: 0,
    });
    websiteBucket.grantReadWrite(handler);
    //allow lambda to trigger dataSync
    handler.addToRolePolicy(new PolicyStatement({
      resources: [dsSourceTask.attrTaskArn,
        dsWebsiteTask.attrTaskArn],
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
      resources: [`arn:aws:ssm:${props.env?.region}:${props.env?.account}:parameter/hugoServerless/*`],
      actions: ['ssm:GetParameters'],
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
    
    //Lambda permisions for DynamoDB
    const emailsTable = StringParameter.valueForStringParameter(this, config.email.emailDynamoSSM);
    handler.addToRolePolicy(new PolicyStatement({
      resources: [`arn:aws:dynamodb:${props.env?.region}:${props.env?.account}:table/${emailsTable}`],
      actions: ["dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
    }));
    
    //Let Lambda send email
    handler.addToRolePolicy(new PolicyStatement({
      resources: ['arn:aws:ses:us-west-2:718523126320:identity/'+config.deploy.zoneName],
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    }))
    
    // Create the VPC lambda for Hugo generation
    const vpcHandler = new Function(this, 'hugoServerlessVpcLambda', {
      functionName: `hugoServerlessVpcLambda`,
      code: Code.fromAsset('functions/siteGeneratorLambda'),
      handler: 'handler.lambda_handler',
      memorySize: config.deploy.buildMemory,
      timeout: cdk.Duration.seconds(600),
      runtime: Runtime.PYTHON_3_7,
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
      resources: [`arn:aws:ssm:${props.env?.region}:${props.env?.account}:parameter/hugoServerless/*`],
      actions: ['ssm:GetParameters', 'ssm:GetParameter'],
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
    new StringParameter(this, "datasyncWebsiteTask", {
      parameterName: '/hugoServerless/datasyncWebsiteTask',
      stringValue: dsWebsiteTask.attrTaskArn,
    });
    new StringParameter(this, "emailDynamoSSM", {
      parameterName: '/hugoServerless/emailDynamoSSM',
      stringValue: emailsTable,
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
     
    new StringParameter(this, "noReplyEmail", {
      parameterName: '/hugoServerless/noReplyEmail',
      stringValue: StringParameter.valueForStringParameter(this, config.email.noReplyEmailSSM),
    });
  }
}
