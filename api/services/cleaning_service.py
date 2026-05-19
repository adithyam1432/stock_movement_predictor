import pandas as pd
import numpy as np

def clean_data(df: pd.DataFrame) -> tuple:
    """
    Cleans market data by resolving:
      - Column naming variations (Smart Column Detection)
      - Missing values & nulls (Intelligent Imputation)
      - Duplicate dates/times (Duplicate Removal)
      - Completely corrupted rows (Corrupt Filtering)
    
    Returns:
      (cleaned_df, cleaning_report)
    """
    # Create a copy to prevent mutation warnings
    cleaned_df = df.copy()
    
    # 1. Smart Column Detection & Mapping
    column_mappings = {
        'date': ['date', 'timestamp', 'datetime', 'dt', 'time_stamp', 'day'],
        'time': ['time', 'timestamp_time', 'hour_minute', 't'],
        'open': ['open', 'open_price', 'op', 'first_price', 'o'],
        'high': ['high', 'high_price', 'hi', 'max_price', 'h'],
        'low': ['low', 'low_price', 'lo', 'min_price', 'l'],
        'close': ['close', 'close_price', 'cl', 'last_price', 'c'],
        'volume': ['volume', 'vol', 'qty', 'volume_traded', 'v']
    }
    
    mapped_columns = {}
    original_cols = [c.strip() for c in cleaned_df.columns]
    cleaned_df.columns = original_cols  # Strip spacing
    
    # Run matching
    for target_col, variations in column_mappings.items():
        found = False
        for col in original_cols:
            if col.lower() in variations:
                mapped_columns[col] = target_col.title()
                found = True
                break
        # Fallback to standard capitalized match if not in variations but matches by suffix
        if not found:
            for col in original_cols:
                if col.lower().endswith(target_col):
                    mapped_columns[col] = target_col.title()
                    break

    cleaned_df = cleaned_df.rename(columns=mapped_columns)
    
    # Report variables
    report = {
        "auto_fixed_summary": [],
        "missing_value_report": {},
        "corrected_rows": 0,
        "duplicates_removed": 0,
        "corrupted_removed": 0
    }
    
    # Track smart mapping actions
    mapped_names_log = [f"Mapped '{k}' to '{v}'" for k, v in mapped_columns.items() if k != v]
    if mapped_names_log:
        report["auto_fixed_summary"].extend(mapped_names_log)

    # 2. Check for completely corrupted rows (where Date, Time, Open, Close are all missing)
    required_cols = [c for c in ['Date', 'Time', 'Open', 'Close'] if c in cleaned_df.columns]
    if required_cols:
        all_null_mask = cleaned_df[required_cols].isna().all(axis=1)
        corrupted_count = all_null_mask.sum()
        if corrupted_count > 0:
            cleaned_df = cleaned_df[~all_null_mask].reset_index(drop=True)
            report["corrupted_removed"] += int(corrupted_count)
            report["auto_fixed_summary"].append(f"Removed {corrupted_count} completely empty or unparseable rows.")

    # 3. Numeric Conversions
    numeric_cols = ['Open', 'High', 'Low', 'Close', 'Volume']
    for col in numeric_cols:
        if col in cleaned_df.columns:
            # Count current nulls
            initial_nulls = cleaned_df[col].isna().sum()
            cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors='coerce')
            after_coerce_nulls = cleaned_df[col].isna().sum()
            
            # Track any parsing failures
            new_failures = after_coerce_nulls - initial_nulls
            if new_failures > 0:
                report["auto_fixed_summary"].append(f"Normalized {new_failures} string values to floats in '{col}' column.")
            
            report["missing_value_report"][col] = int(after_coerce_nulls)

    # 4. Drop Rows with Completely Missing Timestamps (Date or Time)
    if 'Date' in cleaned_df.columns:
        date_nulls = cleaned_df['Date'].isna().sum()
        if date_nulls > 0:
            cleaned_df = cleaned_df.dropna(subset=['Date']).reset_index(drop=True)
            report["corrupted_removed"] += int(date_nulls)
            report["auto_fixed_summary"].append(f"Dropped {date_nulls} rows missing a Date value.")

    if 'Time' in cleaned_df.columns:
        time_nulls = cleaned_df['Time'].isna().sum()
        if time_nulls > 0:
            cleaned_df = cleaned_df.dropna(subset=['Time']).reset_index(drop=True)
            report["corrupted_removed"] += int(time_nulls)
            report["auto_fixed_summary"].append(f"Dropped {time_nulls} rows missing a Time value.")

    # 5. Intelligent Imputation (Null Value Handling)
    corrected_flag = np.zeros(len(cleaned_df), dtype=bool)

    # Missing Open Imputation
    if 'Open' in cleaned_df.columns:
        open_nulls = cleaned_df['Open'].isna()
        if open_nulls.any():
            # Apply previous close or backward fill, then fallback to 0
            if 'Close' in cleaned_df.columns:
                # Use shift(1) from Close
                shifted_close = cleaned_df['Close'].shift(1)
                cleaned_df['Open'] = cleaned_df['Open'].fillna(shifted_close)
            
            cleaned_df['Open'] = cleaned_df['Open'].ffill().bfill().fillna(0.0)
            corrected_flag |= open_nulls
            report["auto_fixed_summary"].append(f"Auto-corrected {open_nulls.sum()} missing Open values using forward close values.")

    # Missing Close Imputation
    if 'Close' in cleaned_df.columns:
        close_nulls = cleaned_df['Close'].isna()
        if close_nulls.any():
            if 'Open' in cleaned_df.columns:
                cleaned_df['Close'] = cleaned_df['Close'].fillna(cleaned_df['Open'])
            cleaned_df['Close'] = cleaned_df['Close'].ffill().bfill().fillna(0.0)
            corrected_flag |= close_nulls
            report["auto_fixed_summary"].append(f"Auto-corrected {close_nulls.sum()} missing Close values using Open values.")

    # High Imputation
    if 'High' in cleaned_df.columns:
        high_nulls = cleaned_df['High'].isna()
        if high_nulls.any():
            # If missing, use max(Open, Close)
            max_body = cleaned_df[['Open', 'Close']].max(axis=1) if ('Open' in cleaned_df.columns and 'Close' in cleaned_df.columns) else 0.0
            cleaned_df['High'] = cleaned_df['High'].fillna(max_body)
            cleaned_df['High'] = cleaned_df['High'].ffill().bfill().fillna(0.0)
            corrected_flag |= high_nulls
            report["auto_fixed_summary"].append(f"Auto-imputed {high_nulls.sum()} missing High values using max(Open, Close).")

    # Low Imputation
    if 'Low' in cleaned_df.columns:
        low_nulls = cleaned_df['Low'].isna()
        if low_nulls.any():
            # If missing, use min(Open, Close)
            min_body = cleaned_df[['Open', 'Close']].min(axis=1) if ('Open' in cleaned_df.columns and 'Close' in cleaned_df.columns) else 0.0
            cleaned_df['Low'] = cleaned_df['Low'].fillna(min_body)
            cleaned_df['Low'] = cleaned_df['Low'].ffill().bfill().fillna(0.0)
            corrected_flag |= low_nulls
            report["auto_fixed_summary"].append(f"Auto-imputed {low_nulls.sum()} missing Low values using min(Open, Close).")

    # Volume Imputation
    if 'Volume' in cleaned_df.columns:
        vol_nulls = cleaned_df['Volume'].isna() | (cleaned_df['Volume'] < 0)
        if vol_nulls.any():
            cleaned_df['Volume'] = cleaned_df['Volume'].fillna(0.0)
            cleaned_df.loc[cleaned_df['Volume'] < 0, 'Volume'] = 0.0
            corrected_flag |= vol_nulls
            report["auto_fixed_summary"].append(f"Reset {vol_nulls.sum()} null or negative Volume entries to 0.")
    else:
        # Create it if it doesn't exist
        cleaned_df['Volume'] = 0.0

    # 6. Correct High/Low boundary breaches (High must be >= Open/Close, Low must be <= Open/Close)
    if 'High' in cleaned_df.columns and 'Open' in cleaned_df.columns and 'Close' in cleaned_df.columns:
        max_oc = cleaned_df[['Open', 'Close']].max(axis=1)
        breached_highs = cleaned_df['High'] < max_oc
        if breached_highs.any():
            cleaned_df.loc[breached_highs, 'High'] = max_oc[breached_highs]
            corrected_flag |= breached_highs
            report["auto_fixed_summary"].append(f"Adjusted {breached_highs.sum()} High values that were below Open/Close.")

    if 'Low' in cleaned_df.columns and 'Open' in cleaned_df.columns and 'Close' in cleaned_df.columns:
        min_oc = cleaned_df[['Open', 'Close']].min(axis=1)
        breached_lows = cleaned_df['Low'] > min_oc
        if breached_lows.any():
            cleaned_df.loc[breached_lows, 'Low'] = min_oc[breached_lows]
            corrected_flag |= breached_lows
            report["auto_fixed_summary"].append(f"Adjusted {breached_lows.sum()} Low values that were above Open/Close.")

    report["corrected_rows"] = int(corrected_flag.sum())

    # 7. Drop Duplicate Timestamps
    if 'Date' in cleaned_df.columns and 'Time' in cleaned_df.columns:
        # Construct unique key for duplicate check
        dup_keys = cleaned_df['Date'].astype(str) + ' ' + cleaned_df['Time'].astype(str)
        initial_count = len(cleaned_df)
        cleaned_df = cleaned_df.loc[~dup_keys.duplicated(keep='first')].reset_index(drop=True)
        dropped_dups = initial_count - len(cleaned_df)
        if dropped_dups > 0:
            report["duplicates_removed"] = int(dropped_dups)
            report["auto_fixed_summary"].append(f"Dropped {dropped_dups} duplicate timestamp entries.")

    return cleaned_df, report
