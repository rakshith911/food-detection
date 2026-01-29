# =============================================================================
# GPU TASK DEFINITION
# Separate task definition for GPU-enabled tasks
# =============================================================================

resource "aws_ecs_task_definition" "video_processor_gpu" {
  count = var.use_gpu ? 1 : 0

  family                   = "${local.name_prefix}-video-processor-gpu"
  network_mode             = "bridge"  # EC2 uses bridge mode
  requires_compatibilities = ["EC2"]
  cpu                      = "4096"   # 4 vCPU
  memory                   = "16384"  # 16 GB RAM
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "video-processor"
      image     = "${aws_ecr_repository.video_processor.repository_url}:${var.docker_image_tag}"
      essential = true

      # GPU resource requirements
      resourceRequirements = [
        {
          type  = "GPU"
          value = "1"  # 1 GPU per task
        }
      ]

      environment = [
        { name = "S3_VIDEOS_BUCKET", value = aws_s3_bucket.videos.bucket },
        { name = "S3_RESULTS_BUCKET", value = aws_s3_bucket.results.bucket },
        { name = "S3_MODELS_BUCKET", value = aws_s3_bucket.models.bucket },
        { name = "DYNAMODB_JOBS_TABLE", value = aws_dynamodb_table.jobs.name },
        { name = "SQS_VIDEO_QUEUE_URL", value = aws_sqs_queue.video_processing.url },
        { name = "AWS_REGION", value = var.aws_region },
        { name = "DEVICE", value = var.device_type },  # "cuda" for GPU
        { name = "UPLOAD_SEGMENTED_IMAGES", value = "true" },  # Save segmentation masks/overlays to results bucket
        { name = "FORCE_IMAGE_PULL", value = timestamp() }
      ]

      secrets = [
        {
          name      = "GEMINI_API_KEY"
          valueFrom = aws_ssm_parameter.gemini_api_key.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_video_processor.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "python3 -c 'import torch; print(1 if torch.cuda.is_available() else 0)' || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 120  # Longer start period for GPU initialization
      }
    }
  ])

  tags = {
    Name = "${local.name_prefix}-video-processor-gpu"
  }
}

