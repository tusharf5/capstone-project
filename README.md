# capstone-project

`lib/`: This is where stacks or constructs are defined.
`bin/my-eks-blueprints.ts` : This is the entrypoint of the CDK project. It will load the constructs defined under lib/.

## How To Start

> Remember to bootstrap the AWS Account for CDK before deploying any infrastructure

```shell
CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity | grep -Eo "\"(\d+)?\"" | tr -d "\"")  

CDK_DEFAULT_REGION=us-west-2

cdk bootstrap --trust=$CDK_DEFAULT_ACCOUNT \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess \
  aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION aws://$CDK_DEFAULT_ACCOUNT/us-east-2 aws://$CDK_DEFAULT_ACCOUNT/us-east-1 
```

Create a github personal access token with access to `repo:*` and `admin:repo_hook:*`.
Now store that token in secretsmanager.

```shell
aws secretsmanager create-secret --name "capstone-github-token" --description "github access token" --secret-string "your github access token" --add-replica-regions "Region=us-east-1" "Region=us-east-2" 
```

To create a user to add to a team.
Add all the users in the config file.

```shell
aws iam create-user --user-name <username>
```

For the first time, you'd have to manually create the stack which deploys the pipeline.
Commit your changes and push to the remote repository.

```shell
cdk deploy capstone-core
cdk deploy capstone-eks-pipeline
cdk deploy capstone-eks-pipeline/dev-cluster-stack
```

Once deployed, it will take around 30 minutes to finish the cluster deployment. You can view the progress
in codepipeline.

Once deployed, update the config file with the user details which will add the user to the appropriate team.

To get the kube-config

```shell
aws cloudformation describe-stacks --stack-name dev-dev-blueprint | jq -r '.Stacks[0].Outputs[] | select(.OutputKey|match("ConfigCommand"))| .OutputValue'
 ```

And then run the command output from the previous command.

Login to the console to reset/manage the created user's passwords. They will need it to access the eks dashboard.

To list all the available roles.

```shell
kubectl get roles --all-namespaces
```

To get the role arn of a team. Use this command. Use the name of the team and remove all the special characters.
So `my-team_1` becomes `myteam1`.

```shell
aws cloudformation describe-stacks --stack-name dev-dev-blueprint | jq -r '.Stacks[0].Outputs[] | select(.OutputKey|match("capstoneappdevsteamrole"))| .OutputValue'
```

Note the account and role name.

<https://aws.amazon.com/blogs/opensource/introducing-fine-grained-iam-roles-service-accounts/>
