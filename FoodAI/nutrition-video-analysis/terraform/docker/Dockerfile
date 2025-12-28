# Nutrition Video Analysis - ECS Worker Container
# CPU-optimized for Fargate (no GPU support)

# Use Amazon ECR Public Gallery to avoid Docker Hub rate limits
FROM public.ecr.aws/docker/library/python:3.10-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DEBIAN_FRONTEND=noninteractive
ENV HF_HUB_OFFLINE=0
ENV TRANSFORMERS_OFFLINE=0
ENV TRUST_REMOTE_CODE=1

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

# CRITICAL: Install NumPy 1.24.3 FIRST before PyTorch
# PyTorch 2.1.0 was compiled with NumPy 1.x and will break with NumPy 2.x
RUN pip install --no-cache-dir "numpy==1.24.3"

# Install PyTorch CPU version (will use the pinned NumPy 1.24.3)
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.1.0+cpu torchvision==0.16.0+cpu

# Copy and install Python dependencies
COPY requirements.txt .
# CRITICAL: Install huggingface_hub<0.20.0 FIRST before sentence-transformers
# sentence-transformers 2.2.2 requires cached_download which was removed in huggingface_hub 0.20.0+
RUN pip install --no-cache-dir "huggingface_hub<0.20.0" && \
    echo "✅ Installed huggingface_hub<0.20.0 (has cached_download)"

# CRITICAL: Install requirements WITHOUT sentence-transformers first
# sentence-transformers will be installed separately to prevent huggingface_hub upgrade
RUN grep -v "sentence-transformers" requirements.txt > /tmp/requirements_no_st.txt && \
    echo "numpy==1.24.3" > /tmp/constraints.txt && \
    echo "huggingface_hub<0.20.0" >> /tmp/constraints.txt && \
    pip install --no-cache-dir -r /tmp/requirements_no_st.txt -c /tmp/constraints.txt && \
    pip install --no-cache-dir --force-reinstall --no-deps "numpy==1.24.3" && \
    pip install --no-cache-dir --force-reinstall "huggingface_hub<0.20.0" && \
    echo "✅ Installed all packages except sentence-transformers"

# CRITICAL: Install sentence-transformers LAST with explicit constraints
# This prevents it from upgrading huggingface_hub to >=0.20.0
RUN echo "numpy==1.24.3" > /tmp/constraints_st.txt && \
    echo "huggingface_hub<0.20.0" >> /tmp/constraints_st.txt && \
    pip install --no-cache-dir "sentence-transformers==2.2.2" -c /tmp/constraints_st.txt && \
    pip install --no-cache-dir --force-reinstall "huggingface_hub<0.20.0" && \
    pip check && \
    python -c "import numpy; actual_version = numpy.__version__; assert actual_version == '1.24.3', f'CRITICAL: NumPy version {actual_version} is wrong! Expected 1.24.3. Build will fail.'" && \
    python -c "import huggingface_hub; hf_version = huggingface_hub.__version__; from packaging import version; assert version.parse(hf_version) < version.parse('0.20.0'), f'CRITICAL: huggingface_hub version {hf_version} is >=0.20.0! Need <0.20.0 for cached_download.'" && \
    python -c "from huggingface_hub import cached_download; print('✅ cached_download is available')" && \
    echo "✅ Verified NumPy 1.24.3, huggingface_hub<0.20.0, and cached_download are available"

# Force reinstall transformers to break Docker cache (use version from requirements.txt)
# Use 4.40.0-4.44.x for PyTorch 2.1.0 compatibility (4.45.0+ requires PyTorch 2.2.0+)
# CRITICAL: Reinstall NumPy after transformers to prevent upgrade
RUN pip install --no-cache-dir --force-reinstall "transformers>=4.40.0,<4.45.0" && \
    pip install --no-cache-dir --force-reinstall --no-deps "numpy==1.24.3" && \
    python -c "import numpy; assert numpy.__version__ == '1.24.3', f'NumPy upgraded to {numpy.__version__} after transformers install!'"

# Create dummy flash_attn module to satisfy Florence-2 import check
# The actual model will use eager attention as specified in attn_implementation parameter
RUN mkdir -p /usr/local/lib/python3.10/site-packages/flash_attn && \
    echo "# Dummy flash_attn module for Florence-2 CPU compatibility" > /usr/local/lib/python3.10/site-packages/flash_attn/__init__.py

# Copy worker script
COPY worker.py .

# Copy AI processing modules
COPY app/ ./app/

# Clear Python cache AFTER copying to ensure fresh code (no cached bytecode)
RUN find /app -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true && \
    find /app -type f -name "*.pyc" -delete 2>/dev/null || true && \
    find /app -type f -name "*.pyo" -delete 2>/dev/null || true && \
    python3 -Bc "import compileall; compileall.compile_dir('/app', force=True)" 2>/dev/null || true && \
    echo "Python cache cleared"

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
