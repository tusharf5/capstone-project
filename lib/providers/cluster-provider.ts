import {
  MngClusterProvider,
  type MngClusterProviderProps,
} from "@aws-quickstart/eks-blueprints";
import { InstanceType } from "aws-cdk-lib/aws-ec2";
import {
  CapacityType,
  KubernetesVersion,
  NodegroupAmiType,
} from "aws-cdk-lib/aws-eks";

const props: MngClusterProviderProps = {
  minSize: 1,
  maxSize: 10,
  desiredSize: 2,
  instanceTypes: [new InstanceType("m5.large")],
  amiType: NodegroupAmiType.AL2_X86_64,
  nodeGroupCapacityType: CapacityType.ON_DEMAND,
  version: KubernetesVersion.V1_20,
  amiReleaseVersion: "1.22.6-20220526	",
};

const clusterProvider = new MngClusterProvider(props);

export { clusterProvider };
