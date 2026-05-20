import pandas as pd
from sklearn.cluster import KMeans
from .linear_algebra import create_vectors

def cluster_candles(df: pd.DataFrame, n_clusters=5):
    """
    Uses KMeans to cluster all candles into n_clusters based on their vector representation.
    """
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
            centroid_high = cluster_data['High'].mean()
            centroid_low = cluster_data['Low'].mean()
            
            body = abs(centroid_close - centroid_open)
            upper_wick = centroid_high - max(centroid_open, centroid_close)
            lower_wick = min(centroid_open, centroid_close) - centroid_low
            total_range = centroid_high - centroid_low if (centroid_high - centroid_low) > 0 else 1
            body_pct = body / (centroid_open if centroid_open > 0 else 1)
            is_bullish_centroid = centroid_close >= centroid_open
            
            if body_pct < 0.0003:
                # Dojis
                if upper_wick / total_range > 0.6:
                    pattern = "Gravestone Doji"
                elif lower_wick / total_range > 0.6:
                    pattern = "Dragonfly Doji"
                elif upper_wick / total_range > 0.2 and lower_wick / total_range > 0.2:
                    pattern = "Long-Legged Doji"
                else:
                    pattern = "Classic Doji / Neutral"
            elif body_pct < 0.002:
                # Spinning Tops & High Waves
                if upper_wick > body and lower_wick > body:
                    pattern = "High Wave Candle"
                else:
                    pattern = "Bullish Spinning Top" if is_bullish_centroid else "Bearish Spinning Top"
            elif body_pct < 0.01:
                # Short/Standard Candles
                if is_bullish_centroid:
                    if lower_wick / (body if body > 0 else 1) > 0.5 and upper_wick / (body if body > 0 else 1) < 0.1:
                        pattern = "Bullish Hammer"
                    elif upper_wick / (body if body > 0 else 1) > 0.5 and lower_wick / (body if body > 0 else 1) < 0.1:
                        pattern = "Inverted Hammer"
                    else:
                        pattern = "Short Bullish"
                else:
                    if upper_wick / (body if body > 0 else 1) > 0.5 and lower_wick / (body if body > 0 else 1) < 0.1:
                        pattern = "Shooting Star"
                    elif lower_wick / (body if body > 0 else 1) > 0.5 and upper_wick / (body if body > 0 else 1) < 0.1:
                        pattern = "Hanging Man"
                    else:
                        pattern = "Short Bearish"
            else:
                # Long/Marubozu Candles
                pattern = "Long Bullish (Marubozu)" if is_bullish_centroid else "Long Bearish (Marubozu)"
        else:
            pattern = "Empty"
            centroid_open, centroid_close, centroid_high, centroid_low = 0, 0, 0, 0
            
        cluster_summary.append({
            "cluster_id": i,
            "size": size,
            "centroid_open": round(centroid_open, 2),
            "centroid_close": round(centroid_close, 2),
            "centroid_high": round(centroid_high, 2),
            "centroid_low": round(centroid_low, 2),
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
        
        timeframe_stats.append({
            "time": time,
            "total": total,
            "bullish": bullish,
            "bearish": bearish,
            "neutral": neutral,
            "bullish_ratio": round(bullish / total, 2) if total > 0 else 0,
            "bearish_ratio": round(bearish / total, 2) if total > 0 else 0
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
        
        weekday_stats[weekday].append({
            "time": time,
            "total": total,
            "bullish": bullish,
            "bearish": bearish,
            "neutral": neutral,
            "bullish_ratio": round(bullish / total, 2) if total > 0 else 0,
            "bearish_ratio": round(bearish / total, 2) if total > 0 else 0
        })
        
    for weekday in weekday_stats:
        weekday_stats[weekday] = sorted(weekday_stats[weekday], key=lambda x: x['time'])
        
    return weekday_stats
