from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class CandleRecord(Base):
    __tablename__ = "candles"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    time = Column(String, index=True)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float, nullable=True)
    candle_type = Column(String) # Bullish, Bearish, Neutral
    body_size = Column(Float)
