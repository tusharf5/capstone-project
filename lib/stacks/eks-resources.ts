import { App, Stack, StackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";

import { PipelineConstruct } from "../constructs/codepipeline-construct";

export const vpcChildId = "vpc";

interface EksResourcesProps extends StackProps {
  vpc: Record<string, Vpc>;
  env: {
    account: string;
    region: string;
  };
}

export class EksResources extends Stack {
  constructor(scope: App, id: string, props: EksResourcesProps) {
    super(scope, id, props);

    const eksPipelineStack = new PipelineConstruct(this, "eks-cluster", {
      vpc: props.vpc,
      env: {
        account: props.env.account,
        region: props.env.region,
      },
    });
  }
}
