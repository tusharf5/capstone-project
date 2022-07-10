import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { projectName } from "../../config";

import { CoreStack } from "../stacks/core-stack";
import { BlueprintStack } from "../stacks/eks-cluster";

interface StageProps extends cdk.StageProps {
  stage: string;
  cidr: string;
}

export class CoreCiStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    new CoreStack(this, `${projectName}-core-${props.stage}`, {
      stage: props.stage,
      cidr: props.cidr,
      env: {
        account: props.env?.account!,
        region: props.env?.region!,
      },
    });
  }
}
