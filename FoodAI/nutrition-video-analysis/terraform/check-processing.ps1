# Set the PATH to include user and machine environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "=== Checking ECS Task Logs ===" -ForegroundColor Cyan
aws logs tail /ecs/nutrition-video-analysis-dev-video-processor --since 30m --region us-east-1 --format short

Write-Host "`n=== Checking SQS Queue Messages ===" -ForegroundColor Cyan
Write-Host "Video Processing Queue:" -ForegroundColor Yellow
aws sqs get-queue-attributes --queue-url https://sqs.us-east-1.amazonaws.com/185329004895/nutrition-video-analysis-dev-video-processing --attribute-names All --region us-east-1 --query "Attributes.{ApproximateNumberOfMessages:ApproximateNumberOfMessages,ApproximateNumberOfMessagesNotVisible:ApproximateNumberOfMessagesNotVisible,ApproximateNumberOfMessagesDelayed:ApproximateNumberOfMessagesDelayed}" --output json

Write-Host "`nNutrition Analysis Queue:" -ForegroundColor Yellow
aws sqs get-queue-attributes --queue-url https://sqs.us-east-1.amazonaws.com/185329004895/nutrition-video-analysis-dev-nutrition-analysis --attribute-names All --region us-east-1 --query "Attributes.{ApproximateNumberOfMessages:ApproximateNumberOfMessages,ApproximateNumberOfMessagesNotVisible:ApproximateNumberOfMessagesNotVisible,ApproximateNumberOfMessagesDelayed:ApproximateNumberOfMessagesDelayed}" --output json

Write-Host "`n=== Checking Job Status ===" -ForegroundColor Cyan
curl -s https://y7z615hzm3.execute-api.us-east-1.amazonaws.com/v1/api/status/4d0f67dd-5d58-4e80-8986-9df0e99efeb6
