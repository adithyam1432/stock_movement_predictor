import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_sample_data(days=200):
    start_date = datetime(2023, 1, 1)
    
    # 15 min intervals from 9:15 to 15:30
    times = []
    current_time = datetime.strptime("09:15", "%H:%M")
    end_time = datetime.strptime("15:30", "%H:%M")
    
    while current_time <= end_time:
        times.append(current_time.strftime("%H:%M"))
        current_time += timedelta(minutes=15)
        
    data = []
    base_price = 10000.0
    
    for day in range(days):
        current_date = (start_date + timedelta(days=day)).strftime("%Y-%m-%d")
        
        # skip weekends
        if (start_date + timedelta(days=day)).weekday() >= 5:
            continue
            
        daily_price = base_price + np.random.normal(0, 50)
        
        for t in times:
            # Introduce some artificial bias for clustering
            # 9:15 usually bullish
            if t == "09:15":
                bias = 10
            # 14:30 usually bearish
            elif t == "14:30":
                bias = -15
            else:
                bias = np.random.normal(0, 5)
                
            open_price = daily_price
            close_price = open_price + bias + np.random.normal(0, 10)
            high_price = max(open_price, close_price) + abs(np.random.normal(0, 5))
            low_price = min(open_price, close_price) - abs(np.random.normal(0, 5))
            
            data.append({
                "Date": current_date,
                "Time": t,
                "Open": round(open_price, 2),
                "High": round(high_price, 2),
                "Low": round(low_price, 2),
                "Close": round(close_price, 2),
                "Volume": int(np.random.uniform(1000, 50000))
            })
            
            daily_price = close_price # Next open is previous close roughly
            
        base_price = daily_price # carry over to next day
        
    df = pd.DataFrame(data)
    df.to_csv("sample_data.csv", index=False)
    print(f"Generated {len(df)} rows of data in sample_data.csv")

if __name__ == "__main__":
    generate_sample_data()
