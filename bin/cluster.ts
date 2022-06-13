#!/usr/bin/env node
import "source-map-support/register";

import { App } from "aws-cdk-lib";

import { PipelineConstruct } from "../lib/constructs/codepipeline-construct";

import * as config from "../config";

const app = new App();

if (!process.env.CDK_DEFAULT_ACCOUNT) {
  throw new Error("`CDK_DEFAULT_ACCOUNT` environment variable is undefined.");
}

if (!process.env.CDK_DEFAULT_REGION) {
  throw new Error("`CDK_DEFAULT_REGION` environment variable is undefined.");
}

const eksPipelineStack = new PipelineConstruct(
  app,
  config.stackIds.eksPipeline,
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);
