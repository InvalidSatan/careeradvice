FROM python:3.12-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    python3-pip \
    python3-tk \
    xvfb \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Add your application code
COPY . /app
WORKDIR /app

# Start Xvfb and run your application
CMD xvfb-run -a python CareerAdvice.py
