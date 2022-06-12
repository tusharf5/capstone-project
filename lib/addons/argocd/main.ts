import {
  ApplicationRepository,
  ArgoCDAddOn,
} from "@aws-quickstart/eks-blueprints";

const repoUrl = "https://github.com/aws-samples/eks-blueprints-workloads.git";

const bootstrapRepo: ApplicationRepository = {
  repoUrl,
  targetRevision: "workshop",
};

const prodArgoAddon = new ArgoCDAddOn({
  bootstrapRepo: {
    ...bootstrapRepo,
    path: "envs/prod",
  },
});

export { prodArgoAddon };
