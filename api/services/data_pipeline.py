import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

def clean_and_preprocess(df: pd.DataFrame) -> tuple:
    """
    Robust Python-based data cleaning and preprocessing pipeline.
    Executes automatically before any analysis, prediction, or pattern evaluation.
    
    Operations:
    1. Duplicate removal
    2. Missing value (NaN) detection and interpolation
    3. OHLCV structural validation (e.g. Low <= High)
    4. Outlier detection and noise smoothing (IQR method)
    5. Feature scaling for ML models
    
    Returns:
      (cleaned_df, cleaning_logs)
    """
    logs = []
    
    if df.empty:
        return df, ["Pipeline aborted: Empty dataframe provided."]

    # --- 1. Duplicate Removal ---
    initial_len = len(df)
    df = df.drop_duplicates(subset=['Datetime'], keep='last').copy()
    dupes = initial_len - len(df)
    if dupes > 0:
        logs.append(f"Removed {dupes} duplicate timestamp records.")
        
    # Sort chronologically just in case
    df = df.sort_values('Datetime').reset_index(drop=True)
    
    # --- 2. Missing Value Handling (NaN Interpolation) ---
    # We forward-fill prices because stock prices remain the same if no trades occur.
    # Volume is filled with 0.
    numeric_cols = ['Open', 'High', 'Low', 'Close']
    
    for col in numeric_cols:
        if col in df.columns:
            missing = df[col].isna().sum()
            if missing > 0:
                df[col] = df[col].ffill().bfill()
                logs.append(f"Interpolated {missing} missing values in {col} using forward-fill.")
                
    if 'Volume' in df.columns:
        v_missing = df['Volume'].isna().sum()
        if v_missing > 0:
            df['Volume'] = df['Volume'].fillna(0)
            logs.append(f"Replaced {v_missing} missing Volume values with 0.")

    # --- 3. OHLCV Validation & Correction ---
    # It is mathematically impossible for Low > High. We must fix corrupted records.
    corrupted_hl = df['Low'] > df['High']
    if corrupted_hl.any():
        num_corrupt = corrupted_hl.sum()
        # Swap them to fix the corruption
        df.loc[corrupted_hl, ['Low', 'High']] = df.loc[corrupted_hl, ['High', 'Low']].values
        logs.append(f"Corrected {num_corrupt} structural anomalies (Low > High swapped).")
        
    # --- 4. Outlier Detection & Noise Smoothing (IQR) ---
    # We detect extreme, impossible price spikes (e.g., API glitches where a stock jumps 10,000% in 1 minute)
    # and cap them to reasonable bounds.
    if len(df) > 10:
        q1 = df['Close'].quantile(0.01)
        q3 = df['Close'].quantile(0.99)
        iqr = q3 - q1
        
        # Define strict bounds (very wide to only catch extreme glitches, not normal market crashes)
        lower_bound = q1 - (3 * iqr)
        upper_bound = q3 + (3 * iqr)
        
        outliers = (df['Close'] < lower_bound) | (df['Close'] > upper_bound)
        num_outliers = outliers.sum()
        
        if num_outliers > 0:
            # We clip the outliers to the bounds to smooth the noise
            for col in ['Open', 'High', 'Low', 'Close']:
                df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
            logs.append(f"Smoothed {num_outliers} extreme price outliers exceeding 3x IQR bounds.")

    # --- 5. Feature Engineering for ML ---
    # Calculate body size and direction (essential for pattern mining)
    df['Body_Size'] = abs(df['Close'] - df['Open'])
    df['Direction'] = np.where(df['Close'] >= df['Open'], 1, -1)
    
    # Calculate Moving Averages for Forecasting context
    df['SMA_20'] = df['Close'].rolling(window=20, min_periods=1).mean()
    df['SMA_50'] = df['Close'].rolling(window=50, min_periods=1).mean()
    
    # Calculate RSI (14 period)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14, min_periods=1).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14, min_periods=1).mean()
    rs = gain / (loss + 1e-8)
    df['RSI'] = 100 - (100 / (1 + rs))
    df['RSI'] = df['RSI'].fillna(50) # Neutral default
    
    # Calculate MACD
    ema_12 = df['Close'].ewm(span=12, adjust=False, min_periods=1).mean()
    ema_26 = df['Close'].ewm(span=26, adjust=False, min_periods=1).mean()
    df['MACD'] = ema_12 - ema_26
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False, min_periods=1).mean()
    df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']
    
    # Calculate Bollinger Bands (20 period, 2 std dev)
    std_20 = df['Close'].rolling(window=20, min_periods=1).std()
    std_20 = std_20.fillna(0)
    df['BB_Upper'] = df['SMA_20'] + (std_20 * 2)
    df['BB_Lower'] = df['SMA_20'] - (std_20 * 2)
    # BB Width represents volatility percentage
    df['BB_Width'] = np.where(df['SMA_20'] > 0, (df['BB_Upper'] - df['BB_Lower']) / df['SMA_20'], 0)
    
    # --- 6. ML Scaling Preparation ---
    # Standardize the OHLC and technical features using StandardScaler so it's perfectly prepared for KMeans/PCA later
    # We save these as scaled columns so original prices are preserved for charts
    try:
        # Failsafe: fill any lingering NaNs in technical indicators with 0 to prevent scaler crash
        features_to_scale = ['Open', 'High', 'Low', 'Close', 'RSI', 'MACD_Hist', 'BB_Width']
        df[features_to_scale] = df[features_to_scale].fillna(0)
        
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(df[features_to_scale])
        
        df['Open_Scaled'] = scaled_features[:, 0]
        df['High_Scaled'] = scaled_features[:, 1]
        df['Low_Scaled'] = scaled_features[:, 2]
        df['Close_Scaled'] = scaled_features[:, 3]
        df['RSI_Scaled'] = scaled_features[:, 4]
        df['MACD_Scaled'] = scaled_features[:, 5]
        df['BB_Width_Scaled'] = scaled_features[:, 6]
        
        logs.append("Applied StandardScaler normalization for ML models (including RSI, MACD, Volatility).")
    except Exception as e:
        logs.append(f"Warning: ML Scaling failed: {str(e)}")

    logs.append(f"Data pipeline complete. Output shape: {df.shape}")
    return df, logs
