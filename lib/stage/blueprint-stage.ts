import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { BlueprintStack } from "../stacks/eks-pipeline-stack";

import * as config from "../../config";

interface StageProps extends cdk.StageProps {
  stage: string;
  cidr: string;
}

export class BlueprintStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    new BlueprintStack(this, `${config.projectName}-eks-pipeline`, {
      env: {
        account: props.env?.account!,
        region: props.env?.region!,
      },
      stage: props.stage,
    });
  }
}
