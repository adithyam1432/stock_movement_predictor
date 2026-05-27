from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import json

from api.services.data_parser import parse_and_clean_csv
from api.services.linear_algebra import apply_pca, compute_similarity_matrix, compute_weekday_similarity_matrix
from api.services.data_mining import cluster_candles, analyze_timeframes, analyze_weekday_dominance
from api.services.insight_engine import generate_insights
from api.services.yfinance_service import fetch_nse_data
from api.services.data_pipeline import clean_and_preprocess
from api.services.forecasting_service import generate_forecast
from pydantic import BaseModel


app = FastAPI(title="Candle Pattern Data Mining API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

@app.post("/api/analyze")
async def analyze_csv(file: UploadFile = File(...), timeframe: str = Form(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
        
        # 1. Parse and Clean Data
        df, cleaning_report = parse_and_clean_csv(df, timeframe)
        
        # 2. Timeframe Analysis
        timeframe_stats = analyze_timeframes(df)
        weekday_stats = analyze_weekday_dominance(df)
        
        # 3. Data Mining (KMeans Clustering)
        cluster_summary, cluster_labels = cluster_candles(df, n_clusters=5)
        
        # 4. Linear Algebra (PCA & Similarity)
        # 4.a Similarity Matrix
        similarity_data, timeframes = compute_similarity_matrix(df, metric='cosine')
        weekday_matrices = compute_weekday_similarity_matrix(df, metric='cosine')
        
        # 4.b PCA for 2D visualization (We'll return a sample of 3000 max to completely cover Weekday Mode datasets)
        pca_df = df.copy()
        if len(pca_df) > 3000:
            pca_df = pca_df.sample(3000, random_state=42)
            
        pca_points = apply_pca(pca_df, n_components=2)
        
        pca_data = []
        for i, point in enumerate(pca_points):
            pca_data.append({
                "x": round(point[0], 3),
                "y": round(point[1], 3),
                "cluster": int(pca_df['Cluster'].iloc[i]) if 'Cluster' in pca_df.columns else 0,
                "type": pca_df['Candle_Type'].iloc[i],
                "weekday": str(pca_df['Weekday'].iloc[i]) if 'Weekday' in pca_df.columns else "",
                "open": float(pca_df['Open'].iloc[i]) if 'Open' in pca_df.columns else 0.0,
                "close": float(pca_df['Close'].iloc[i]) if 'Close' in pca_df.columns else 0.0
            })
            
        # 5. AI Insights Engine
        insights = generate_insights(timeframe_stats, cluster_summary, weekday_stats)
        
        return {
            "status": "success",
            "timeframe": timeframe,
            "summary": {
                "total_candles": len(df),
                "bullish_count": len(df[df['Candle_Type'] == 'Bullish']),
                "bearish_count": len(df[df['Candle_Type'] == 'Bearish']),
                "neutral_count": len(df[df['Candle_Type'] == 'Neutral']),
            },
            "timeframe_stats": timeframe_stats,
            "weekday_stats": weekday_stats,
            "cluster_summary": cluster_summary,
            "similarity_matrix": similarity_data,
            "weekday_matrices": weekday_matrices,
            "pca_data": pca_data,
            "insights": insights,
            "cleaning_report": cleaning_report,
            "forecasts": forecast_data
        }
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class MarketRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    interval: str

@app.post("/api/fetch_market")
async def fetch_market(req: MarketRequest):
    try:
        # 1. Fetch from yfinance
        df = fetch_nse_data(req.symbol, req.start_date, req.end_date, req.interval)
        
        # 2. Clean and preprocess using the robust ML pipeline
        df, pipeline_logs = clean_and_preprocess(df)
        
        # We need to compute weekday
        if 'Weekday' not in df.columns:
            df['Weekday'] = pd.to_datetime(df['Date']).dt.day_name()
            
        # Ensure Candle_Type exists for cluster function
        if 'Candle_Type' not in df.columns:
            df['Candle_Type'] = df.apply(lambda row: 'Bullish' if row['Close'] > row['Open'] else ('Bearish' if row['Close'] < row['Open'] else 'Neutral'), axis=1)

        timeframe_stats = analyze_timeframes(df)
        weekday_stats = analyze_weekday_dominance(df)
        cluster_summary, cluster_labels = cluster_candles(df, n_clusters=5)
        
        similarity_data, timeframes = compute_similarity_matrix(df, metric='cosine')
        weekday_matrices = compute_weekday_similarity_matrix(df, metric='cosine')
        
        pca_df = df.copy()
        if len(pca_df) > 3000:
            pca_df = pca_df.sample(3000, random_state=42)
            
        pca_points = apply_pca(pca_df, n_components=2)
        pca_data = [{"x": round(point[0], 3), "y": round(point[1], 3), "cluster": int(pca_df['Cluster'].iloc[i]) if 'Cluster' in pca_df.columns else 0, "type": pca_df['Candle_Type'].iloc[i], "weekday": str(pca_df['Weekday'].iloc[i]) if 'Weekday' in pca_df.columns else "", "open": float(pca_df['Open'].iloc[i]), "close": float(pca_df['Close'].iloc[i])} for i, point in enumerate(pca_points)]
        
        insights = generate_insights(timeframe_stats, cluster_summary, weekday_stats)
        
        # Linear Regression Forecasting
        forecasts = generate_forecast(df, forecast_periods=10)
        
        return {
            "status": "success",
            "timeframe": req.interval,
            "summary": {
                "total_candles": len(df),
                "bullish_count": len(df[df['Candle_Type'] == 'Bullish']),
                "bearish_count": len(df[df['Candle_Type'] == 'Bearish']),
                "neutral_count": len(df[df['Candle_Type'] == 'Neutral']),
            },
            "timeframe_stats": timeframe_stats,
            "weekday_stats": weekday_stats,
            "cluster_summary": cluster_summary,
            "similarity_matrix": similarity_data,
            "weekday_matrices": weekday_matrices,
            "pca_data": pca_data,
            "insights": insights,
            "cleaning_report": "\n".join(pipeline_logs),
            "forecasts": forecasts
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
