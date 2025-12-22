# Nutrition Video Analysis - ECS Worker Container
# CPU-optimized for Fargate (no GPU support)

FROM python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1 \
    libglib2.0-0 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install PyTorch CPU version first (much smaller and faster)
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.1.0+cpu torchvision==0.16.0+cpu

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker script
COPY worker.py .

# Copy AI processing modules
COPY app/ ./app/

# Copy SAM2 package to root so it's importable as 'sam2'
COPY sam2_package/sam2 ./sam2/
COPY sam2_package/checkpoints ./checkpoints/

# Copy nutrition RAG system
COPY nutrition_rag_system.py .

# Verify all files are in place
RUN ls -la /app/ && \
    test -f /app/worker.py && \
    test -f /app/nutrition_rag_system.py && \
    echo "All required files present"

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python3 -c "print('healthy')" || exit 1

# Run worker
CMD ["python3", "worker.py"]
