import * as cdk from '@aws-cdk/core';
import { CloudFrontWebDistribution, OriginAccessIdentity, OriginProtocolPolicy } from '@aws-cdk/aws-cloudfront'
import { Bucket, BlockPublicAccess } from '@aws-cdk/aws-s3';
import { Vpc, SubnetType, SecurityGroup, Peer, Port, InterfaceVpcEndpointAwsService } from '@aws-cdk/aws-ec2';
import { FileSystem as efsFileSystem }  from '@aws-cdk/aws-efs';
import { Rule } from'@aws-cdk/aws-events'
import { LambdaFunction } from '@aws-cdk/aws-events-targets'
import { Function, Code, Runtime, FileSystem, LayerVersion } from '@aws-cdk/aws-lambda';
import { PolicyStatement, Effect, AnyPrincipal, ServicePrincipal, Role } from '@aws-cdk/aws-iam';
import { HostedZone, ARecord, RecordTarget } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { CfnLocationS3, CfnLocationEFS , CfnTask } from '@aws-cdk/aws-datasync';
import { AwsCustomResource, PhysicalResourceId, AwsCustomResourcePolicy } from '@aws-cdk/custom-resources';

import * as fs from 'fs';
import * as toml from 'toml';
const config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));

export class HugoServerlessStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    //Create a bucket to cache the source info for Hugo
    //~ const sourceBucket = new Bucket(this, 'Hugo Serverless Source', {
      //~ bucketName: config.deploy.siteName+'-source',
      //~ versioned: true,
      //~ blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      //~ removalPolicy: cdk.RemovalPolicy.RETAIN,
      //~ lifecycleRules: [{
        //~ noncurrentVersionExpiration: cdk.Duration.days(30)
      //~ }],
    //~ });
    const sourceBucket = Bucket.fromBucketName(this, 'imported-bucket-from-name',
      config.deploy.siteName+'-source',
    );
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
    //~ //Create the cloudfront distribution to cache the bucket
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
        //~ acmCertRef: config.deploy.certificateArn,
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
    
    const fs = new efsFileSystem(this, 'FileSystem', {
      vpc: vpc,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      securityGroup: dsSG
    });
    const accessPoint = fs.addAccessPoint('AccessPoint',{
      createAcl: {
        ownerGid: '1001',
        ownerUid: '1001',
        permissions: '750'
      },
      posixUser: {
        gid: '1001',
        uid: '1001'
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
      code: Code.fromAsset('adminLambda'),
      handler: 'index.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(240),
      runtime: Runtime.NODEJS_14_X,
      retryAttempts: 0,
    });
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
        'ec2:AttachNetworkInterface'],
    }))
    // Allow Lambda to get SSM parameters
    handler.addToRolePolicy(new PolicyStatement({
      resources: [`arn:aws:ssm:${props.env?.region}:${props.env?.account}:parameter/AlwaysOnward/*`,
        `arn:aws:ssm:${props.env?.region}:${props.env?.account}:parameter/OnwardBlog/*`],
      actions: ['ssm:GetParameters'],
    }))
    
    // Create the s3 trigger
    const rsrc = new AwsCustomResource(this, 'S3Notification', {
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
              LambdaFunctionArn: handler.functionArn
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
    const emailsTable = StringParameter.valueForStringParameter(this, '/AlwaysOnward/emailsTable');
    handler.addToRolePolicy(new PolicyStatement({
      resources: [`arn:aws:dynamodb:${props.env?.region}:${props.env?.account}:table/${emailsTable}`],
      actions: ["dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
    }));
    
    //Let Lambda send email
    const noreplyemail = StringParameter.valueForStringParameter(this, '/AlwaysOnward/noReplyEmail');
    handler.addToRolePolicy(new PolicyStatement({
      resources: ['arn:aws:ses:us-west-2:718523126320:identity/'+config.deploy.zoneName],
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    }))
    
    // Create the VPC lambda for Hugo generation
    const vpcHandler = new Function(this, 'hugoServerlessVpcLambda', {
      functionName: `hugoServerlessVpcLambda`,
      code: Code.fromAsset('siteGenerator'),
      handler: 'handler.lambda_handler',
      memorySize: 10240,
      timeout: cdk.Duration.seconds(600),
      runtime: Runtime.PYTHON_3_7,
      retryAttempts: 0,
      vpc: vpc,
      securityGroups: [ dsSG ],
      filesystem: FileSystem.fromEfsAccessPoint(accessPoint, '/mnt/hugo')
    });
    //allow the vpc lambda to call other lambda
    const callLambda = vpc.addInterfaceEndpoint('lambda', {
      service: InterfaceVpcEndpointAwsService.LAMBDA,
    });
    callLambda.connections.allowDefaultPortFrom(vpcHandler);
    handler.grantInvoke(vpcHandler);
    
    //allow the vpc lambda to access SSM parameters
    const callSSM = vpc.addInterfaceEndpoint('SSM', {
      service: InterfaceVpcEndpointAwsService.SSM,
    });
    callSSM.connections.allowDefaultPortFrom(vpcHandler);
    
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
      resources: [`arn:aws:ssm:${props.env?.region}:${props.env?.account}:parameter/AlwaysOnward/*`,
        `arn:aws:ssm:${props.env?.region}:${props.env?.account}:parameter/OnwardBlog/*`],
      actions: ['ssm:GetParameters'],
    }))
    
    fs.grant(vpcHandler,'elasticfilesystem:*'
    
    const rule = new Rule(this, 'DataSyncRule', {
      eventPattern: {source: [ "aws.datasync" ],
        detailType: ["DataSync Task Execution State Change"],
        detail: { State: [ "SUCCESS"]}
      },
      targets: [ new LambdaFunction(vpcHandler),
        new LambdaFunction(handler)]
    });
   
    // setup route53 for website
    const myHostedZone = HostedZone.fromHostedZoneAttributes(this, config.deploy.siteName + '-hosted-zone', {
      hostedZoneId: config.deploy.hostedZoneId,
      zoneName: config.deploy.zoneName,
    });

    //~ const aliasRecord = new ARecord(this, config.deploy.siteName + '-alias-record', {
      //~ target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      //~ zone: myHostedZone,
      //~ recordName: config.deploy.siteName,
    //~ });

    //~ new StringParameter(this, "distID", {
      //~ parameterName: '/OnwardBlog/distID',
      //~ stringValue: distribution.distributionId,
    //~ });
    new StringParameter(this, "sourceBucket", {
      parameterName: '/OnwardBlog/sourceBucket',
      stringValue: sourceBucket.bucketName,
    });
    new StringParameter(this, "deploymentLambda", {
      parameterName: '/OnwardBlog/deploymentLambda',
      stringValue: handler.functionName,
    });
    new StringParameter(this, "siteName", {
      parameterName: '/OnwardBlog/siteName',
      stringValue: config.deploy.siteName,
    });
    new StringParameter(this, "datasyncSourceTask", {
      parameterName: '/OnwardBlog/datasyncSourceTask',
      stringValue: dsSourceTask.attrTaskArn,
    });
    new StringParameter(this, "datasyncWebsiteTask", {
      parameterName: '/OnwardBlog/datasyncWebsiteTask',
      stringValue: dsWebsiteTask.attrTaskArn,
    });
    
  }
}
