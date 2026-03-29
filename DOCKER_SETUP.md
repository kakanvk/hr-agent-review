# 🐳 Docker Setup Guide

## Cấu trúc Docker

- **server/Dockerfile**: Production-grade Dockerfile cho Express backend
- **client/Dockerfile**: Multi-stage build cho React frontend
- **docker-compose.yml**: Production compose file
- **docker-compose.dev.yml**: Development compose file (hot-reload)

## 🚀 Chạy Production

### 1. Setup Environment
```bash
cp .env.docker .env.local
# Cập nhật các API keys trong .env.local:
# - GEMINI_API_KEY
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
```

### 2. Build & Run
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mongodb
```

### 3. Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### 4. Stop
```bash
docker-compose down
```

---

## 🔧 Chạy Development (Hot-Reload)

```bash
# Sử dụng docker-compose.dev.yml để có hot-reload
docker-compose -f docker-compose.dev.yml up

# Services chạy ở:
# - Client: http://localhost:5173 (auto-reload on file change)
# - Server: http://localhost:5000 (nodemon auto-reload)
# - MongoDB: localhost:27017
```

---

## 📋 Available Commands

### Development
```bash
# Start with hot-reload
docker-compose -f docker-compose.dev.yml up

# Stop
docker-compose -f docker-compose.dev.yml down
```

### Production
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Stop & remove containers
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Execute command in container
docker-compose exec server npm install [package]
docker-compose exec client npm install [package]
```

### Database
```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh

# Backup
docker-compose exec mongodb mongodump --out /backup

# Restore
docker-compose exec mongodb mongorestore /backup
```

---

## 🔒 Environment Variables

Các biến quan trọng phải được set trước chạy:

| Variable | Mô tả | Required |
|----------|-------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `MONGO_URI` | MongoDB connection string | Default: `mongodb://mongodb:27017/hr-agent` |

---

## 🐛 Troubleshooting

### Container không start
```bash
# Xem chi tiết lỗi
docker-compose logs [service-name]

# Rebuild container
docker-compose up --build
```

### MongoDB connection error
```bash
# Kiểm tra MongoDB health
docker-compose ps

# Restart MongoDB
docker-compose restart mongodb
```

### Port already in use
```bash
# Thay đổi port trong docker-compose.yml
# Hoặc kill process đang dùng port:
lsof -i :5000
kill -9 [PID]
```

### Xóa toàn bộ volumes & containers
```bash
docker-compose down -v
```

---

## 📦 Build Images Locally

```bash
# Build server
docker build -t hr-agent-server:latest ./server

# Build client
docker build -t hr-agent-client:latest ./client

# Build and tag for registry
docker build -t registry.example.com/hr-agent-server:1.0.0 ./server
docker push registry.example.com/hr-agent-server:1.0.0
```

---

## 🌐 Production Deployment

Khi deploy lên production:

1. **Cập nhật environment variables** với actual values
2. **Đổi GOOGLE_REDIRECT_URI** từ `localhost` thành domain thực
3. **Set JWT_SECRET** với random string dài hơn
4. **Enable https** bằng nginx reverse proxy hoặc load balancer
5. **Setup volume mounts** cho persistent data (uploads, mongodb)

### Nginx Reverse Proxy Example
```nginx
upstream backend {
    server server:5000;
}

upstream frontend {
    server client:5173;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }
}
```

---

## ✅ Checklist Pre-Deployment

- [ ] All environment variables set
- [ ] MongoDB backup configured
- [ ] Volumes mounted properly
- [ ] Health checks passing
- [ ] Logs monitored
- [ ] Security groups configured
- [ ] Backup & recovery plan in place
