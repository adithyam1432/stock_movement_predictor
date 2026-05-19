import pandas as pd
import numpy as np

def validate_data(df: pd.DataFrame, expected_timeframe: str) -> dict:
    """
    Validates the structure, types, and values of the parsed market dataset.
    Returns a report detailing issues found, error counts, and timeframe status.
    """
    report = {
        "valid": True,
        "errors": [],
        "warnings": [],
        "timeframe_check": "passed",
        "total_rows": len(df)
    }

    # 1. Required Columns Check
    required = {'Date', 'Time', 'Open', 'High', 'Low', 'Close'}
    missing = required - set(df.columns)
    if missing:
        report["valid"] = False
        report["errors"].append(f"Missing critical columns: {list(missing)}")
        return report

    # 2. Check Data Types & Numerical Health
    null_opens = df['Open'].isna().sum()
    null_closes = df['Close'].isna().sum()
    null_highs = df['High'].isna().sum()
    null_lows = df['Low'].isna().sum()

    if null_opens > 0:
        report["warnings"].append(f"Detected {null_opens} unparseable or empty Open prices.")
    if null_closes > 0:
        report["warnings"].append(f"Detected {null_closes} unparseable or empty Close prices.")
    if null_highs > 0:
        report["warnings"].append(f"Detected {null_highs} unparseable or empty High prices.")
    if null_lows > 0:
        report["warnings"].append(f"Detected {null_lows} unparseable or empty Low prices.")

    # 3. Check for high/low anomalies (e.g. low higher than high, low higher than open/close)
    if not df.empty:
        anomalous_highs = (df['High'] < df['Open']) | (df['High'] < df['Close'])
        anomalous_lows = (df['Low'] > df['Open']) | (df['Low'] > df['Close'])
        
        highs_count = anomalous_highs.sum()
        lows_count = anomalous_lows.sum()

        if highs_count > 0:
            report["warnings"].append(f"Found {highs_count} rows where High is lower than Open/Close.")
        if lows_count > 0:
            report["warnings"].append(f"Found {lows_count} rows where Low is higher than Open/Close.")

    # 4. Timeframe Check
    if 'Datetime' in df.columns and len(df) > 1:
        time_diffs = df['Datetime'].diff().dt.total_seconds() / 60.0
        non_null_diffs = time_diffs.dropna()
        if len(non_null_diffs) > 0:
            mode_diff = int(non_null_diffs.mode()[0])
            
            # Map expected timeframe string to minutes
            expected_minutes = 0
            et_lower = expected_timeframe.lower()
            if 'h' in et_lower:
                expected_minutes = int(et_lower.replace('h', '')) * 60
            else:
                expected_minutes = int(et_lower.replace('m', ''))
                
            if mode_diff != expected_minutes:
                report["timeframe_check"] = "mismatch"
                report["warnings"].append(f"Timeframe mismatch: Expected {expected_timeframe} ({expected_minutes}m), but detected interval is {mode_diff}m.")
                # We do not mark as invalid so the cleaning engine can still auto-correct or proceed safely if user allows

    return report
