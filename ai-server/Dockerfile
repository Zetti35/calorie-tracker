FROM python:3.11-slim

# Install dependencies including zstd for Ollama
RUN apt-get update && apt-get install -y curl zstd && \
    curl -fsSL https://ollama.com/install.sh | sh

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Start Ollama and pull model, then start FastAPI
CMD ollama serve & \
    sleep 5 && \
    ollama pull llama3.2:1b && \
    uvicorn main:app --host 0.0.0.0 --port $PORT
