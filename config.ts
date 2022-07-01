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
    cidr: "10.0.0.0/16",
  },
  uat: {
    name: "uat",
    region: "us-east-1",
    cidr: "10.1.0.0/16",
  },
  prod: {
    name: "prod",
    region: "us-east-2",
    cidr: "10.2.0.0/16",
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
    name: "frontend",
    users: [
      { name: "frontend-user-1", account: process.env.CDK_DEFAULT_ACCOUNT },
    ],
  },
  content: {
    name: "backend",
    users: [
      { name: "backend-user-1", account: process.env.CDK_DEFAULT_ACCOUNT },
    ],
  },
  platformDev: {
    name: "platform",
    users: [
      { name: "platform-user-1", account: process.env.CDK_DEFAULT_ACCOUNT },
    ],
  },
};
