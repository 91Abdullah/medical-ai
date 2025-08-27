# Medical AI Diagnostics Platform

A comprehensive full-stack medical AI web application for analyzing medical images and predicting biomarkers using advanced machine learning models.

## 🩺 Features

### Frontend (Next.js 15 + Radix UI)
- **Responsive Design**: Mobile-friendly interface optimized for medical professionals
- **Disease Analysis Modules**:
  - AMD (Age-related Macular Degeneration) - OCT & Fundus analysis
  - Glaucoma - Fundus image classification
  - **Diabetic Retinopathy** - Fundus severity grading (3-class: No DR, Early pathology, Advanced pathology)
- **Biomarker Prediction**: 18 different biomarkers from retinal images
- **DICOM Support**: Upload and analyze DICOM files with metadata extraction
- **Real-time Results**: Instant predictions with confidence scores
- **PDF Export**: Generate comprehensive reports with images and metadata
- **Image Viewing**: Display analyzed images alongside results

### Backend (Flask + Python)
- **REST API**: Comprehensive API endpoints for all models
- **Model Support**:
  - PyTorch models (.pt, .pth)
  - TensorFlow/Keras models (.keras)
- **Database**: SQLite with PostgreSQL migration support
- **DICOM Processing**: Full DICOM metadata extraction and image processing
- **Logging & Analytics**: Complete request logging and usage statistics

## 🏗️ Architecture

```
disease-biomarker-app/
├── frontend/                 # Next.js 15 application
│   ├── app/                 # App router pages
│   ├── components/          # Reusable UI components
│   └── lib/                 # Utilities and API client
├── backend/                 # Flask API server
│   ├── models/              # AI model files
│   ├── routes/              # API route handlers
│   ├── services/            # Model management
│   ├── database/            # Database models
│   └── utils/               # Helper utilities
└── .github/                 # GitHub workflows and configs
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- Git

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## 📊 Supported Models

### AMD Analysis
- **OCT Classifier**: Multi-class PyTorch model (.pt)
  - Classes: Normal, Early AMD, Intermediate AMD, Advanced AMD
- **Fundus Classifier**: Binary PyTorch model (.pth)
  - Classes: No AMD, AMD Present

### Glaucoma Analysis
- **Fundus Classifier**: Keras model (.keras)
  - Classes: No Glaucoma, Glaucoma Suspected, Glaucoma

### Diabetic Retinopathy Analysis
- **Fundus Classifier**: PyTorch model (.pth)
  - Classes: No DR, Early pathology, Advanced pathology
  - Model: `model_fold5_acc0.8097.pth`

### Biomarker Prediction (18 Models)
Each biomarker uses a specialized PyTorch model (.pth):

**Cardiovascular**:
- BP_OUT_CALC_AVG_DIASTOLIC_BP
- BP_OUT_CALC_AVG_SYSTOLIC_BP
- Cholesterol Total
- HDL-Cholesterol
- LDL-Cholesterol Calc
- Triglyceride

**Metabolic**:
- Glucose
- HbA1C %
- Insulin
- BMI

**Hormonal**:
- Estradiol
- Testosterone Total
- Sex Hormone Binding Globulin

**Hematological**:
- Hemoglobin
- Hematocrit
- Red Blood Cell

**Other**:
- Age
- Creatinine

## 🔌 API Endpoints

### Health & Info
- `GET /api/health` - Health check
- `GET /api/stats` - Usage statistics
- `GET /api/models/info` - Loaded models information

### Disease Analysis
- `POST /api/amd/oct` - AMD OCT analysis
- `POST /api/amd/fundus` - AMD fundus analysis
- `POST /api/glaucoma/fundus` - Glaucoma analysis
- `POST /api/dr/fundus` - Diabetic retinopathy analysis
- `POST /api/dr/oct` - DR OCT analysis (placeholder)

### Biomarkers
- `GET /api/biomarkers/list` - List all biomarkers
- `POST /api/biomarkers/<name>` - Predict specific biomarker
- `POST /api/biomarkers/batch` - Batch biomarker prediction

### DICOM
- `POST /api/dicom/metadata` - Extract DICOM metadata

## 🖼️ Image Support

### Supported Formats
- **JPEG/JPG** - Standard medical images
- **PNG** - Lossless medical images
- **DICOM** - Medical imaging standard with metadata

### Image Processing
- Automatic contrast enhancement for OCT images
- Fundus ROI detection and cropping
- Illumination normalization
- Standardized preprocessing pipelines

## 💾 Database Schema

### Tables
- **inference_logs** - Model predictions and metadata
- **dicom_metadata** - DICOM file information
- **biomarker_predictions** - Biomarker results

### Features
- Automatic logging of all predictions
- Performance metrics tracking
- User analytics (anonymized)
- Audit trail for medical compliance

## 🔧 Configuration

### Environment Variables

**Frontend (.env.local)**:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Medical AI Diagnostics
```

**Backend**:
```
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///medical_ai.db
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
```

## 📱 Mobile Support

The application is fully responsive and optimized for:
- **Tablets**: Perfect for clinical workflows
- **Mobile Phones**: Quick image uploads and results viewing
- **Desktop**: Full-featured analysis interface

## 🔒 Security & Compliance

### Data Protection
- HIPAA-compliant processing (configurable)
- Automatic DICOM data anonymization
- Secure file upload validation
- No permanent storage of uploaded images

### API Security
- Request rate limiting
- File size and type validation
- Input sanitization
- Error handling and logging

## 🎯 Use Cases

### Clinical Applications
- Ophthalmology screening programs
- Diabetic eye disease monitoring
- Preventive care assessments
- Research data analysis

### Research Applications
- Large-scale population studies
- Biomarker correlation research
- AI model validation
- Clinical trial support

## 🛣️ Roadmap

### Immediate (v1.1)
- [ ] Diabetic Retinopathy analysis
- [ ] Batch file processing
- [ ] Enhanced DICOM support

### Near-term (v1.2)
- [ ] User authentication
- [ ] Report generation (PDF)
- [ ] Integration APIs

### Long-term (v2.0)
- [ ] Real-time video analysis
- [ ] Multi-language support
- [ ] Cloud deployment options

## 🧪 Development

### Running Tests
```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
python -m pytest
```

### Model Integration
To add new models, place them in `backend/models/` and update the model manager configuration.

### Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This software is intended for research and educational purposes only. It should not be used as a substitute for professional medical diagnosis or treatment. Always consult with qualified healthcare providers for medical decisions.

## 🤝 Support

For technical support or questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

---

**Built with ❤️ for the medical AI community**
