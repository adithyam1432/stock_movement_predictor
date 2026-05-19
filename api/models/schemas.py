from pydantic import BaseModel
from typing import List, Optional

class CandleData(BaseModel):
    date: str
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: Optional[float] = None
    
class AnalysisResponse(BaseModel):
    status: str
    message: str
    bullish_count: int
    bearish_count: int
    neutral_count: int
    total_candles: int

class ClusterData(BaseModel):
    cluster_id: int
    size: int
    centroid_open: float
    centroid_close: float
    pattern_type: str

class PatternClustersResponse(BaseModel):
    status: str
    clusters: List[ClusterData]
