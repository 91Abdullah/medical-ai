# Medical AI Diagnostics Platform - Developer Guide

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd disease-biomarker-app

# Setup frontend
cd frontend
npm install
npm run dev

# Setup backend (in new terminal)
cd ../backend
pip install -r requirements.txt
python app.py
```

### Environment Configuration

**Frontend (.env.local)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Medical AI Diagnostics
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

**Backend (.env)**:
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///medical_ai.db
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
MAX_CONTENT_LENGTH=16777216
```

## 🏗️ Project Structure

```
disease-biomarker-app/
├── frontend/                    # Next.js 15 application
│   ├── app/                    # App router pages
│   │   ├── amd/               # AMD analysis page
│   │   ├── glaucoma/          # Glaucoma analysis page
│   │   ├── dr/                # Diabetic retinopathy page
│   │   ├── biomarkers/        # Biomarker prediction page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # Reusable UI components
│   │   ├── FileUpload.tsx     # File upload component
│   │   ├── PredictionCard.tsx # Results display
│   │   ├── MetadataCard.tsx   # DICOM metadata
│   │   └── LoadingSpinner.tsx # Loading indicator
│   ├── lib/                   # Utilities and API client
│   │   ├── api.ts            # API client functions
│   │   └── utils.ts          # Helper utilities
│   └── styles/               # Global styles
├── backend/                   # Flask API server
│   ├── models/               # AI model files (.pt, .pth, .keras)
│   ├── routes/               # API route handlers
│   │   ├── amd.py           # AMD endpoints
│   │   ├── glaucoma.py      # Glaucoma endpoints
│   │   ├── biomarkers.py    # Biomarker endpoints
│   │   └── dicom.py         # DICOM processing
│   ├── services/            # Model management
│   │   └── model_manager.py # Model loading and inference
│   ├── database/            # Database models and setup
│   │   └── models.py        # SQLAlchemy models
│   ├── utils/               # Helper utilities
│   │   ├── preprocessing.py # Image preprocessing
│   │   └── dicom_utils.py   # DICOM processing
│   ├── app.py              # Flask application entry point
│   └── config.py           # Configuration settings
└── docs/                   # Documentation
```

## 🧪 Model Integration

### Adding New Models

1. **Place Model Files**: Add your model files to `backend/models/`
   ```
   backend/models/
   ├── amd_oct_model.pt
   ├── amd_fundus_model.pth
   ├── glaucoma_model.keras
   └── biomarker_[name]_model.pth
   ```

2. **Update Model Manager**: Modify `backend/services/model_manager.py`:
   ```python
   MODEL_CONFIGS = {
       'your_model': {
           'path': 'models/your_model.pt',
           'type': 'pytorch',
           'classes': ['class1', 'class2'],
           'preprocessing': 'standard'
       }
   }
   ```

3. **Create API Route**: Add endpoint in appropriate route file:
   ```python
   @app.route('/api/your-model', methods=['POST'])
   def predict_your_model():
       # Implementation
   ```

### Model Requirements

- **PyTorch Models**: Save as `.pt` or `.pth`
- **TensorFlow/Keras**: Save as `.keras`
- **Input Shape**: Document expected input dimensions
- **Classes**: Provide class labels for classification models

## 🔌 API Development

### Adding New Endpoints

1. **Create Route Handler**:
   ```python
   # backend/routes/new_feature.py
   from flask import Blueprint, request, jsonify
   
   bp = Blueprint('new_feature', __name__)
   
   @bp.route('/api/new-feature', methods=['POST'])
   def new_feature_endpoint():
       # Implementation
       pass
   ```

2. **Register Blueprint**:
   ```python
   # backend/app.py
   from routes.new_feature import bp as new_feature_bp
   app.register_blueprint(new_feature_bp)
   ```

3. **Add Frontend API Call**:
   ```typescript
   // frontend/lib/api.ts
   export async function callNewFeature(data: FormData) {
     return apiCall('/api/new-feature', 'POST', data);
   }
   ```

