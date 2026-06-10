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

def analyze_weekday_consistency(df: pd.DataFrame):
    """
    Groups the dataframe by (Year, ISO Week, Weekday) and calculates the price return
    for each weekday in each week. Then compares the performance of the same weekdays
    across multiple past weeks to determine buying/selling consistency.
    """
    consistency_stats = {}
    if 'Weekday' not in df.columns or 'Datetime' not in df.columns:
        return consistency_stats
        
    df_copy = df.copy()
    df_copy['Datetime'] = pd.to_datetime(df_copy['Datetime'])
    df_copy['Year'] = df_copy['Datetime'].dt.isocalendar().year
    df_copy['Week'] = df_copy['Datetime'].dt.isocalendar().week
    
    # Group by Year, Week, Weekday
    grouped = df_copy.groupby(['Year', 'Week', 'Weekday'])
    
    weekly_perf = []
    
    for (year, week, weekday), group in grouped:
        group = group.sort_values('Datetime')
        first_open = group.iloc[0]['Open']
        last_close = group.iloc[-1]['Close']
        
        # Calculate percentage return
        pct_return = ((last_close - first_open) / first_open * 100) if first_open > 0 else 0.0
        
        weekly_perf.append({
            "year": int(year),
            "week": int(week),
            "weekday": weekday,
            "date": group.iloc[0]['Date'],
            "return": round(pct_return, 4),
            "direction": "Bullish" if pct_return > 0.001 else ("Bearish" if pct_return < -0.001 else "Neutral")
        })
        
    # Group by weekday
    by_weekday = {}
    for perf in weekly_perf:
        w = perf['weekday']
        if w not in by_weekday:
            by_weekday[w] = []
        by_weekday[w].append(perf)
        
    # Sort each weekday's records by date
    for w in by_weekday:
        by_weekday[w] = sorted(by_weekday[w], key=lambda x: x['date'])
        
    # Calculate consistency metrics
    for w, records in by_weekday.items():
        total_weeks = len(records)
        if total_weeks == 0:
            continue
            
        bullish_weeks = sum(1 for r in records if r['return'] > 0.001)
        bearish_weeks = sum(1 for r in records if r['return'] < -0.001)
        neutral_weeks = total_weeks - bullish_weeks - bearish_weeks
        
        returns = [r['return'] for r in records]
        avg_return = sum(returns) / total_weeks
        
        # Standard deviation
        variance = sum((x - avg_return) ** 2 for x in returns) / total_weeks
        std_return = variance ** 0.5
        
        # Consistency score: percent of weeks matching dominant direction
        if bullish_weeks > bearish_weeks:
            dominant_direction = "Bullish"
            consistency_score = round((bullish_weeks / total_weeks) * 100, 2)
        elif bearish_weeks > bullish_weeks:
            dominant_direction = "Bearish"
            consistency_score = round((bearish_weeks / total_weeks) * 100, 2)
        else:
            dominant_direction = "Neutral"
            consistency_score = round((neutral_weeks / total_weeks) * 100, 2) if total_weeks > 0 else 0.0
            
        consistency_stats[w] = {
            "weekday": w,
            "total_weeks": total_weeks,
            "bullish_weeks": bullish_weeks,
            "bearish_weeks": bearish_weeks,
            "neutral_weeks": neutral_weeks,
            "bullish_weeks_ratio": round(bullish_weeks / total_weeks, 2),
            "bearish_weeks_ratio": round(bearish_weeks / total_weeks, 2),
            "avg_return": round(avg_return, 4),
            "std_return": round(std_return, 4),
            "consistency_score": consistency_score,
            "dominant_direction": dominant_direction,
            "weekly_performance": records
        }
        
    return consistency_stats

