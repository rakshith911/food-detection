# Nutrition Video Analysis - ECS Worker Container
# Base image with CUDA support for GPU processing

FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive
ENV CUDA_HOME=/usr/local/cuda
ENV PATH=$CUDA_HOME/bin:$PATH
ENV LD_LIBRARY_PATH=$CUDA_HOME/lib64:$LD_LIBRARY_PATH

# Install Python and system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3-pip \
    python3-dev \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1 \
    libglib2.0-0 \
    git \
    curl \
    build-essential \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set python3 as default python
RUN ln -s /usr/bin/python3 /usr/bin/python

# Create app directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Try to install flash-attn (optional, may fail on some platforms)
RUN pip install --no-cache-dir flash-attn==2.3.6 || echo "flash-attn installation failed, continuing without it"

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
