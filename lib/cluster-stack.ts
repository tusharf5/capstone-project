import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { EksBlueprint } from "@aws-quickstart/eks-blueprints";

export class ClusterConstruct extends Construct {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);

    const account = props?.env?.account;
    const region = props?.env?.region;

    if (!account) {
      throw new Error("undefined aws account");
    }

    if (!region) {
      throw new Error("undefined aws region");
    }

    const blueprint = EksBlueprint.builder()
      .account(account)
      .region(region)
      .addOns()
      .teams()
      .build(scope, id + "-stack");
  }
}
