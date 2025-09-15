FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml /app/
RUN pip install --upgrade pip && pip install poetry && poetry install --no-root
COPY app /app/app
ENV PORT=8000
EXPOSE 8000
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
