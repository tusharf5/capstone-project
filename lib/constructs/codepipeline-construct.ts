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
    const region = props.env.region;

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
              env === "dev"
                ? config.devConfig.region
                : env === "test"
                ? config.testConfig.region
                : config.prodConfig.region
            }`
          ),
          "kubernetes.io/arch": ["amd64"],
          "karpenter.sh/capacity-type": ["on-demand", "spot"],
        },
        subnetTags: {
          [`karpenter.sh/discovery/cluster`]: `${env}-${config.clusterName}`,
        },
        securityGroupTags: {
          [`karpenter.sh/discovery/cluster`]: `${env}-${config.clusterName}`,
        },
      });

    const blueprint = blueprints.EksBlueprint.builder()
      .account(account)
      .region(region)
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
            id: config.devConfig.id,
            stackBuilder: blueprint
              .clone(config.devConfig.region)
              .clusterProvider(getClustProvider(config.devConfig.id))
              .addOns(getKarpenterAddon(config.devConfig.id)),
          },
          {
            id: config.testConfig.id,
            stackBuilder: blueprint
              .clone(config.testConfig.region)
              .clusterProvider(getClustProvider(config.testConfig.id))
              .addOns(getKarpenterAddon(config.testConfig.id)),
          },
          {
            id: config.prodConfig.id,
            stackBuilder: blueprint
              .clone(config.prodConfig.region)
              .clusterProvider(getClustProvider(config.prodConfig.id))
              .addOns(getKarpenterAddon(config.prodConfig.id)),
          },
        ],
      })
      .build(scope, id + "-stack", props);
  }
}
