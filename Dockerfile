FROM python:3.11-slim

# Tạo thư mục làm việc
WORKDIR /app

# Copy file requirements trước để cache layer
COPY requirements.txt .

# Cài dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ project
COPY . .

# Railway sẽ truyền biến PORT vào container
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT}"]
