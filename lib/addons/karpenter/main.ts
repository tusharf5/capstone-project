import {
  addons,
  type HelmAddOnUserProps,
} from "@aws-quickstart/eks-blueprints";

const karpenterAddOn = (props: KarpenterAddOnProps) =>
  new addons.KarpenterAddOn(props);

export interface KarpenterAddOnProps extends HelmAddOnUserProps {
  /**
   * Specs for a Provisioner (Optional) - If not provided, the add-on will
   * deploy a Provisioner with default values.
   */
  provisionerSpecs?: {
    "node.kubernetes.io/instance-type"?: string[];
    "topology.kubernetes.io/zone"?: string[];
    "kubernetes.io/arch"?: string[];
    "karpenter.sh/capacity-type"?: string[];
  };
  /**
   * Tags needed for subnets - Subnet tags and security group tags are required for the provisioner to be created
   */
  subnetTags?: {
    [key: string]: string;
  };
  /**
   * Tags needed for security groups - Subnet tags and security group tags are required for the provisioner to be created
   */
  securityGroupTags?: {
    [key: string]: string;
  };
}

export { karpenterAddOn };
