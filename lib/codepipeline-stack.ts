import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  EksBlueprint,
  CodePipelineStack,
} from "@aws-quickstart/eks-blueprints";
import { ArnPrincipal } from "aws-cdk-lib/aws-iam";

import {
  devConfig,
  testConfig,
  prodConfig,
  githubConfig,
  teams,
} from "../config";
import { TeamApplication, TeamPlatform } from "./teams/main";

export class PipelineConstruct extends Construct {
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

    const platformUsers = teams.platformDev.users.map((dev) => {
      return new ArnPrincipal(`arn:aws:iam::${dev.account}:user/${dev.name}`);
    });

    const appUsers = teams.appDev.users.map((dev) => {
      return new ArnPrincipal(`arn:aws:iam::${dev.account}:user/${dev.name}`);
    });

    const blueprint = EksBlueprint.builder()
      .account(account)
      .region(region)
      .addOns()
      .teams(
        new TeamPlatform(teams.platformDev.name, platformUsers),
        new TeamApplication(teams.appDev.name, appUsers)
      );

    CodePipelineStack.builder()
      .name(`${id}-codepipeline`)
      .owner(githubConfig.owner)
      .repository({
        repoUrl: githubConfig.repoUrl,
        credentialsSecretName: githubConfig.credentialsSecretName,
        targetRevision: githubConfig.targetRevision,
      })
      .wave({
        id: "envs",
        stages: [
          { id: devConfig.id, stackBuilder: blueprint.clone(devConfig.region) },
          {
            id: testConfig.id,
            stackBuilder: blueprint.clone(testConfig.region),
          },
          {
            id: prodConfig.id,
            stackBuilder: blueprint.clone(prodConfig.region),
          },
        ],
      })
      .build(scope, id + "-stack", props);
  }
}
