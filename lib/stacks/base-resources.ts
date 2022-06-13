import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

import { projectName } from "../../config";

export const vpcChildId = "vpc";

export class BaseResources extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, vpcChildId, {
      vpcName: projectName,
      cidr: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "public-1",
          subnetType: ec2.SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
        {
          name: "private-1",
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
        {
          name: "private-2",
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
        {
          name: "private-3",
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
        {
          name: "private-4",
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
    });

    this.vpc = vpc;
  }
}
