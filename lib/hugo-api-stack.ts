import * as cdk from '@aws-cdk/core';
import { Function, Code, Runtime } from "@aws-cdk/aws-lambda";
import { StringParameter } from '@aws-cdk/aws-ssm';
import { PolicyStatement, ServicePrincipal } from '@aws-cdk/aws-iam';
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
import { LambdaRestApi, AuthorizationType } from '@aws-cdk/aws-apigateway';

import * as fs from 'fs';
import * as toml from 'toml';
const config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));

//~ import console = require('console');

export class HugoApiStack extends cdk.Stack {
  public readonly apigw: LambdaRestApi;
  constructor(scope: cdk.App, id: string, props: cdk.StackProps ) {
    super(scope, id, props);

    if (config.cognito) {
      // -------------------------------- Infrastructure for routing front-end requests ----------------------------
      //Create the routing Lambda
      const handler = new Function(this, 'hugoServerlessApiLambda', {
        functionName: `hugoServerlessApiLambda`,
        code: Code.fromAsset('functions/apiLambda', {exclude: ['test/*']}),
        handler: 'index.handler',
        memorySize: 512,
        timeout: cdk.Duration.seconds(120),
        runtime: Runtime.NODEJS_14_X,
        retryAttempts: 0
      });
      handler.addToRolePolicy(new PolicyStatement({
        resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/hugoServerless/*`, 
          `arn:aws:ssm:${this.region}:${this.account}:parameter/hugoServerless`],
        actions: ['ssm:GetParameters', 'ssm:GetParametersByPath'],
      }))
      //create an API gateway to trigger the lambda
      this.apigw = new LambdaRestApi(this, "api", {
        handler: handler,
        defaultMethodOptions: {
          authorizationType: AuthorizationType.NONE
        },
        binaryMediaTypes: ['*/*'],
        description: `Simple lambda API. Timestamp: ${Date.now()}`
      });
      
      // Create Dynamo DB table to store comments
      const commentsTable = new Table(this, 'CommentsTable', {
        partitionKey: { name: 'postPath', type: AttributeType.STRING },
        sortKey: {name: 'commentId', type: AttributeType.STRING},
        billingMode: BillingMode.PROVISIONED,
      });
      commentsTable.autoScaleWriteCapacity({
        minCapacity: 1,
        maxCapacity: 5,
      }).scaleOnUtilization({ targetUtilizationPercent: 75 });
      commentsTable.grantReadWriteData(handler)
      
      new StringParameter(this, "UserPoolId", {
        parameterName: '/hugoServerless/UserPoolId',
        stringValue: StringParameter.valueForStringParameter(this, config.cognito.UserPoolIdSSM),
      });   
      new StringParameter(this, "UserPoolClientId", {
        parameterName: '/hugoServerless/UserPoolClientId',
        stringValue: StringParameter.valueForStringParameter(this, config.cognito.UserPoolClientIdSSM),
      });   
      new StringParameter(this, "AuthDomain", {
        parameterName: '/hugoServerless/AuthDomain',
        stringValue: StringParameter.valueForStringParameter(this, config.cognito.AuthDomain),
      });   
    }
  }
}
