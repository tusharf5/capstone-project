if (!process.env.CDK_DEFAULT_REGION) {
  throw new Error("`CDK_DEFAULT_REGION` environment variable is undefined.");
}

export const projectName = "capstone";

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
