# Add .env file for environment variables
echo "SECRET_KEY=your-secret-key-here" > .env
echo "DATABASE_URL=sqlite:///medical_ai.db" >> .env
echo "CORS_ORIGINS=http://localhost:3000" >> .env
echo "LOG_LEVEL=INFO" >> .env

# Create models directory if not exists
mkdir -p backend/models
mkdir -p backend/models/biomarkers

# Create necessary directories for Docker volumes
mkdir -p backend/logs
mkdir -p backend/database
mkdir -p backend/uploads

# Make sure proper permissions
chmod 755 backend/models
chmod 755 backend/logs
chmod 755 backend/database
chmod 755 backend/uploads

echo "Docker setup preparation complete!"
echo ""
echo "Next steps:"
echo "1. Place your ML model files in backend/models/"
echo "2. Run: docker-compose up --build"
echo "3. Access frontend at http://localhost:3000"
echo "4. Access backend at http://localhost:5000"
