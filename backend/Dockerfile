# Backend Dockerfile with multi-stage build
FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \\n    PYTHONUNBUFFERED=1 \\n    PYTHONHASHSEED=random \\n    PIP_NO_CACHE_DIR=1 \\n    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \\n    gcc \\n    && apt-get clean \\n    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set work directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM base AS production

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Create directory for logs
RUN mkdir -p logs

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \\n    CMD python -c \"import requests; requests.get('http://localhost:5000/api/health')\" || exit 1

# Expose port
EXPOSE 5000

# Start application with gunicorn
CMD [\"gunicorn\", \"-w\", \"4\", \"-b\", \"0.0.0.0:5000\", \"--timeout\", \"120\", \"--keep-alive\", \"2\", \"--max-requests\", \"1000\", \"--max-requests-jitter\", \"100\", \"wsgi:application\"]

# Development stage
FROM base AS development

# Install development dependencies
RUN pip install --no-cache-dir pytest pytest-cov black flake8 mypy

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 5000

# Start application in development mode
CMD [\"python\", \"app.py\"]