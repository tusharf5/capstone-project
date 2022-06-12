if (!process.env.CDK_DEFAULT_REGION) {
  throw new Error("`CDK_DEFAULT_REGION` environment variable is undefined.");
}

if (!process.env.CDK_DEFAULT_ACCOUNT) {
  throw new Error("`CDK_DEFAULT_ACCOUNT` environment variable is undefined.");
}

export const projectName = "capstone";
export const clusterName = `${projectName}-cluster`;

export const devConfig = {
  id: "dev",
  region: process.env.CDK_DEFAULT_REGION,
};

export const testConfig = {
  id: "test",
  region: "us-east-2",
};

export const prodConfig = {
  id: "prod",
  region: "us-east-1",
};

export const githubConfig = {
  repoUrl: "capstone-project",
  credentialsSecretName: "capstone-github-token",
  targetRevision: "main",
  owner: "tusharf5",
};

export const teams = {
  appDev: {
    name: "capstone-app-devs",
    users: [
      { name: "eks-app-dev-1", account: process.env.CDK_DEFAULT_ACCOUNT },
    ],
  },
  platformDev: {
    name: "capstone-platform-devs",
    users: [
      { name: "eks-platform-dev-1", account: process.env.CDK_DEFAULT_ACCOUNT },
    ],
  },
};

export const stackIds = {
  baseResources: (env: string) => `${env}-${projectName}-base-resources`,
  eksPipeline: `${projectName}-pipeline`,
};
