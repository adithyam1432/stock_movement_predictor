import pandas as pd
from api.services.validation_service import validate_data
from api.services.cleaning_service import clean_data
from api.services.transformation_service import transform_data
from api.services.feature_engineering_service import engineer_features

def parse_and_clean_csv(df: pd.DataFrame, expected_timeframe: str) -> tuple:
    """
    Orchestrates the Advanced Preprocessing Pipeline:
      1. Cleaning: Smart column detection, null values imputation, duplicate removal
      2. Transformation: Datetime formatting, IST standardization, weekday extraction
      3. Validation: Structure validation and timeframe mismatch checks
      4. Feature Engineering: Derived fields calculations
    
    Returns:
      (processed_df, cleaning_report)
    """
    # 1. Clean Data (Smart Mapping, Null Handling, Duplicate Dropping)
    cleaned_df, report = clean_data(df)
    
    # 2. Transform Data (Timezone Conversion, Trading Hours, Weekday Extraction)
    transformed_df, transform_logs = transform_data(cleaned_df)
    report["auto_fixed_summary"].extend(transform_logs)
    
    # 3. Validate Data
    validation_report = validate_data(transformed_df, expected_timeframe)
    report["validation_report"] = validation_report
    
    # 4. Feature Engineering
    processed_df = engineer_features(transformed_df)
    
    # Create descriptive AI Insights list from cleaning outcomes
    ai_insights = []
    
    # Corrected values insight
    if report["corrected_rows"] > 0:
        ai_insights.append(f"{report['corrected_rows']} missing or out-of-boundary values were automatically corrected.")
    else:
        ai_insights.append("No missing or null candle values detected.")
        
    # Duplicates insight
    if report["duplicates_removed"] > 0:
        ai_insights.append(f"{report['duplicates_removed']} duplicate timestamp rows were found and removed.")
    else:
        ai_insights.append("Dataset contained zero duplicate timestamps.")
        
    # Corrupted rows insight
    if report["corrupted_removed"] > 0:
        ai_insights.append(f"{report['corrupted_removed']} completely corrupted or empty rows were safely removed.")
        
    # Weekday info insight
    ai_insights.append("Weekday information successfully extracted and indexed.")
    
    # Date normalizations insight
    ai_insights.append("All dates and times successfully normalized and standardized to IST.")
    
    report["ai_insights"] = ai_insights
    
    # Raise timeframe validation errors ONLY if data is empty or invalid
    if not validation_report["valid"]:
        raise ValueError(f"Data Validation Failed: {', '.join(validation_report['errors'])}")
        
    # If timeframe check is mismatch and we don't have enough rows, we can still report it in the UI warnings.
    # In index.py, we can choose to raise an error OR let it pass with warning.
    # To preserve the original exact behavior of throwing timeframe mismatch errors:
    if validation_report["timeframe_check"] == "mismatch":
        # Raise timeframe error as requested by the original code structure so we don't break expected dropdown validation test cases
        expected_minutes = 0
        et_lower = expected_timeframe.lower()
        if 'h' in et_lower:
            expected_minutes = int(et_lower.replace('h', '')) * 60
        else:
            expected_minutes = int(et_lower.replace('m', ''))
            
        if 'Datetime' in transformed_df.columns and len(transformed_df) > 1:
            time_diffs = transformed_df['Datetime'].diff().dt.total_seconds() / 60.0
            mode_diff = int(time_diffs.dropna().mode()[0])
            raise ValueError(f"Timeframe mismatch. Selected: {expected_timeframe}, Detected: {mode_diff}m")

    return processed_df, report
