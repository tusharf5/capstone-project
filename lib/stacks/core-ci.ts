import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
  Step,
} from "aws-cdk-lib/pipelines";
import * as cdk from "aws-cdk-lib";
import * as pipelines from "aws-cdk-lib/pipelines";

import { CoreCiStage } from "../stage/core-stage";
import { projectName } from "../../config";

interface CiStackProps extends StackProps {
  cidr: string;
  stage: string;
  branch: string;
}

// Docs at https://www.npmjs.com/package/@aws-cdk/pipelines

export class BlueprintsCiStack extends Stack {
  constructor(scope: Construct, id: string, props: CiStackProps) {
    super(scope, id, props);

    const sourceArtifact = CodePipelineSource.gitHub(
      "tusharf5/capstone-project",
      props.branch,
      {
        authentication: cdk.SecretValue.secretsManager("capstone-github-token"),
      }
    );

    const pipeline = new CodePipeline(this, "cluster-core-ci", {
      pipelineName: `${id}-pipeline`,
      synth: new ShellStep("Synth", {
        input: sourceArtifact,
        installCommands: ['echo "Synth installCommands"'],
        commands: [
          'echo "Synth commands"',
          "yarn install",
          `npx cdk synth ${projectName}-core-ci-${props.stage}`,
        ],
      }),
    });

    const infraStage = new CoreCiStage(this, "core-resources", {
      env: { account: props.env!.account, region: props.env!.region },
      stage: props.stage,
      cidr: props.cidr,
    });

    pipeline.addStage(infraStage);

    const blueprintStage = new CoreCiStage(this, "blueprint-cluster", {
      env: { account: props.env!.account, region: props.env!.region },
      stage: props.stage,
      cidr: props.cidr,
    });

    pipeline.addStage(blueprintStage);
  }
}
