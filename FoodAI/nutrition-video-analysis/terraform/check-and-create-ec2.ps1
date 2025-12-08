# Set the PATH to include user and machine environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "=== Checking for existing EC2 instances ===" -ForegroundColor Cyan
$instances = aws ec2 describe-instances --region us-east-1 --filters "Name=tag:Name,Values=nutrition-video-builder" --query 'Reservations[*].Instances[*].{ID:InstanceId,State:State.Name,IP:PublicIpAddress}' --output json | ConvertFrom-Json

if ($instances -and $instances.Count -gt 0) {
    Write-Host "Found existing builder instance(s):" -ForegroundColor Green
    $instances | ForEach-Object {
        $_ | ForEach-Object {
            Write-Host "  ID: $($_.ID), State: $($_.State), IP: $($_.IP)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "No existing builder instances found." -ForegroundColor Yellow
    Write-Host "`n=== Creating new EC2 instance for Docker build ===" -ForegroundColor Cyan

    cd "d:\Nutrition5k\food-detection\FoodAI\nutrition-video-analysis\terraform"

    Write-Host "Running terraform apply..." -ForegroundColor Yellow
    terraform apply -auto-approve -target=aws_instance.docker_builder
}
