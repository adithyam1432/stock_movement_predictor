import pandas as pd
import datetime
import pytz

def transform_data(df: pd.DataFrame) -> tuple:
    """
    Standardizes timestamps, converts dates/times to IST, filters out non-trading hours,
    and extracts standard weekdays.
    
    Returns:
      (transformed_df, transform_logs)
    """
    transformed_df = df.copy()
    logs = []

    # 1. Parse Datetime Column
    try:
        # Combine Date and Time
        combined_strings = transformed_df['Date'].astype(str) + ' ' + transformed_df['Time'].astype(str)
        
        # Auto-parse with mixed formats
        transformed_df['Datetime'] = pd.to_datetime(combined_strings, errors='coerce')
        
        # If any fail to combine, try parsing Date alone and add time
        failed_mask = transformed_df['Datetime'].isna()
        if failed_mask.any():
            transformed_df.loc[failed_mask, 'Datetime'] = pd.to_datetime(transformed_df.loc[failed_mask, 'Date'].astype(str), errors='coerce')
            
        # Drop rows where Datetime could not be parsed
        unparseable = transformed_df['Datetime'].isna().sum()
        if unparseable > 0:
            transformed_df = transformed_df.dropna(subset=['Datetime']).reset_index(drop=True)
            logs.append(f"Dropped {unparseable} rows due to unparseable date/time combinations.")
            
    except Exception as e:
        raise ValueError(f"Could not normalize Date and Time formats: {str(e)}")

    # 2. Timezone Standardization (IST)
    # We want to convert/localize all timestamps to Asia/Kolkata (IST)
    ist_tz = pytz.timezone('Asia/Kolkata')
    
    def normalize_to_ist(dt):
        if pd.isna(dt):
            return dt
        # If timezone info is naive, localize it to IST. If aware, convert to IST
        if dt.tzinfo is None:
            return ist_tz.localize(dt)
        else:
            return dt.astimezone(ist_tz)

    try:
        transformed_df['Datetime'] = transformed_df['Datetime'].apply(normalize_to_ist)
        # Drop timezone info after mapping to keep DataFrame datetime operations naive and easy to handle
        transformed_df['Datetime'] = transformed_df['Datetime'].dt.tz_localize(None)
        logs.append("Normalized all date/time formats and localized to IST (Indian Standard Time).")
    except Exception as e:
        # Fallback to simple conversion if timezone libraries error
        transformed_df['Datetime'] = transformed_df['Datetime'].dt.tz_localize(None)
        logs.append("Normalized date/time formats to standard naive timestamps.")

    # Sort by Datetime to ensure chronological sequence
    transformed_df = transformed_df.sort_values('Datetime').reset_index(drop=True)

    # 3. Weekday Extraction (Monday to Friday)
    transformed_df['Weekday'] = transformed_df['Datetime'].dt.day_name()
    
    # Filter only trading days (Mon-Fri)
    weekend_mask = transformed_df['Weekday'].isin(['Saturday', 'Sunday'])
    weekend_count = weekend_mask.sum()
    if weekend_count > 0:
        transformed_df = transformed_df[~weekend_mask].reset_index(drop=True)
        logs.append(f"Filtered out {weekend_count} weekend (Saturday/Sunday) records.")

    # 4. Indian session filtering (09:15 -> 15:30 IST)
    start_time = datetime.time(9, 15)
    end_time = datetime.time(15, 30)
    
    initial_count = len(transformed_df)
    transformed_df = transformed_df[(transformed_df['Datetime'].dt.time >= start_time) & (transformed_df['Datetime'].dt.time <= end_time)]
    filtered_out = initial_count - len(transformed_df)
    if filtered_out > 0:
        logs.append(f"Enforced IST market hours: filtered out {filtered_out} off-session records.")

    # Standardize primary columns back to formatted strings
    transformed_df['Date'] = transformed_df['Datetime'].dt.strftime('%Y-%m-%d')
    transformed_df['Time'] = transformed_df['Datetime'].dt.strftime('%H:%M')

    return transformed_df, logs