### API Response Format

```json
{
  "success": true,
  "data": {
    "prediction": "result",
    "confidence": 0.95,
    "processing_time": 1.2
  },
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🎨 Frontend Development

### Component Guidelines

1. **Use Radix UI**: Leverage existing components
2. **TypeScript**: All components must be typed
3. **Responsive**: Mobile-first design
4. **Accessibility**: Follow WCAG guidelines

### Adding New Pages

1. **Create Page Component**:
   ```typescript
   // frontend/app/new-page/page.tsx
   export default function NewPage() {
     return <div>New Page Content</div>;
   }
   ```

2. **Add Navigation**: Update layout or navigation components

3. **Implement API Integration**: Use existing API client

### Styling Guidelines

- **TailwindCSS**: Use utility classes
- **Design System**: Follow medical UI patterns
- **Dark Mode**: Support system preference
- **Responsive**: Test on mobile/tablet/desktop

## 🗄️ Database Development

### Adding New Tables

1. **Define Model**:
   ```python
   # backend/database/models.py
   class NewTable(db.Model):
       __tablename__ = 'new_table'
       id = db.Column(db.Integer, primary_key=True)
       # Add fields
   ```

2. **Create Migration** (if using migrations):
   ```python
   # Create database tables
   with app.app_context():
       db.create_all()
   ```

### Database Best Practices

- **Indexing**: Add indexes for query performance
- **Relationships**: Use foreign keys appropriately
- **Validation**: Validate data before storage
- **Logging**: Log all database operations

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm test                 # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Backend Testing
```bash
cd backend
python -m pytest                    # Run all tests
python -m pytest tests/test_api.py  # Specific test file
python -m pytest --cov=.           # Coverage report
```

### Test Structure
```
tests/
├── frontend/
│   ├── components/
│   └── pages/
└── backend/
    ├── test_api.py
    ├── test_models.py
    └── test_utils.py
```

## 🚀 Deployment

### Production Build

**Frontend**:
```bash
cd frontend
npm run build
npm start
```

**Backend**:
```bash
cd backend
pip install gunicorn
gunicorn app:app
```

### Environment Variables

**Production Frontend**:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_NAME=Medical AI Diagnostics
NODE_ENV=production
```

**Production Backend**:
```env
SECRET_KEY=secure-production-key
DATABASE_URL=postgresql://user:pass@host:port/db
CORS_ORIGINS=https://your-frontend-domain.com
LOG_LEVEL=WARNING
```

### Docker Support

**Frontend Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Backend Dockerfile**:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "app:app", "--host", "0.0.0.0"]
```

## 🔍 Debugging

### Common Issues

1. **Model Loading Errors**:
   - Check file paths and permissions
   - Verify model format compatibility
   - Check Python/PyTorch versions

2. **API Connection Issues**:
   - Verify CORS settings
   - Check environment variables
   - Test API endpoints directly

3. **File Upload Problems**:
   - Check file size limits
   - Verify supported formats
   - Test file validation logic

### Logging

**Backend Logging**:
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

**Frontend Error Tracking**:
```typescript
// Use browser console or error tracking service
console.error('Error details:', error);
```

## 📚 Resources

### Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Radix UI Components](https://www.radix-ui.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [PyTorch Documentation](https://pytorch.org/docs/)

### Medical AI Resources
- [DICOM Standard](https://www.dicomstandard.org/)
- [Medical Imaging Formats](https://en.wikipedia.org/wiki/Medical_imaging)
- [FDA AI/ML Guidelines](https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-software-medical-device)

### Development Tools
- [VS Code Extensions](https://code.visualstudio.com/docs/editor/extension-marketplace)
- [Postman for API Testing](https://www.postman.com/)
- [GitHub Actions for CI/CD](https://github.com/features/actions)

---

For additional help, create an issue or contact the development team.
