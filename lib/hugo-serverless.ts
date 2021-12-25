#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { HugoServerlessStack } from './hugo-serverless-stack';
import { HugoPhotosStack } from './hugo-photos-stack';

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

new HugoServerlessStack(app, 'HugoServerlessStack', {
  stackName: 'HugoServerlessStack',
  env: env
});

