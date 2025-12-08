@echo off
REM Nutrition Video Analysis Backend - Terraform Deployment Script
REM Run this script from the terraform directory

echo ====================================================
echo  Nutrition Video Analysis - Backend Deployment
echo ====================================================
echo.

REM Check AWS CLI
echo [1/6] Checking AWS CLI...
aws --version
if errorlevel 1 (
    echo ERROR: AWS CLI is not installed or not in PATH
    echo Please install AWS CLI from: https://aws.amazon.com/cli/
    pause
    exit /b 1
)
echo.

REM Check AWS credentials
echo [2/6] Checking AWS credentials...
aws sts get-caller-identity
if errorlevel 1 (
    echo ERROR: AWS credentials not configured
    echo Run: aws configure
    pause
    exit /b 1
)
echo.

REM Check Terraform
echo [3/6] Checking Terraform...
terraform --version
if errorlevel 1 (
    echo ERROR: Terraform is not installed or not in PATH
    echo Please install Terraform from: https://www.terraform.io/downloads
    pause
    exit /b 1
)
echo.

REM Initialize Terraform
echo [4/6] Initializing Terraform...
terraform init
if errorlevel 1 (
    echo ERROR: Terraform init failed
    pause
    exit /b 1
)
echo.

REM Plan deployment
echo [5/6] Planning deployment...
terraform plan -out=tfplan
if errorlevel 1 (
    echo ERROR: Terraform plan failed
    pause
    exit /b 1
)
echo.

REM Ask for confirmation
echo.
echo ====================================================
echo  Review the plan above carefully!
echo ====================================================
echo.
set /p confirm="Do you want to apply this plan? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

REM Apply deployment
echo.
echo [6/6] Applying deployment...
terraform apply tfplan
if errorlevel 1 (
    echo ERROR: Terraform apply failed
    pause
    exit /b 1
)

echo.
echo ====================================================
echo  Deployment Complete!
echo ====================================================
echo.
echo Getting deployment outputs...
terraform output

echo.
echo ====================================================
echo  IMPORTANT: Save the API Gateway URL above!
echo  Update it in your app's NutritionAnalysisAPI.ts
echo ====================================================
echo.
pause
