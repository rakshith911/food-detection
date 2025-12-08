# Set the PATH to include user and machine environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$INSTANCE_ID = "i-0c3e8fe3eaa8bb08c"
$REGION = "us-east-1"

Write-Host "=== Getting EC2 Instance Details ===" -ForegroundColor Cyan
$instanceInfo = aws ec2 describe-instances --instance-ids $INSTANCE_ID --region $REGION --query 'Reservations[0].Instances[0].{PublicIP:PublicIpAddress,State:State.Name,LaunchTime:LaunchTime}' --output json | ConvertFrom-Json

Write-Host "Instance ID: $INSTANCE_ID" -ForegroundColor Yellow
Write-Host "State: $($instanceInfo.State)" -ForegroundColor Yellow
Write-Host "Public IP: $($instanceInfo.PublicIP)" -ForegroundColor Yellow
Write-Host "Launch Time: $($instanceInfo.LaunchTime)" -ForegroundColor Yellow

if ($instanceInfo.State -ne "running") {
    Write-Host "`nInstance is not running. Starting instance..." -ForegroundColor Yellow
    aws ec2 start-instances --instance-ids $INSTANCE_ID --region $REGION
    Write-Host "Waiting for instance to start..." -ForegroundColor Yellow
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION
    Write-Host "Instance is now running!" -ForegroundColor Green

    # Get updated IP
    Start-Sleep -Seconds 5
    $instanceInfo = aws ec2 describe-instances --instance-ids $INSTANCE_ID --region $REGION --query 'Reservations[0].Instances[0].{PublicIP:PublicIpAddress,State:State.Name}' --output json | ConvertFrom-Json
    Write-Host "New Public IP: $($instanceInfo.PublicIP)" -ForegroundColor Yellow
}

Write-Host "`n=== Checking CloudWatch Logs for Build Progress ===" -ForegroundColor Cyan
Write-Host "Checking /var/log/cloud-init-output.log..." -ForegroundColor Yellow

# Use SSM to get logs (if SSM agent is installed)
Write-Host "`nTo connect to EC2 and run build manually, use:" -ForegroundColor Cyan
Write-Host "ssh -i ~/.ssh/nutrition-video-key.pem ubuntu@$($instanceInfo.PublicIP)" -ForegroundColor White
Write-Host "`nOr run the build script directly:" -ForegroundColor Cyan
Write-Host "cd /home/ubuntu/food-detection/FoodAI/nutrition-video-analysis/terraform/docker" -ForegroundColor White
Write-Host "./build-and-push-on-ec2.sh" -ForegroundColor White

Write-Host "`n=== Current User Data Script Status ===" -ForegroundColor Cyan
Write-Host "The instance was launched with a user data script that should:" -ForegroundColor Yellow
Write-Host "1. Clone the GitHub repository" -ForegroundColor White
Write-Host "2. Build the Docker image from terraform/docker directory" -ForegroundColor White
Write-Host "3. Push to ECR" -ForegroundColor White
Write-Host "`nTo check if it completed, SSH to the instance and run:" -ForegroundColor Yellow
Write-Host "tail -f /var/log/cloud-init-output.log" -ForegroundColor White
