#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { HugoServerlessStack } from './hugo-serverless-stack';
import { HugoPhotosStack } from './hugo-photos-stack';
import { HugoApiStack } from './hugo-api-stack';

const app = new cdk.App();

import * as fs from 'fs';
import * as toml from 'toml';
const config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: config.deploy.region
}

new HugoPhotosStack(app, 'HugoPhotosStack', {
  stackName: 'HugoPhotosStack',
  env: env
});

const api = new HugoApiStack(app, 'HugoApiStack', {
  stackName: 'HugoApiStack',
  env: env
});

new HugoServerlessStack(app, 'HugoServerlessStack', {
  apigw: api.apigw,
  stackName: 'HugoServerlessStack',
  env: env
});



