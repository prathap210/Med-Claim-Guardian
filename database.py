"""
Database Models for RCM Denial Prediction System
Stores users, predictions, favorites, and audit logs
"""

from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
import logging
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Database setup
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "med-claim")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = quote_plus(os.getenv("DB_PASSWORD", ""))

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create engine with connection pooling for better resource management
engine = create_engine(
    DATABASE_URL,
    pool_size=10,           # Number of connections to keep in pool
    max_overflow=20,        # Additional connections beyond pool_size
    pool_recycle=3600,      # Recycle connections after 1 hour to avoid timeout issues
    pool_pre_ping=True,     # Test connections before using them
    echo=False
)
logger.info("Database connection pool configured with pooling enabled")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============================================================
# USER MODEL
# ============================================================
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    username = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    full_name = Column(String(150))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

# ============================================================
# PREDICTION HISTORY MODEL
# ============================================================
class PredictionHistory(Base):
    __tablename__ = "prediction_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Input data
    patient_age = Column(Integer)
    insurance_type = Column(String(100))
    procedure_code = Column(String(50))
    diagnosis_code = Column(String(50))
    provider_type = Column(String(100))
    claim_amount = Column(Float)
    prior_authorization = Column(String(10))
    documentation_complete = Column(String(10))
    coding_accuracy_score = Column(Float)
    claim_submission_delay_days = Column(Integer)
    payer = Column(String(150))
    
    # Prediction output
    denial_probability = Column(Float)
    risk_level = Column(String(20))
    confidence_score = Column(Float)
    suggested_action = Column(String(500))
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    is_favorite = Column(Boolean, default=False)
    notes = Column(String(1000), nullable=True)

# ============================================================
# FAVORITES MODEL
# ============================================================
class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    prediction_id = Column(Integer, ForeignKey("prediction_history.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

# ============================================================
# AUDIT LOG MODEL
# ============================================================
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50))  # 'LOGIN', 'PREDICTION', 'FAVORITE_ADD', 'FAVORITE_REMOVE', etc.
    details = Column(String(500))
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# ============================================================
# PERFORMANCE METRICS MODEL
# ============================================================
class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    total_predictions = Column(Integer, default=0)
    avg_processing_time = Column(Float, default=0)  # ms
    model_accuracy = Column(Float, default=72.2)
    system_uptime_percent = Column(Float, default=100)
    active_users = Column(Integer, default=0)

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
