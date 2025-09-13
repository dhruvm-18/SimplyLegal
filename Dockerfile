# Multi-stage Docker build for SimplyLegal App
# Stage 1: Build React frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps for compatibility
RUN npm ci --legacy-peer-deps

# Copy frontend source code
COPY src/ ./src/
COPY public/ ./public/

# Build the React app for production
RUN npm run build

# Stage 2: Python backend with built frontend
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies including curl for health checks
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install additional production dependencies
RUN pip install --no-cache-dir gunicorn

# Copy backend source code
COPY *.py ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/build ./static

# Create necessary directories with proper permissions
RUN mkdir -p uploads processed cache data && \
    chmod 755 uploads processed cache data

# Set environment variables
ENV FLASK_ENV=production
ENV PYTHONPATH=/app
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Create a non-root user for security
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

# Run the application with Gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120", "--keep-alive", "2", "--max-requests", "1000", "--max-requests-jitter", "100", "production_backend:app"]