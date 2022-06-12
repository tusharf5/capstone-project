import { App, Stack, StackProps } from "aws-cdk-lib";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";

import { projectName } from "../../config";

export const vpcChildId = "vpc";

export class BaseResources extends Stack {
  public readonly vpc: Vpc;

  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, vpcChildId, {
      vpcName: projectName,
      cidr: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "public-1",
          subnetType: SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
        {
          name: "private-1",
          subnetType: SubnetType.PRIVATE_WITH_NAT,
        },
        {
          name: "private-2",
          subnetType: SubnetType.PRIVATE_WITH_NAT,
        },
        {
          name: "private-3",
          subnetType: SubnetType.PRIVATE_WITH_NAT,
        },
        {
          name: "private-4",
          subnetType: SubnetType.PRIVATE_WITH_NAT,
        },
      ],
    });

    this.vpc = vpc;
  }
}
