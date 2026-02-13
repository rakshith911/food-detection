#!/usr/bin/env bash
# Import existing AWS resources into Terraform state (run once after "already exists" errors).
# Run from: FoodAI/nutrition-video-analysis/terraform

set -e
REGION="${AWS_REGION:-us-east-1}"
PREFIX="nutrition-video-analysis-dev"

# Skip KMS key/alias if already in state (e.g. from a previous apply)
echo "Importing DynamoDB table..."
terraform import -var-file=terraform.tfvars 'aws_dynamodb_table.jobs' "${PREFIX}-jobs" || true

echo "Importing SQS queues..."
terraform import -var-file=terraform.tfvars 'aws_sqs_queue.video_processing' "https://sqs.${REGION}.amazonaws.com/$(aws sts get-caller-identity --query Account --output text)/${PREFIX}-video-processing" || true
terraform import -var-file=terraform.tfvars 'aws_sqs_queue.nutrition_analysis' "https://sqs.${REGION}.amazonaws.com/$(aws sts get-caller-identity --query Account --output text)/${PREFIX}-nutrition-analysis" || true

echo "Importing ECR repository..."
terraform import -var-file=terraform.tfvars 'aws_ecr_repository.video_processor' "${PREFIX}-video-processor" || true

echo "Importing CloudWatch log group..."
terraform import -var-file=terraform.tfvars 'aws_cloudwatch_log_group.ecs_video_processor' "/ecs/${PREFIX}-video-processor" || true

echo "Importing SSM parameter (Gemini API key)..."
terraform import -var-file=terraform.tfvars 'aws_ssm_parameter.gemini_api_key' "/${PREFIX}/gemini-api-key" || true

echo "Checking for existing Internet Gateway (name ${PREFIX}-igw)..."
IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=tag:Name,Values=${PREFIX}-igw" --query 'InternetGateways[0].InternetGatewayId' --output text 2>/dev/null || true)
if [ -n "$IGW_ID" ] && [ "$IGW_ID" != "None" ]; then
  echo "Importing Internet Gateway $IGW_ID..."
  terraform import -var-file=terraform.tfvars 'aws_internet_gateway.main' "$IGW_ID" || true
else
  echo "No IGW named ${PREFIX}-igw found. If you hit IGW limit: delete an unused IGW in AWS console, then run terraform apply."
fi

echo ""
echo "Done. Run: terraform apply -var-file=terraform.tfvars"
