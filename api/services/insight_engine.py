def generate_insights(timeframe_stats, cluster_stats, weekday_stats=None):
    """
    Generates natural language insights based on the computed statistics.
    """
    insights = []
    
    # Analyze timeframes
    if timeframe_stats:
        # Find most bullish and bearish timeframes
        sorted_bullish = sorted(timeframe_stats, key=lambda x: x['bullish_ratio'], reverse=True)
        sorted_bearish = sorted(timeframe_stats, key=lambda x: x['bearish_ratio'], reverse=True)
        
        most_bullish = sorted_bullish[0]
        if most_bullish['bullish_ratio'] > 0.55:
            insights.append(f"Globally, {most_bullish['time']} candles are historically bullish {int(most_bullish['bullish_ratio']*100)}% of the time.")
            
        most_bearish = sorted_bearish[0]
        if most_bearish['bearish_ratio'] > 0.55:
            insights.append(f"Globally, the {most_bearish['time']} timeframe shows strong bearish dominance ({int(most_bearish['bearish_ratio']*100)}% bearish).")
            
    if weekday_stats:
        for weekday, stats in weekday_stats.items():
            sorted_w_bullish = sorted(stats, key=lambda x: x['bullish_ratio'], reverse=True)
            sorted_w_bearish = sorted(stats, key=lambda x: x['bearish_ratio'], reverse=True)
            
            if sorted_w_bullish and sorted_w_bullish[0]['bullish_ratio'] > 0.65:
                w_bullish = sorted_w_bullish[0]
                insights.append(f"On {weekday}s, {w_bullish['time']} candles are exceptionally bullish ({int(w_bullish['bullish_ratio']*100)}%).")
                
            if sorted_w_bearish and sorted_w_bearish[0]['bearish_ratio'] > 0.65:
                w_bearish = sorted_w_bearish[0]
                insights.append(f"{weekday} {w_bearish['time']} frequently drops into bearish dominance ({int(w_bearish['bearish_ratio']*100)}%).")
                
    # Analyze clusters
    if cluster_stats:
        dominant_cluster = cluster_stats[0]
        insights.append(f"Cluster {dominant_cluster['cluster_id']} contains the most common market structure, representing '{dominant_cluster['pattern_type']}' candles.")
        
        reversal_clusters = [c for c in cluster_stats if c['pattern_type'] == 'Neutral / Doji']
        if reversal_clusters:
            insights.append(f"Cluster {reversal_clusters[0]['cluster_id']} predominantly captures neutral/Doji candles, indicating potential reversal zones.")
            
    if not insights:
        insights.append("Market structure is highly balanced with no significant directional biases detected.")
        
    return insights
