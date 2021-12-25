import * as cdk from '@aws-cdk/core';
import { Bucket, BlockPublicAccess } from '@aws-cdk/aws-s3';
import { User } from '@aws-cdk/aws-iam';

export class HugoPhotosStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    //~ //Create a bucket to upload photos to - either directly from a phone or from an upload from a digital camera
    photoBucket = new Bucket(this, 'Hugo Photos', {
      bucketName: config.deploy.siteName+'-photos',
      versioned: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [{
        expiration: cdk.Duration.days(60)
      }],
    });
    const uploadUser = new User(this, 'uploadUser', {
      userName: 'uploadUser',
      managedPolicies: [ new PolicyStatement({
        resources: [
          photoBucket.arnForObjects("*"),
          photoBucket.bucketArn,
        ],
        actions: ["s3:*"],
        principals: [new AnyPrincipal()],
      })],
    });
  }
}
