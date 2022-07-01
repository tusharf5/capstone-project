#!/usr/bin/env node
import "source-map-support/register";

import { App } from "aws-cdk-lib";

import { BlueprintStack } from "../lib/constructs/codepipeline-construct";

import * as config from "../config";
import { BaseStack } from "../lib/stacks/base";

const app = new App();

if (!process.env.CDK_DEFAULT_ACCOUNT) {
  throw new Error("`CDK_DEFAULT_ACCOUNT` environment variable is undefined.");
}

if (!process.env.CDK_DEFAULT_REGION) {
  throw new Error("`CDK_DEFAULT_REGION` environment variable is undefined.");
}

const devBase = new BaseStack(app, `${config.projectName}-core`, {
  stage: config.environments.dev.name,
  cidr: config.environments.dev.cidr,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.environments.dev.region,
  },
});

const devBlueprints = new BlueprintStack(
  app,
  `${config.projectName}-eks-pipeline`,
  {
    stackName: `${config.projectName}-eks-pipeline`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: config.environments.dev.region,
    },
    stage: config.environments.dev.name,
  }
);

devBlueprints.addDependency(devBase);
