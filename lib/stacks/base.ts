import * as cdk from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { BlockPublicAccess, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import * as config from "../../config";

interface Props extends cdk.StackProps {
  stage: string;
  cidr: string;
}

export class BaseStack extends cdk.Stack {
  public readonly vpc: IVpc;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const vpc = new cdk.aws_ec2.Vpc(this, id + "-vpc", {
      cidr: props.cidr,
      vpcName: `${config.projectName}-vpc`,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "public",
          mapPublicIpOnLaunch: true,
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
        {
          name: "private",
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
    });

    new cdk.aws_s3.Bucket(this, "asset-bucket", {
      encryption: BucketEncryption.S3_MANAGED,
      bucketName: `${config.projectName}-tusharf5-pipeline-assets-bucket-${props.stage}`,
      versioned: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      eventBridgeEnabled: true,
    });

    // 👇 define function that tags subnets
    const tagAllSubnets = (
      subnets: cdk.aws_ec2.ISubnet[],
      tagName: string,
      tagValue: string,
      addZone: boolean
    ) => {
      for (const subnet of subnets) {
        cdk.Tags.of(subnet).add(
          tagName,
          addZone ? `${tagValue}-${subnet.availabilityZone}` : tagValue
        );
      }
    };

    // const { stackName } = cdk.Stack.of(this);

    tagAllSubnets(
      vpc.publicSubnets,
      "karpenter.sh/discovery",
      `public-${config.projectName}`,
      false
    );
    tagAllSubnets(
      vpc.publicSubnets,
      `kubernetes.io/cluster/${props.stage}-${config.projectName}`,
      `owned`,
      false
    );
    tagAllSubnets(
      vpc.publicSubnets,
      "Name",
      `public-${config.projectName}`,
      true
    );
    tagAllSubnets(vpc.publicSubnets, "kubernetes.io/role/elb", `1`, false);
    //
    tagAllSubnets(
      vpc.privateSubnets,
      `kubernetes.io/cluster/${props.stage}-${config.projectName}`,
      `owned`,
      false
    );
    tagAllSubnets(
      vpc.privateSubnets,
      "karpenter.sh/discovery",
      `private-${config.projectName}`,
      false
    );
    tagAllSubnets(
      vpc.privateSubnets,
      "kubernetes.io/role/internal-elb",
      `1`,
      false
    );
    tagAllSubnets(
      vpc.privateSubnets,
      "Name",
      `private-${config.projectName}`,
      true
    );

    this.vpc = vpc;
  }
}
