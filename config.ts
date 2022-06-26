if (!process.env.CDK_DEFAULT_REGION) {
  throw new Error("`CDK_DEFAULT_REGION` environment variable is undefined.");
}

if (!process.env.CDK_DEFAULT_ACCOUNT) {
  throw new Error("`CDK_DEFAULT_ACCOUNT` environment variable is undefined.");
}

export const projectName = "capstone";

export const environments = {
  dev: {
    name: "dev",
    region: "us-west-2",
  },
  test: {
    name: "test",
    region: "us-east-1",
  },
  prod: {
    name: "prod",
    region: "us-east-2",
  },
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
  content: {
    name: "capstone-content-devs",
    users: [
      { name: "content-team-dev-a", account: process.env.CDK_DEFAULT_ACCOUNT },
    ],
  },
  platformDev: {
    name: "capstone-platform-devs",
    users: [
      { name: "eks-platform-dev-1", account: process.env.CDK_DEFAULT_ACCOUNT },
    ],
  },
};
