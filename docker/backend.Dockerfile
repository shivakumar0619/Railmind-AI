# Stage 1: Dependencies
FROM python:3.12-slim AS builder

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Application
FROM python:3.12-slim

RUN groupadd -r railmind && useradd -r -g railmind railmind

WORKDIR /app

COPY --from=builder /install /usr/local
COPY backend/ .

RUN chown -R railmind:railmind /app
USER railmind

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
