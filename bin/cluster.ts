#!/usr/bin/env node
import "source-map-support/register";

import { App } from "aws-cdk-lib";

import * as config from "../config";
import { BlueprintsCiStack } from "../lib/stacks/core-stack-pipeline";
import { BlueprintStack } from "../lib/stacks/eks-cluster";

const app = new App();

if (!process.env.CDK_DEFAULT_ACCOUNT) {
  throw new Error("`CDK_DEFAULT_ACCOUNT` environment variable is undefined.");
}

if (!process.env.CDK_DEFAULT_REGION) {
  throw new Error("`CDK_DEFAULT_REGION` environment variable is undefined.");
}

new BlueprintsCiStack(app, `blueprint-cicd-stack`, {
  stage: config.environments.dev.name,
  cidr: config.environments.dev.cidr,
  branch: "main",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.environments.dev.region,
  },
});

new BlueprintStack(app, `${config.projectName}-eks-pipeline`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.environments.dev.region,
  },
  stage: config.environments.dev.name,
});
