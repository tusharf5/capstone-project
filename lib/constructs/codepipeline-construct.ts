import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as blueprints from "@aws-quickstart/eks-blueprints";
import * as iam from "aws-cdk-lib/aws-iam";
import * as eks from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";

import * as config from "../../config";

import { TeamApplication, TeamPlatform } from "../teams/main";
import { vpcCniAddOn } from "../addons/vpc-cni/main";
import { karpenterAddOn } from "../addons/karpenter/main";

interface PipelineProps extends StackProps {
  env: {
    account: string;
    region: string;
  };
}

export class PipelineConstruct extends Construct {
  constructor(scope: Construct, id: string, props: PipelineProps) {
    super(scope, id);

    const account = props.env.account;

    const platformUsers = config.teams.platformDev.users.map((dev) => {
      return new iam.ArnPrincipal(
        `arn:aws:iam::${dev.account}:user/${dev.name}`
      );
    });

    const appUsers = config.teams.appDev.users.map((dev) => {
      return new iam.ArnPrincipal(
        `arn:aws:iam::${dev.account}:user/${dev.name}`
      );
    });

    const albControllerProps: eks.AlbControllerOptions = {
      version: eks.AlbControllerVersion.V2_4_1,
    };

    const getClustProvider: (env: string) => blueprints.ClusterProvider = (
      env
    ) => {
      return new blueprints.ClusterBuilder()
        .withCommonOptions({
          clusterName: `${env}-${config.projectName}`,
          endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
          serviceIpv4Cidr: "10.100.0.0/16",
          version: eks.KubernetesVersion.V1_21,
          albController: albControllerProps,
        })
        .managedNodeGroup({
          id: "general-purpose-node",
          minSize: 1,
          maxSize: 10,
          desiredSize: 2,
          instanceTypes: [new ec2.InstanceType("m5.large")],
          amiType: eks.NodegroupAmiType.AL2_X86_64,
          nodeGroupCapacityType: eks.CapacityType.ON_DEMAND,
          amiReleaseVersion: "1.21.12-20220526",
          nodeGroupSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
        })
        .build();
    };

    const getKarpenterAddon: (env: string) => blueprints.ClusterAddOn = (env) =>
      karpenterAddOn({
        provisionerSpecs: {
          "node.kubernetes.io/instance-type": ["m5.large"],
          "topology.kubernetes.io/zone": this.node.tryGetContext(
            `availability-zones:account=${account}:region=${
              env === config.environments.dev.name
                ? config.environments.dev.region
                : env === config.environments.test.name
                ? config.environments.test.region
                : config.environments.prod.region
            }`
          ),
          "kubernetes.io/arch": ["amd64"],
          "karpenter.sh/capacity-type": ["on-demand"],
        },
        subnetTags: {
          [`karpenter.sh/discovery/cluster`]: `${env}-${config.projectName}`,
        },
        securityGroupTags: {
          [`karpenter.sh/discovery/cluster`]: `${env}-${config.projectName}`,
        },
      });

    const blueprint = blueprints.EksBlueprint.builder()
      .account(account)
      .addOns(vpcCniAddOn)
      .teams(
        new TeamPlatform(config.teams.platformDev.name, platformUsers),
        new TeamApplication(config.teams.appDev.name, appUsers)
      );

    blueprints.CodePipelineStack.builder()
      .name(`${id}-codepipeline`)
      .owner(config.githubConfig.owner)
      .repository({
        repoUrl: config.githubConfig.repoUrl,
        credentialsSecretName: config.githubConfig.credentialsSecretName,
        targetRevision: config.githubConfig.targetRevision,
      })
      .wave({
        id: "envs",
        stages: [
          {
            id: config.environments.dev.name,
            stackBuilder: blueprint
              .clone(config.environments.dev.region)
              .clusterProvider(getClustProvider(config.environments.dev.name))
              .addOns(getKarpenterAddon(config.environments.dev.name)),
          },
          {
            id: config.environments.test.name,
            stackBuilder: blueprint
              .clone(config.environments.test.region)
              .clusterProvider(getClustProvider(config.environments.test.name))
              .addOns(getKarpenterAddon(config.environments.test.name)),
          },
          {
            id: config.environments.prod.name,
            stackBuilder: blueprint
              .clone(config.environments.prod.region)
              .clusterProvider(getClustProvider(config.environments.prod.name))
              .addOns(getKarpenterAddon(config.environments.prod.name)),
          },
        ],
      })
      .build(scope, id + "-stack", props);
  }
}
