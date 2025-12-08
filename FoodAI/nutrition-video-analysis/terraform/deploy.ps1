# Nutrition Video Analysis Backend - Terraform Deployment Script
# Run this script from the terraform directory using: .\deploy.ps1

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " Nutrition Video Analysis - Backend Deployment" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Check AWS CLI
Write-Host "[1/6] Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host $awsVersion -ForegroundColor Green
} catch {
    Write-Host "ERROR: AWS CLI is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install AWS CLI from: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check AWS credentials
Write-Host "[2/6] Checking AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity | ConvertFrom-Json
    Write-Host "Account: $($identity.Account)" -ForegroundColor Green
    Write-Host "User ARN: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: AWS credentials not configured" -ForegroundColor Red
    Write-Host "Run: aws configure" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check Terraform
Write-Host "[3/6] Checking Terraform..." -ForegroundColor Yellow
try {
    $tfVersion = terraform --version 2>&1 | Select-Object -First 1
    Write-Host $tfVersion -ForegroundColor Green
} catch {
    Write-Host "ERROR: Terraform is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Terraform from: https://www.terraform.io/downloads" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Initialize Terraform
Write-Host "[4/6] Initializing Terraform..." -ForegroundColor Yellow
terraform init
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Terraform init failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Plan deployment
Write-Host "[5/6] Planning deployment..." -ForegroundColor Yellow
terraform plan -out=tfplan
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Terraform plan failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Ask for confirmation
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " Review the plan above carefully!" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
$confirm = Read-Host "Do you want to apply this plan? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Apply deployment
Write-Host ""
Write-Host "[6/6] Applying deployment..." -ForegroundColor Yellow
terraform apply tfplan
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Terraform apply failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Getting deployment outputs..." -ForegroundColor Yellow
terraform output

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " IMPORTANT: Copy the api_gateway_invoke_url above!" -ForegroundColor Cyan
Write-Host " Update it in: services/NutritionAnalysisAPI.ts" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Save outputs to file
Write-Host "Saving outputs to deployment_outputs.json..." -ForegroundColor Yellow
terraform output -json > deployment_outputs.json
Write-Host "Done! Outputs saved to deployment_outputs.json" -ForegroundColor Green
