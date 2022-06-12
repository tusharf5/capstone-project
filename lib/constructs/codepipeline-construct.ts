import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  EksBlueprint,
  CodePipelineStack,
  type ClusterAddOn,
  ClusterProvider,
  ClusterBuilder,
} from "@aws-quickstart/eks-blueprints";
import {
  AccountRootPrincipal,
  ArnPrincipal,
  ManagedPolicy,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";

import {
  devConfig,
  testConfig,
  prodConfig,
  githubConfig,
  teams,
  clusterName,
  projectName,
  stackIds,
} from "../../config";

import { TeamApplication, TeamPlatform } from "../teams/main";

import { vpcCniAddOn } from "../addons/vpc-cni/main";
import { karpenterAddOn } from "../addons/karpenter/main";

import {
  AlbControllerOptions,
  AlbControllerVersion,
  CapacityType,
  EndpointAccess,
  KubernetesVersion,
  NodegroupAmiType,
} from "aws-cdk-lib/aws-eks";
import { InstanceType, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";

interface PipelineProps extends StackProps {
  vpc: Record<string, Vpc>;
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

    const platformUsers = teams.platformDev.users.map((dev) => {
      return new ArnPrincipal(`arn:aws:iam::${dev.account}:user/${dev.name}`);
    });

    const appUsers = teams.appDev.users.map((dev) => {
      return new ArnPrincipal(`arn:aws:iam::${dev.account}:user/${dev.name}`);
    });

    const albControllerProps: AlbControllerOptions = {
      version: AlbControllerVersion.V2_4_1,
    };

    const getClustProvider: (env: string) => ClusterProvider = (env) =>
      new ClusterBuilder()
        .withCommonOptions({
          clusterName: `${env}-${projectName}`,
          endpointAccess: EndpointAccess.PUBLIC_AND_PRIVATE,
          // mastersRole: new Role(
          //   this,
          //   `${env}-${projectName}-eks-masters-role`,
          //   {
          //     assumedBy: new AccountRootPrincipal(),
          //   }
          // ),
          serviceIpv4Cidr: "10.100.0.0/16",
          // role: new Role(this, `${env}-${projectName}-eks-cluster-role`, {
          //   assumedBy: new ServicePrincipal("eks.amazonaws.com"),
          //   managedPolicies: [
          //     ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSClusterPolicy"),
          //   ],
          // }),
          vpc: props.vpc[env],
          version: KubernetesVersion.V1_21,
          albController: albControllerProps,
        })
        .managedNodeGroup({
          id: "general-purpose-node",
          minSize: 1,
          maxSize: 10,
          desiredSize: 2,
          instanceTypes: [new InstanceType("m5.large")],
          amiType: NodegroupAmiType.AL2_X86_64,
          nodeGroupCapacityType: CapacityType.ON_DEMAND,
          amiReleaseVersion: "1.22.6-20220526",
          nodeGroupSubnets: { subnetType: SubnetType.PRIVATE_WITH_NAT },
        })
        .build();

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
              .clusterProvider(getClustProvider(devConfig.id))
              .addOns(getKarpenterAddon(devConfig.id)),
          },
          {
            id: testConfig.id,
            stackBuilder: blueprint
              .clone(testConfig.region)
              .clusterProvider(getClustProvider(testConfig.id))
              .addOns(getKarpenterAddon(devConfig.id)),
          },
          {
            id: prodConfig.id,
            stackBuilder: blueprint
              .clone(prodConfig.region)
              .clusterProvider(getClustProvider(prodConfig.id))
              .addOns(getKarpenterAddon(devConfig.id)),
          },
        ],
      })
      .build(scope, id + "-stack", props);
  }
}
