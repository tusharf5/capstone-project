#!/usr/bin/env node
import "source-map-support/register";

import { App } from "aws-cdk-lib";

import { BaseResources } from "../lib/stacks/base-resources";
import { PipelineConstruct } from "../lib/constructs/codepipeline-construct";

import * as config from "../config";

const app = new App();

if (!process.env.CDK_DEFAULT_ACCOUNT) {
  throw new Error("`CDK_DEFAULT_ACCOUNT` environment variable is undefined.");
}

if (!process.env.CDK_DEFAULT_REGION) {
  throw new Error("`CDK_DEFAULT_REGION` environment variable is undefined.");
}

const baseResourcesStackUsEast1 = new BaseResources(
  app,
  config.stackIds.baseResources("us-east-1"),
  {
    env: {
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);

const baseResourcesStackUsEast2 = new BaseResources(
  app,
  config.stackIds.baseResources("us-east-2"),
  {
    env: {
      region: "us-east-2",
    },
  }
);

const baseResourcesStackUsWast2 = new BaseResources(
  app,
  config.stackIds.baseResources("us-west-2"),
  {
    env: {
      region: "us-west-2",
    },
  }
);

const eksPipelineStack = new PipelineConstruct(
  app,
  config.stackIds.eksPipeline,
  {
    vpc: {
      "us-east-1": baseResourcesStackUsEast1.vpc,
      "us-east-2": baseResourcesStackUsEast2.vpc,
      "us-west-2": baseResourcesStackUsWast2.vpc,
    },
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);
