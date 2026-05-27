import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

def generate_forecast(df: pd.DataFrame, forecast_periods=10) -> list:
    """
    Uses Linear Regression to project future price movements.
    Trains on the historical trend and returns projected future candlesticks/trendlines.
    
    Args:
        df: Cleaned and normalized DataFrame
        forecast_periods: Number of future periods to predict (e.g., 10 candles)
        
    Returns:
        List of dictionaries containing forecasted points.
    """
    if len(df) < 5:
        return []
        
    # To forecast the next 10 candles accurately, we should not fit a straight line across 
    # the entire dataset (e.g., 3000 candles), as that ignores short-term momentum.
    # We train on the last 50 candles to capture the current market regime.
    lookback = min(len(df), 50)
    recent_df = df.tail(lookback).reset_index(drop=True)
    
    # We use a time-index as our independent variable (X)
    X = np.arange(lookback).reshape(-1, 1)
    
    # We predict the Close price (y)
    y_close = recent_df['Close'].values
    
    # Apply sample weights (more recent candles have higher weight in the regression)
    # This leverages the momentum concept (recent price action matters more)
    weights = np.linspace(0.5, 1.5, lookback)
    
    # Train the Linear Regression model
    model_close = LinearRegression()
    model_close.fit(X, y_close, sample_weight=weights)
    
    # Calculate the step size (interval) between timestamps
    if len(recent_df) > 1:
        time_delta = recent_df['Datetime'].iloc[-1] - recent_df['Datetime'].iloc[-2]
    else:
        time_delta = pd.Timedelta(minutes=15)
        
    last_timestamp = recent_df['Datetime'].iloc[-1]
    
    # Generate future indices
    X_future = np.arange(lookback, lookback + forecast_periods).reshape(-1, 1)
    
    # Predict future prices
    predicted_close = model_close.predict(X_future)
    
    # We also train models on Open, High, Low to reconstruct a "forecasted candle"
    model_open = LinearRegression().fit(X, recent_df['Open'].values, sample_weight=weights)
    model_high = LinearRegression().fit(X, recent_df['High'].values, sample_weight=weights)
    model_low = LinearRegression().fit(X, recent_df['Low'].values, sample_weight=weights)
    
    predicted_open = model_open.predict(X_future)
    predicted_high = model_high.predict(X_future)
    predicted_low = model_low.predict(X_future)
    
    forecasts = []
    
    for i in range(forecast_periods):
        future_time = last_timestamp + (time_delta * (i + 1))
        
        # Ensure structural integrity of forecasted candles
        p_open = predicted_open[i]
        p_close = predicted_close[i]
        p_high = max(predicted_high[i], p_open, p_close)
        p_low = min(predicted_low[i], p_open, p_close)
        
        forecasts.append({
            "Datetime": future_time.strftime('%Y-%m-%d %H:%M:%S'),
            "Date": future_time.strftime('%Y-%m-%d'),
            "Time": future_time.strftime('%H:%M'),
            "Open": round(p_open, 2),
            "High": round(p_high, 2),
            "Low": round(p_low, 2),
            "Close": round(p_close, 2),
            "is_forecast": True
        })
        
    return forecasts
