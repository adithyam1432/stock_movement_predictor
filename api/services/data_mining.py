import pandas as pd
from sklearn.cluster import KMeans
from .linear_algebra import create_vectors

def cluster_candles(df: pd.DataFrame, n_clusters=5):
    """
    Uses KMeans to cluster all candles into n_clusters based on their vector representation.
    """
    if len(df) < n_clusters:
        n_clusters = max(1, len(df))
        
    vectors = create_vectors(df)
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(vectors)
    
    df['Cluster'] = clusters
    
    # Calculate cluster centroids directly from raw values for interpretability
    cluster_summary = []
    for i in range(n_clusters):
        cluster_data = df[df['Cluster'] == i]
        size = len(cluster_data)
        
        # Determine primary pattern type for this cluster
        if size > 0:
            centroid_open = cluster_data['Open'].mean()
            centroid_close = cluster_data['Close'].mean()
            
            body_pct = abs(centroid_close - centroid_open) / (centroid_open if centroid_open > 0 else 1)
            is_bullish_centroid = centroid_close >= centroid_open
            
            if body_pct < 0.0002:
                pattern = "Classic Doji / Neutral"
            elif body_pct < 0.001:
                pattern = "Bullish Spinning Top" if is_bullish_centroid else "Bearish Spinning Top"
            elif body_pct < 0.01:
                pattern = "Short Bullish" if is_bullish_centroid else "Short Bearish"
            else:
                pattern = "Long Bullish (Marubozu)" if is_bullish_centroid else "Long Bearish (Marubozu)"
        else:
            pattern = "Empty"
            centroid_open, centroid_close = 0, 0
            
        cluster_summary.append({
            "cluster_id": i,
            "size": size,
            "centroid_open": round(centroid_open, 2),
            "centroid_close": round(centroid_close, 2),
            "pattern_type": pattern
        })
        
    # Sort clusters by size
    cluster_summary.sort(key=lambda x: x['size'], reverse=True)
    return cluster_summary, df['Cluster'].tolist()

def analyze_timeframes(df: pd.DataFrame):
    """
    Calculates bullish/bearish/neutral frequencies for each timeframe.
    """
    timeframe_stats = []
    
    grouped = df.groupby('Time')
    for time, group in grouped:
        total = len(group)
        bullish = len(group[group['Candle_Type'] == 'Bullish'])
        bearish = len(group[group['Candle_Type'] == 'Bearish'])
        neutral = len(group[group['Candle_Type'] == 'Neutral'])
        
        vol_std = group['Body_Size'].std() if total > 1 else 0.0
        if pd.isna(vol_std):
            vol_std = 0.0
        
        timeframe_stats.append({
            "time": time,
            "total": total,
            "bullish": bullish,
            "bearish": bearish,
            "neutral": neutral,
            "bullish_ratio": round(bullish / total, 2) if total > 0 else 0,
            "bearish_ratio": round(bearish / total, 2) if total > 0 else 0,
            "volatility_std": round(vol_std, 4)
        })
        
    return timeframe_stats

def analyze_weekday_dominance(df: pd.DataFrame):
    """
    Calculates bullish/bearish/neutral frequencies grouped by Weekday and Time.
    Returns a dictionary mapping weekday to its timeframe statistics.
    """
    weekday_stats = {}
    if 'Weekday' not in df.columns:
        return weekday_stats
        
    grouped = df.groupby(['Weekday', 'Time'])
    
    for (weekday, time), group in grouped:
        if weekday not in weekday_stats:
            weekday_stats[weekday] = []
            
        total = len(group)
        bullish = len(group[group['Candle_Type'] == 'Bullish'])
        bearish = len(group[group['Candle_Type'] == 'Bearish'])
        neutral = len(group[group['Candle_Type'] == 'Neutral'])
        
        vol_std = group['Body_Size'].std() if total > 1 else 0.0
        if pd.isna(vol_std):
            vol_std = 0.0
        
        weekday_stats[weekday].append({
            "time": time,
            "total": total,
            "bullish": bullish,
            "bearish": bearish,
            "neutral": neutral,
            "bullish_ratio": round(bullish / total, 2) if total > 0 else 0,
            "bearish_ratio": round(bearish / total, 2) if total > 0 else 0,
            "volatility_std": round(vol_std, 4)
        })
        
    for weekday in weekday_stats:
        weekday_stats[weekday] = sorted(weekday_stats[weekday], key=lambda x: x['time'])
        
    return weekday_stats
