# Medical AI Diagnostics Platform - Docker Deployment Guide

## 🚀 Quick Start with Docker

This guide will help you deploy the Medical AI Diagnostics Platform using Docker containers for production-ready deployment.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/) (version 24.0 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or later)
- At least 8GB RAM (recommended for ML models)
- 20GB free disk space (for models and container images)

## 🏗️ Project Structure

```
disease-biomarker-app/
├── frontend/
│   ├── Dockerfile
│   └── [Next.js app files]
├── backend/
│   ├── Dockerfile
│   ├── models/          # ML models (you need to add these)
│   └── [Flask app files]
├── docker-compose.yml
└── DEPLOYMENT.md        # This file
```

## 📦 Step 1: Prepare ML Models

Before building the containers, you need to place your ML models in the correct directories:

1. Create the models directory structure:
```bash
mkdir -p backend/models
mkdir -p backend/models/biomarkers
```

2. Place your models in the following structure:
```
backend/models/
├── best_f1.pt                                    # AMD OCT model (PyTorch)
├── AMD_Fundus_Binary_calssifier_Model_resnet50.pth  # AMD Fundus model (PyTorch)
├── best.keras                                    # Glaucoma Fundus model (Keras)
├── model_fold5_acc0.8097.pth                    # DR Fundus model (PyTorch)
├── my_model.h5                                   # Alternative model format
└── biomarkers/                                   # Biomarker models directory
    ├── age_model.pth
    ├── bmi_model.pth
    ├── cholesterol_model.pth
    └── [... other biomarker models]
```

## 🚀 Step 2: Build and Deploy

### Option A: Production Deployment (Recommended)

1. **Clone/Navigate to the project directory:**
```bash
cd disease-biomarker-app
```

2. **Build and start all services:**
```bash
docker-compose up --build -d
```

3. **Verify deployment:**
```bash
# Check if containers are running
docker-compose ps

# Check logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Option B: Development Deployment

For development with live code changes:

1. **Start services in development mode:**
```bash
docker-compose up --build
```

2. **View real-time logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

## 🔧 Step 3: Configuration

### Environment Variables

You can customize the deployment by modifying environment variables in `docker-compose.yml`:

**Frontend Environment Variables:**
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:5000)
- `NEXT_PUBLIC_APP_NAME`: Application name
- `NODE_ENV`: Environment mode (production/development)

**Backend Environment Variables:**
- `SECRET_KEY`: Flask secret key (change for production!)
- `DATABASE_URL`: Database connection string
- `CORS_ORIGINS`: Allowed CORS origins
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)
- `MAX_CONTENT_LENGTH`: Maximum file upload size

### Production Configuration

For production deployment, update these settings:

1. **Change the secret key** in `docker-compose.yml`:
```yaml
environment:
  - SECRET_KEY=your-very-secure-secret-key-here
```

2. **Update CORS origins** for your domain:
```yaml
environment:
  - CORS_ORIGINS=https://yourdomain.com
```

3. **Enable PostgreSQL** (optional, uncomment in docker-compose.yml):
```yaml
# Uncomment the postgres service and update backend DATABASE_URL
- DATABASE_URL=postgresql://medical_user:secure_password@postgres:5432/medical_ai
```

## 🗄️ Step 4: Data Persistence

The deployment includes persistent volumes for:

- **Database**: SQLite database files
- **Uploads**: User-uploaded images and files
- **Logs**: Application logs
- **Models**: ML model files (mounted read-only)

### Backup Data

To backup persistent data:

```bash
# Backup database
docker-compose exec backend cp /app/database/medical_ai.db /app/database/backup_$(date +%Y%m%d).db

# Copy backup to host
docker cp $(docker-compose ps -q backend):/app/database/backup_$(date +%Y%m%d).db ./backup_$(date +%Y%m%d).db
```

## 🔍 Step 5: Monitoring and Troubleshooting

### Health Checks

The backend includes health checks. Monitor service health:

```bash
# Check health status
docker-compose ps

# Manual health check
curl http://localhost:5000/api/health
```

### Common Issues and Solutions

1. **Port conflicts:**
```bash
# Change ports in docker-compose.yml if 3000 or 5000 are in use
ports:
  - "3001:3000"  # Frontend
  - "5001:5000"  # Backend
```

2. **Memory issues with ML models:**
```bash
# Increase Docker memory limit to at least 8GB
# On Docker Desktop: Settings > Resources > Memory
```

3. **Model loading errors:**
```bash
# Check if models are present
docker-compose exec backend ls -la /app/models/

# Check backend logs for specific errors
docker-compose logs backend | grep -i error
```

4. **Permission issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER backend/models/
chmod -R 755 backend/models/
```

### Debugging Commands

```bash
# Enter backend container shell
docker-compose exec backend /bin/bash

# Enter frontend container shell
docker-compose exec frontend /bin/sh

# View real-time container stats
docker stats

# Restart specific service
docker-compose restart backend
```

## 🔄 Step 6: Updates and Maintenance

### Updating the Application

1. **Pull latest changes:**
```bash
git pull origin main
```

2. **Rebuild and restart:**
```bash
docker-compose down
docker-compose up --build -d
```

### Scaling Services

For high-traffic environments, scale the backend:

```bash
# Scale backend to 3 instances
docker-compose up --scale backend=3 -d
```

### Cleaning Up

```bash
# Stop all services
docker-compose down

# Remove containers and volumes (⚠️ This deletes data!)
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

## 🌐 Step 7: Production Deployment (Cloud)

### Option 1: DigitalOcean Droplet

1. **Create GPU-enabled droplet** (recommended: 8GB RAM, 4 vCPUs)
2. **Install Docker and Docker Compose**
3. **Clone repository and follow steps above**
4. **Configure firewall:**
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 3000  # Frontend (or use reverse proxy)
ufw enable
```

### Option 2: AWS EC2 with GPU

1. **Launch EC2 instance** (p3.2xlarge or similar)
2. **Install NVIDIA Docker runtime**
3. **Follow deployment steps**

### Option 3: Google Cloud Platform

1. **Create Compute Engine instance** with GPU
2. **Install Docker and NVIDIA runtime**
3. **Deploy using steps above**

## 🔐 Security Considerations

1. **Change default secrets** in production
2. **Use HTTPS** with reverse proxy (nginx/caddy)
3. **Implement authentication** if needed
4. **Regular security updates**
5. **Monitor logs** for suspicious activity

## 📞 Support and Troubleshooting

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify models are properly placed in `/backend/models/`
3. Ensure sufficient system resources (RAM/disk space)
4. Check firewall/port configurations
5. Verify Docker and Docker Compose versions

## 🎯 Quick Testing

After deployment, test the following endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Frontend accessibility
curl http://localhost:3000

# Test file upload (example)
curl -X POST -F "file=@test_image.jpg" http://localhost:5000/api/amd/fundus
```

---

## ✅ Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] ML models placed in correct directories
- [ ] Updated environment variables for production
- [ ] Built and started containers successfully
- [ ] Verified frontend and backend accessibility
- [ ] Tested basic functionality
- [ ] Configured monitoring/logging
- [ ] Set up backup procedures
- [ ] Implemented security measures

Your Medical AI Diagnostics Platform is now ready for production use! 🎉
