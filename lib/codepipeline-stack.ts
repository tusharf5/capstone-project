import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  EksBlueprint,
  CodePipelineStack,
  type ClusterAddOn,
} from "@aws-quickstart/eks-blueprints";
import { ArnPrincipal } from "aws-cdk-lib/aws-iam";

import {
  devConfig,
  testConfig,
  prodConfig,
  githubConfig,
  teams,
  clusterName,
} from "../config";

import { TeamApplication, TeamPlatform } from "./teams/main";

import { vpcCniAddOn } from "./addons/vpc-cni/main";
import { karpenterAddOn } from "./addons/karpenter/main";
import { clusterProvider } from "./providers/cluster-provider";

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

    const getKarpenterAddon: (env: string) => ClusterAddOn = (env) =>
      karpenterAddOn({
        provisionerSpecs: {
          "node.kubernetes.io/instance-type": ["m5.large"],
          "topology.kubernetes.io/zone": this.node.tryGetContext(
            `availability-zones:account=${account}:region=${
              env === "dev"
                ? devConfig.region
                : env === "test"
                ? testConfig.region
                : prodConfig.region
            }`
          ),
          "kubernetes.io/arch": ["amd64"],
          "karpenter.sh/capacity-type": ["on-demand", "spot"],
        },
        subnetTags: {
          [`karpenter.sh/discovery/cluster`]: `${env}-${clusterName}`,
        },
        securityGroupTags: {
          [`karpenter.sh/discovery/cluster`]: `${env}-${clusterName}`,
        },
      });

    const blueprint = EksBlueprint.builder()
      .clusterProvider(clusterProvider)
      .account(account)
      .region(region)
      .addOns(vpcCniAddOn)
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
          {
            id: devConfig.id,
            stackBuilder: blueprint
              .clone(devConfig.region)
              .addOns(getKarpenterAddon(devConfig.id)),
          },
          {
            id: testConfig.id,
            stackBuilder: blueprint
              .clone(testConfig.region)
              .addOns(getKarpenterAddon(devConfig.id)),
          },
          {
            id: prodConfig.id,
            stackBuilder: blueprint
              .clone(prodConfig.region)
              .addOns(getKarpenterAddon(devConfig.id)),
          },
        ],
      })
      .build(scope, id + "-stack", props);
  }
}
