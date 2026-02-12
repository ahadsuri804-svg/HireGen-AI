FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first (for layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY Backend/ ./Backend/
COPY text_to_voice/ ./text_to_voice/
COPY email_system/ ./email_system/
COPY report_genrater/ ./report_genrater/
COPY voice_for_interviewer/ ./voice_for_interviewer/
COPY yolov8n.pt ./yolov8n.pt

# Create necessary directories
RUN mkdir -p uploads reports sessions resume

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run application
CMD ["uvicorn", "Backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
