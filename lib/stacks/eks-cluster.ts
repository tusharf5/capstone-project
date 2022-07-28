import { aws_ec2, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as blueprints from "@aws-quickstart/eks-blueprints";
import * as iam from "aws-cdk-lib/aws-iam";
import * as eks from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";

import * as config from "../../config";

import { vpcCniAddOn } from "../addons/vpc-cni/main";
import { karpenterAddOn } from "../addons/karpenter/main";
import { secretsStoreAddon } from "../addons/secretsstore/main";
import { IVpc, SubnetType } from "aws-cdk-lib/aws-ec2";
import { TeamPlatform } from "../teams/platform-team/main";
import { TeamApplication } from "../teams/application-team/main";
import {
  ResourceContext,
  ResourceProvider,
} from "@aws-quickstart/eks-blueprints";
import { ArgoCdRolloutAddon } from "../addons/argocd-bluegreen/main";

interface PipelineProps extends StackProps {
  env: {
    account: string;
    region: string;
  };
  stage: string;
}

const repoUrl = "https://github.com/tusharf5/capstone-project-app-of-apps.git";

const bootstrapRepo: blueprints.ApplicationRepository = {
  repoUrl,
};

class VpcResourceProvider implements ResourceProvider<any> {
  provide(context: ResourceContext): IVpc {
    const scope = context.scope; // stack
    const vpc = aws_ec2.Vpc.fromLookup(scope, "vpc", {
      vpcName: `${config.projectName}-vpc`,
    });

    return vpc;
  }
}

export class BlueprintStack extends Stack {
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

    const contentUsers = config.teams.content.users.map((dev) => {
      return new iam.ArnPrincipal(
        `arn:aws:iam::${dev.account}:user/${dev.name}`
      );
    });

    const albControllerProps: eks.AlbControllerOptions = {
      version: eks.AlbControllerVersion.V2_4_1,
    };

    const cluster = new blueprints.ClusterBuilder()
      .withCommonOptions({
        clusterName: `${props.stage}-${config.projectName}`,
        endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
        serviceIpv4Cidr: "10.100.0.0/16",
        version: eks.KubernetesVersion.V1_21,
        albController: albControllerProps,
      })
      .managedNodeGroup({
        id: "general-purpose-node",
        minSize: 3,
        maxSize: 10,
        desiredSize: 3,
        instanceTypes: [
          ec2.InstanceType.of(
            ec2.InstanceClass.T3A,
            ec2.InstanceSize.MEDIUM
          ) as any,
        ],
        amiType: eks.NodegroupAmiType.AL2_X86_64,
        nodeGroupCapacityType: eks.CapacityType.ON_DEMAND,
        amiReleaseVersion: "1.21.12-20220526",
        nodeGroupSubnets: { subnetType: SubnetType.PRIVATE_WITH_NAT },
      })
      .build();

    const ebsCsiAddon = new blueprints.addons.EbsCsiDriverAddOn();

    const karpenterAddon = karpenterAddOn({
      provisionerSpecs: {
        "node.kubernetes.io/instance-type": ["m5.large"],
        "topology.kubernetes.io/zone": this.node.tryGetContext(
          `availability-zones:account=${account}:region=${props.env.region}`
        ),
        "kubernetes.io/arch": ["amd64"],
        "karpenter.sh/capacity-type": ["on-demand"],
      },
      subnetTags: {
        [`karpenter.sh/discovery`]: `${props.stage}-${config.projectName}`,
      },
      securityGroupTags: {
        [`karpenter.sh/discovery`]: `${props.stage}-${config.projectName}`,
      },
    });

    const argoAddon = new blueprints.ArgoCDAddOn({
      namespace: "argocd",
      bootstrapRepo: {
        ...bootstrapRepo,
        name: `${config.projectName}-argocd`,
        path: `envs/${props.stage}`,
        targetRevision: props.stage === "dev" ? "main" : props.stage,
      },
    });

    const argoRolloutAddon = new ArgoCdRolloutAddon();

    const albAddon = new blueprints.addons.AwsLoadBalancerControllerAddOn({
      enableWaf: true,
      enableWafv2: true,
      enableShield: true,
    });

    const builder = blueprints.EksBlueprint.builder()
      .name(`${config.projectName}-cluster`)
      .resourceProvider(
        blueprints.GlobalResources.Vpc,
        new VpcResourceProvider() as any
      )
      .clusterProvider(cluster)
      .account(account)
      .addOns(
        vpcCniAddOn,
        secretsStoreAddon,
        karpenterAddon,
        ebsCsiAddon,
        ...(props.stage === "dev" ? [albAddon] : []),
        argoAddon,
        argoRolloutAddon

        // new PrometheusAddon()
      )
      .teams(
        new TeamPlatform(config.teams.platformDev.name, platformUsers),
        new TeamApplication(config.teams.appDev.name, appUsers),
        new TeamApplication(config.teams.content.name, contentUsers)
      );

    blueprints.CodePipelineStack.builder()
      .name(`eks-cluster-${props.stage}`)
      .owner(config.githubConfig.owner)
      .repository({
        repoUrl: config.githubConfig.repoUrl,
        credentialsSecretName: config.githubConfig.credentialsSecretName,
        targetRevision: props.stage === "dev" ? "main" : props.stage,
      })
      .stage({
        id:
          props.stage === "dev"
            ? config.environments.dev.name
            : config.environments.uat.name,
        stackBuilder: builder,
      })
      .build(this, `${props.stage}-cluster-stack`, props as any);
  }
}
