import { Construct } from "constructs";
import * as blueprints from "@aws-quickstart/eks-blueprints";

/**
 * User provided options for the Helm Chart
 */
export interface ArgoCdRolloutProps extends blueprints.HelmAddOnUserProps {}

/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps: blueprints.HelmAddOnProps & ArgoCdRolloutProps = {
  namespace: "argocd",
  version: "2.18.0",
  name: "blueprint-argocd-rollout-addon",
  release: "argocd-addon",
  chart: "argo-rollouts",
  repository: "https://argoproj.github.io/argo-helm",
  values: {},
};

/**
 * Main class to instantiate the Helm chart
 */
export class ArgoCdRolloutAddon extends blueprints.HelmAddOn {
  readonly options: ArgoCdRolloutProps;

  constructor(props?: ArgoCdRolloutProps) {
    super({ ...defaultProps, ...props });
    this.options = this.props as ArgoCdRolloutProps;
  }

  deploy(clusterInfo: blueprints.ClusterInfo): Promise<Construct> {
    let values: blueprints.Values = populateValues(this.options);
    const chart = this.addHelmChart(clusterInfo, values);

    return Promise.resolve(chart);
  }
}

/**
 * populateValues populates the appropriate values used to customize the Helm chart
 * @param helmOptions User provided values to customize the chart
 */
function populateValues(helmOptions: ArgoCdRolloutProps): blueprints.Values {
  const values = helmOptions.values ?? {};

  return values;
}
