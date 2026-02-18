# Use Node.js 20 as base
FROM node:20-bullseye

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install Node dependencies
RUN bun install --frozen-lockfile

# Copy Python requirements
COPY requirements.txt ./

# Upgrade pip and install Python packages
RUN pip3 install --upgrade pip && \
    pip3 install -r requirements.txt

# Copy application code
COPY . .

# Explicitly copy Python scripts and make executable
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.py

# Set DATABASE_URL for Prisma
ENV DATABASE_URL="file:/app/data/pdfmagic.db"

# Generate Prisma client and initialize database
RUN bunx prisma generate && bunx prisma db push --accept-data-loss

# Build the application
RUN bun run build

# Create necessary directories
RUN mkdir -p /app/upload /app/download /app/data

# Set environment variables
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8080

# Use explicit path to next binary
CMD ["sh", "-c", "cd /app && ./node_modules/.bin/next start --hostname 0.0.0.0 --port ${PORT:-8080}"]
