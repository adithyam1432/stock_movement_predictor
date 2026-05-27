import yfinance as yf
import pandas as pd
from datetime import datetime
import pytz

def fetch_nse_data(symbol: str, start_date: str, end_date: str, interval: str) -> pd.DataFrame:
    """
    Fetches historical OHLCV data from Yahoo Finance for NSE stocks and indices.
    Automatically appends '.NS' if the symbol doesn't have it and isn't a special index format.
    """
    
    # Pre-process symbol for NSE formatting
    # ^NSEI, ^NSEBANK etc. are already formatted. 
    # Normal stocks like RELIANCE need .NS
    formatted_symbol = symbol.upper().strip()
    if not formatted_symbol.startswith("^") and not formatted_symbol.endswith(".NS"):
        formatted_symbol = f"{formatted_symbol}.NS"
        
    try:
        # Fetch data
        ticker = yf.Ticker(formatted_symbol)
        
        # We add 1 day to end_date because yfinance end_date is exclusive
        end_dt = pd.to_datetime(end_date) + pd.Timedelta(days=1)
        
        df = ticker.history(
            start=start_date,
            end=end_dt.strftime('%Y-%m-%d'),
            interval=interval
        )
        
        if df.empty:
            raise ValueError(f"No data found for symbol {formatted_symbol} between {start_date} and {end_date}")
            
        # Reset index to make Datetime a column
        df = df.reset_index()
        
        # Rename columns to match our expected format
        if 'Datetime' in df.columns:
            date_col = 'Datetime'
        elif 'Date' in df.columns:
            date_col = 'Date'
        else:
            raise ValueError("Expected Datetime or Date column in fetched data")
            
        # Standardize the timezone to Asia/Kolkata (IST)
        ist_tz = pytz.timezone('Asia/Kolkata')
        
        def normalize_to_ist(dt):
            if pd.isna(dt):
                return dt
            if dt.tzinfo is None:
                return ist_tz.localize(dt)
            else:
                return dt.astimezone(ist_tz)
                
        df[date_col] = df[date_col].apply(normalize_to_ist)
        df['Datetime'] = df[date_col].dt.tz_localize(None) # Make naive
        
        # Create separate Date and Time columns to match old CSV parser requirements
        df['Date'] = df['Datetime'].dt.strftime('%Y-%m-%d')
        df['Time'] = df['Datetime'].dt.strftime('%H:%M')
        
        # Select and order required columns
        columns = ['Datetime', 'Date', 'Time', 'Open', 'High', 'Low', 'Close', 'Volume']
        
        # Keep only columns that exist (some very old data might not have Volume)
        existing_cols = [col for col in columns if col in df.columns]
        
        df = df[existing_cols]
        
        return df
        
    except Exception as e:
        raise ValueError(f"Failed to fetch market data: {str(e)}")

def search_symbols(query: str, symbols_db: list) -> list:
    """
    Simple backend fallback search for symbols if needed.
    """
    query = query.lower()
    results = []
    for s in symbols_db:
        if query in s['name'].lower() or query in s['symbol'].lower():
            results.append(s)
            
    return results[:10] # Return top 10 matches
