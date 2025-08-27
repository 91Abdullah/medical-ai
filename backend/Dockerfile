# Backend Dockerfile (Python Flask)
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# (1) Copy the exact file you expect (make path explicit if needed)
# If compose build.context is ./backend this is fine; otherwise use:
# COPY backend/requirements.txt ./requirements.txt
COPY requirements.txt .

# (2) Print what’s actually inside the image (proves which file pip reads)
RUN pwd && ls -la && \
    echo "=== requirements.txt ===" && nl -ba requirements.txt && echo "=======================" && \
    echo "=== pip env/config ===" && env | sort | grep -i '^PIP\|^PYTHON' || true && \
    python -m pip config debug || true

# (3) Hard-disable any hash enforcement & stray pip.conf
ENV PIP_REQUIRE_HASHES=0 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN rm -f /etc/pip.conf /root/.pip/pip.conf /root/.config/pip/pip.conf || true

# (4) Install
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs uploads models
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Set environment variables
ENV PYTHONPATH=/app
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Command to run the application
CMD ["python", "app.py"]
