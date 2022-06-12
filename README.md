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

capstone-pipeline-stack  
```

To create a user to add to a team.

```shell
aws iam create-user --user-name <username>
```

Once created, update the config file with the user details which will add the user to the appropriate team.

To get the kube-config

```shell
 export KUBE_CONFIG=$(aws cloudformation describe-stacks --stack-name capstone-pipeline-stack | jq -r '.Stacks[0].Outputs[] | select(.OutputKey|match("ConfigCommand"))| .OutputValue')
```

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
