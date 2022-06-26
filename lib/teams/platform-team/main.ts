import type { ArnPrincipal } from "aws-cdk-lib/aws-iam";

import { PlatformTeam } from "@aws-quickstart/eks-blueprints";

/**
 * The code block above imports the ArnPrincipal construct
 * from the aws-cdk-lib/aws-iam module for the AWS CDK.
 * The reason why we need to import the ArnPrincipal construct
 * is so that we can add users to the platform using their IAM credentials.
 */
export class TeamPlatform extends PlatformTeam {
  constructor(name: string, users: ArnPrincipal[]) {
    super({
      name: name,
      users: users as any[],
    });
  }
}
