#!/usr/bin/env node

import "source-map-support/register";

import { App } from "aws-cdk-lib";

import { ClusterConstruct } from "../lib/cluster-stack";
import { PipelineConstruct } from "../lib/codepipeline-stack";
import * as config from "../config";

const app = new App();

if (!process.env.CDK_DEFAULT_ACCOUNT) {
  throw new Error("`CDK_DEFAULT_ACCOUNT` environment variable is undefined.");
}

if (!process.env.CDK_DEFAULT_REGION) {
  throw new Error("`CDK_DEFAULT_REGION` environment variable is undefined.");
}

new ClusterConstruct(app, `${config.projectName}-cluster`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new PipelineConstruct(app, `${config.projectName}-pipeline`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
