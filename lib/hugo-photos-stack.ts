import { App, Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { User, AnyPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

import * as fs from 'fs';
import * as toml from 'toml';
const config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));

export class HugoPhotosStack extends Stack {
  constructor(scope: App, id: string, props: StackProps) {
    super(scope, id, props);
    //~ //Create a bucket to upload photos to - either directly from a phone or from an upload from a digital camera
    const photoBucket = new Bucket(this, 'Hugo Photos', {
      bucketName: config.deploy.siteName+'-photos',
      versioned: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      lifecycleRules: [{
        expiration: Duration.days(60)
      }],
    });
    const uploadUser = new User(this, 'uploadUser', {
      userName: 'uploadUser'
    });
    uploadUser.addToPrincipalPolicy(new PolicyStatement({
      resources: [
        photoBucket.arnForObjects("*"),
        photoBucket.bucketArn,
      ],
      actions: ["s3:*"]
    }));
    uploadUser.addToPrincipalPolicy(new PolicyStatement({
      resources: ['*'],
      actions: ["s3:ListAllMyBuckets"]
    }));
    new StringParameter(this, "photosBucket", {
      parameterName: '/hugoServerless/photosBucket',
      stringValue: photoBucket.bucketName,
    });
  }
}
