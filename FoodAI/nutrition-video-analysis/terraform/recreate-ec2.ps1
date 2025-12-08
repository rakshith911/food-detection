# Set the PATH to include user and machine environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Set-Location "d:\Nutrition5k\food-detection\FoodAI\nutrition-video-analysis\terraform"

Write-Host "=== Destroying old EC2 instance with Terraform ===" -ForegroundColor Green
terraform destroy -target aws_instance.docker_push_temp -auto-approve

Write-Host "`n=== Creating new EC2 instance ===" -ForegroundColor Green
terraform apply -target aws_instance.docker_push_temp -auto-approve

Write-Host "`n=== Getting new instance details ===" -ForegroundColor Green
terraform output docker_push_instance_id

Write-Host "`nNew EC2 instance created! It will automatically:" -ForegroundColor Cyan
Write-Host "1. Clone from https://github.com/leolorence12345/food-detection.git" -ForegroundColor Yellow
Write-Host "2. Build the Docker image with the correct Dockerfile path" -ForegroundColor Yellow
Write-Host "3. Push to ECR" -ForegroundColor Yellow
Write-Host "`nThis process takes 10-20 minutes. Monitor with:" -ForegroundColor Cyan
Write-Host "terraform output docker_push_log_command" -ForegroundColor White
