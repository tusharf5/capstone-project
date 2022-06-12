import { addons } from "@aws-quickstart/eks-blueprints";

const karpenterAddonProps = {
  provisionerSpecs: {
    "node.kubernetes.io/instance-type": ["m5.2xlarge"],
    "topology.kubernetes.io/zone": ["us-east-1c"],
    "kubernetes.io/arch": ["amd64", "arm64"],
    "karpenter.sh/capacity-type": ["spot", "on-demand"],
  },
  subnetTags: {
    "karpenter.sh/discovery/MyCluster": "Name",
    "karpenter.sh/discovery/Tag1": "tag1value",
  },
  securityGroupTags: {
    "karpenter.sh/discovery/MyCluster": "Name",
    "karpenter.sh/discovery/Tag1": "tag1value",
  },
};

const karpenterAddOn = new addons.KarpenterAddOn(karpenterAddonProps);

export { karpenterAddOn };
