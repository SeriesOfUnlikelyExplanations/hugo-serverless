import { App, Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Function, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { LambdaRestApi, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';

import * as fs from 'fs';
import * as toml from 'toml';
const config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));

//~ import console = require('console');

export class HugoApiStack extends Stack {
  public readonly apigw: LambdaRestApi;
  constructor(scope: App, id: string, props: StackProps ) {
    super(scope, id, props);
    // Create Dynamo DB table to store comments & emails
    const postsTable = new Table(this, 'postsTable', {
      partitionKey: { name: 'postPath', type: AttributeType.STRING },
      billingMode: BillingMode.PROVISIONED,
    });
    postsTable.autoScaleWriteCapacity({
      minCapacity: 1,
      maxCapacity: 5,
    }).scaleOnUtilization({ targetUtilizationPercent: 75 });
    
    new StringParameter(this, 'postsTableSSM', {
      parameterName: '/hugoServerless/postsTable',
      stringValue: postsTable.tableName
    });
    
    if (config.cognito) {
      // -------------------------------- Infrastructure for routing front-end requests ----------------------------
      //Create the routing Lambda
      const handler = new Function(this, 'hugoServerlessApiLambda', {
        functionName: `hugoServerlessApiLambda`,
        code: Code.fromAsset('functions/apiLambda', {exclude: ['test/*']}),
        handler: 'index.handler',
        memorySize: 512,
        timeout: Duration.seconds(120),
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
      
      postsTable.grantReadWriteData(handler)
      
      new StringParameter(this, "UserPoolId", {
        parameterName: '/hugoServerless/UserPoolId',
        stringValue: StringParameter.valueForStringParameter(this, config.cognito.UserPoolIdSSM),
      });   
      new StringParameter(this, "UserPoolClientId", {
        parameterName: '/hugoServerless/UserPoolClientId',
        stringValue: StringParameter.valueForStringParameter(this, config.cognito.UserPoolClientIdSSM),
      });
      new StringParameter(this, 'UserPoolClientSecret', {
        parameterName: '/hugoServerless/UserPoolClientSecret',
        stringValue: StringParameter.valueForStringParameter(this, config.cognito.UserPoolClientSecretSSM),
      });
      new StringParameter(this, "AuthDomain", {
        parameterName: '/hugoServerless/AuthDomain',
        stringValue:config.cognito.AuthDomain,
      });   
    }
  }
}
