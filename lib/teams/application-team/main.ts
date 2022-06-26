import type { ArnPrincipal } from "aws-cdk-lib/aws-iam";

import { ApplicationTeam } from "@aws-quickstart/eks-blueprints";

/**
 * Creates a namespace
 * Registers quotas
 * Registers IAM users for cross-account access
 * Create a shared role for cluster access. Alternatively, an existing role can be supplied.
 * Register provided users/role in the awsAuth map for kubectl and console access to the cluster and namespace.
 */
export class TeamApplication extends ApplicationTeam {
  constructor(name: string, users: ArnPrincipal[]) {
    super({
      name: name,
      users: users as any[],
    });
  }
}
