def generate_insights(timeframe_stats, cluster_stats, weekday_stats=None, weekday_consistency=None):
    """
    Generates structured, categorized natural language insights based on the computed statistics.
    """
    insights = {
        "market_trend": [],
        "volatility_alerts": [],
        "actionable_patterns": []
    }
    
    # Analyze timeframes for Market Trend
    if timeframe_stats:
        sorted_bullish = sorted(timeframe_stats, key=lambda x: x['bullish_ratio'], reverse=True)
        sorted_bearish = sorted(timeframe_stats, key=lambda x: x['bearish_ratio'], reverse=True)
        
        most_bullish = sorted_bullish[0]
        if most_bullish['bullish_ratio'] > 0.55:
            insights["market_trend"].append(f"🟢 {most_bullish['time']} candles are {int(most_bullish['bullish_ratio']*100)}% Bullish globally.")
            
        most_bearish = sorted_bearish[0]
        if most_bearish['bearish_ratio'] > 0.55:
            insights["market_trend"].append(f"🔴 {most_bearish['time']} candles are {int(most_bearish['bearish_ratio']*100)}% Bearish globally.")
            
    # Weekday stats for volatility and action
    if weekday_stats:
        for weekday, stats in weekday_stats.items():
            sorted_w_bullish = sorted(stats, key=lambda x: x['bullish_ratio'], reverse=True)
            sorted_w_bearish = sorted(stats, key=lambda x: x['bearish_ratio'], reverse=True)
            
            if sorted_w_bullish and sorted_w_bullish[0]['bullish_ratio'] > 0.65:
                w_bullish = sorted_w_bullish[0]
                insights["actionable_patterns"].append(f"🟢 {weekday} @ {w_bullish['time']}: {int(w_bullish['bullish_ratio']*100)}% Bullish bias.")
                
            if sorted_w_bearish and sorted_w_bearish[0]['bearish_ratio'] > 0.65:
                w_bearish = sorted_w_bearish[0]
                insights["actionable_patterns"].append(f"🔴 {weekday} @ {w_bearish['time']}: {int(w_bearish['bearish_ratio']*100)}% Bearish bias.")
                
    # Weekday consistency insights
    if weekday_consistency:
        for weekday, stats in weekday_consistency.items():
            if stats['total_weeks'] >= 2 and stats['consistency_score'] >= 60 and stats['dominant_direction'] in ['Bullish', 'Bearish']:
                icon = "🟢" if stats['dominant_direction'] == 'Bullish' else "🔴"
                insights["actionable_patterns"].append(
                    f"{icon} {weekday} WoW: {stats['consistency_score']}% {stats['dominant_direction']} consistency over {stats['total_weeks']} weeks (Avg return: {stats['avg_return']:.2f}%)."
                )
                
    # Analyze clusters for Actionable Patterns & Volatility
    if cluster_stats:
        dominant_cluster = cluster_stats[0]
        insights["market_trend"].append(f"📊 Main structure: Cluster {dominant_cluster['cluster_id']} captures common '{dominant_cluster['pattern_type']}' candles.")
        
        reversal_clusters = [c for c in cluster_stats if c['pattern_type'] == 'Neutral / Doji']
        if reversal_clusters:
            insights["actionable_patterns"].append(f"⚠️ Reversal zone: Cluster {reversal_clusters[0]['cluster_id']} captures Neutral/Doji candles.")
            
        # Add basic volatility alert if high volatility clusters exist (assuming Marubozu represents high volatility)
        volatile_clusters = [c for c in cluster_stats if c['pattern_type'] == 'Marubozu']
        if volatile_clusters:
            insights["volatility_alerts"].append(f"⚡ High volatility: Cluster {volatile_clusters[0]['cluster_id']} captures Marubozu candles.")

            
    # Fallback
    if not any(insights.values()):
        insights["market_trend"].append("Market structure is highly balanced with no significant directional biases detected.")
        
    return insights

