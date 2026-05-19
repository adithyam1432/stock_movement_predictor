import pandas as pd
import numpy as np

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Enriches the cleaned and transformed dataset with derived data mining features.
    Ensures compatibility with existing analytical pipelines.
    """
    enriched_df = df.copy()

    # 1. Base directional fields
    conditions = [
        (enriched_df['Close'] > enriched_df['Open']),
        (enriched_df['Close'] < enriched_df['Open'])
    ]
    choices = ['Bullish', 'Bearish']
    enriched_df['Candle_Type'] = np.select(conditions, choices, default='Neutral')
    
    # 2. Derived physical metrics
    enriched_df['Body_Size'] = abs(enriched_df['Close'] - enriched_df['Open'])
    enriched_df['Direction'] = np.where(enriched_df['Close'] >= enriched_df['Open'], 1, -1)
    
    # Required Update derived fields
    enriched_df['weekday'] = enriched_df['Weekday'] # Keep both variants to prevent downstream breakage
    enriched_df['candle_direction'] = np.select(conditions, [1, -1], default=0)
    
    # Upper & Lower wicks
    enriched_df['upper_wick'] = enriched_df['High'] - enriched_df[['Open', 'Close']].max(axis=1)
    enriched_df['lower_wick'] = enriched_df[['Open', 'Close']].min(axis=1) - enriched_df['Low']
    
    # Candle Strength (Ratio of body size to total range)
    total_range = enriched_df['High'] - enriched_df['Low']
    enriched_df['candle_strength'] = np.where(total_range > 0, enriched_df['Body_Size'] / (total_range + 1e-8), 0.0)
    
    # Flags
    enriched_df['bullish_flag'] = np.where(enriched_df['Candle_Type'] == 'Bullish', 1, 0)
    enriched_df['bearish_flag'] = np.where(enriched_df['Candle_Type'] == 'Bearish', 1, 0)
    
    # Timeframe Bucket
    enriched_df['timeframe_bucket'] = enriched_df['Time']

    return enriched_df
