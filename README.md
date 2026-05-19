# Candle Pattern Linear Algebra Data Mining System

A complete AI-powered Data Mining Web Application for stock/index candle analysis using Linear Algebra and Machine Learning (KMeans Clustering, PCA).

## Tech Stack
- **Frontend**: React.js (Vite), Tailwind CSS, Recharts, React Dropzone
- **Backend**: Python FastAPI, Pandas, NumPy, Scikit-learn
- **Architecture**: Vercel Serverless ready

## Setup & Running Locally

### 1. Backend Setup
Make sure you have Python 3.9+ installed.
```bash
cd api
pip install -r requirements.txt
uvicorn index:app --reload --port 8000
```

### 2. Frontend Setup
```bash
npm install
npm run dev
```

### 3. Generate Sample Data
You can generate a sample dataset to test the platform.
```bash
python generate_data.py
```
This will create `sample_data.csv` which you can upload via the web interface.

## Deployment to Vercel

This project is configured out-of-the-box for Vercel deployment.
1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Vercel will automatically detect the Vite frontend and the Python backend in the `api/` directory using the provided `vercel.json`.

## Docker Setup
You can also run the entire application using Docker Compose.
```bash
docker-compose up --build
```
