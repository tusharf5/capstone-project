import { Construct } from "constructs";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { setPath } from "@aws-quickstart/eks-blueprints/dist/utils/object-utils";

/**
 * User provided options for the Helm Chart
 */
export interface PrometheusProps extends blueprints.HelmAddOnUserProps {}

/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps: blueprints.HelmAddOnProps & PrometheusProps = {
  namespace: "prometheus",
  version: "36.6.1",
  name: "blueprint-prometheus-addon",
  release: "prometheus-addon",
  chart: "kube-prometheus-stack",
  repository: "https://prometheus-community.github.io/helm-charts",
  values: {},
};

/**
 * Main class to instantiate the Helm chart
 */
export class PrometheusAddon extends blueprints.HelmAddOn {
  readonly options: PrometheusProps;

  constructor(props?: PrometheusProps) {
    super({ ...defaultProps, ...props });
    this.options = this.props as PrometheusProps;
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
function populateValues(helmOptions: PrometheusProps): blueprints.Values {
  const values = helmOptions.values ?? {};

  setPath(
    values,
    "storageSpec.volumeClaimTemplate.spec.storageClassName",
    "ibmc-file-gold"
  );
  setPath(values, "storageSpec.volumeClaimTemplate.spec.accessModes", [
    "ReadWriteMany",
  ]);

  setPath(
    values,
    "storageSpec.volumeClaimTemplate.spec.resources.requests.storage",
    "50Gi"
  );
  setPath(
    values,
    "storageSpec.volumeClaimTemplate.selector.matchLabels.app",
    "prometheus"
  );

  return values;
}
