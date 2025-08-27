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

# upgrade pip first (separate layer)
RUN python -m pip install --upgrade pip

# make absolutely sure hash checking is OFF
RUN python -m pip config set global.require-hashes false

# (optional defense) clear any config files that might sneak in
RUN rm -f /etc/pip.conf /root/.pip/pip.conf /root/.config/pip/pip.conf || true

# now install
RUN pip install --no-cache-dir -r requirements.txt

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
