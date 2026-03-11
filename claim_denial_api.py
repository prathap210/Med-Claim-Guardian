from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os
import tempfile
import shutil
import logging
from typing import Literal, List, Dict, Any, Optional
import warnings
import socket
from datetime import datetime
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from cachetools import TTLCache
import threading

load_dotenv()
warnings.filterwarnings('ignore')

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Cache configuration
analytics_cache: Dict[str, Any] = {}
analytics_cache_lock = threading.Lock()
ANALYTICS_CACHE_TTL = 300  # 5 minutes in seconds

# Database
from database import SessionLocal, Base, engine, PredictionHistory
Base.metadata.create_all(bind=engine)
logger.info("SQLite database ready")

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Admin API key for protected endpoints (optional, defaults to "dev-key" for testing)
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "dev-key-12345")
logger.info(f"Admin API key configured: {'custom' if os.getenv('ADMIN_API_KEY') else 'default'}")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def require_admin_key(key: str = Depends(api_key_header)):
    if key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")

# Optional: SHAP for model explainability
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

# Initialize FastAPI app
app = FastAPI(
    title="Claim Denial Prediction API",
    description="Predicts the probability of healthcare insurance claim denial",
    version="1.0.0"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware - restrict based on environment
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    # Production: Only allow specified frontend URL
    allowed_origins = [FRONTEND_URL]
else:
    # Development: Allow localhost on multiple ports
    allowed_origins = [
        FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Get base directory before using it
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Import and include OAuth routes
try:
    from oauth_routes import router as oauth_router
    app.include_router(oauth_router)
    logger.info("OAuth routes loaded successfully")
except ImportError:
    logger.warning("OAuth module not available - social login will not work")

# Serve React frontend static files
BUILD_DIR = os.path.join(BASE_DIR, 'rcm_dashboard', 'build')
if os.path.exists(BUILD_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(BUILD_DIR, 'assets')), name="assets")
    
    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def serve_frontend(full_path: str):
        """Serve React app for all non-API routes (client-side routing)"""
        # Skip API and other special routes
        if full_path.startswith(('api/', 'docs', 'openapi', 'redoc', '.')):
            return {"detail": "Not found"}, 404
        # Serve index.html for all other routes (React client-side routing)
        index_path = os.path.join(BUILD_DIR, 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'r') as f:
                return f.read()
        return {"detail": "Frontend build not found"}, 404
else:
    logger.warning(f"React build directory not found at {BUILD_DIR} - Frontend will not be served")

# Load the trained model and label encoders
MODEL_PATH = os.path.join(BASE_DIR, 'denial_model.pkl')
ENCODERS_PATH = os.path.join(BASE_DIR, 'label_encoders.pkl')
EXPLAINER_PATH = os.path.join(BASE_DIR, 'shap_explainer.pkl')
FEATURE_NAMES_PATH = os.path.join(BASE_DIR, 'feature_names.pkl')

# Load model (gracefully handle missing files - app can start without models)
model = None
encoder = None
try:
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODERS_PATH):
        model = joblib.load(MODEL_PATH)
        encoder = joblib.load(ENCODERS_PATH)
        logger.info("✓ Model and encoder loaded successfully!")
    else:
        logger.warning(f"⚠️ Model files not found at {MODEL_PATH}. App will start but /predict won't work yet.")
        logger.warning("Run 'python predict_claim_denials.py' to train models.")
except Exception as e:
    logger.warning(f"Could not load model or encoder: {e}. App will start but /predict won't work.")
    model = None
    encoder = None

# SHAP explainer will be initialized lazily on first prediction request
explainer = None
logger.info("SHAP will initialize on first prediction (lazy load)")

# Load schema (feature order, categorical columns, encoder categories)
schema: Dict[str, Any] = {}
try:
    if os.path.exists(FEATURE_NAMES_PATH):
        schema = joblib.load(FEATURE_NAMES_PATH)
        logger.info("Schema metadata loaded successfully!")
except Exception as e:
    logger.warning(f"Could not load schema: {e}")

feature_metadata = schema  # backward-compat alias

# Default fallback values (used when schema is unavailable / old pkl format)
_DEFAULT_CAT_COLS = [
    'insurance_type', 'procedure_code', 'diagnosis_code',
    'provider_type', 'prior_authorization', 'documentation_complete', 'payer'
]
_DEFAULT_FEAT_ORDER = [
    'patient_age', 'insurance_type', 'procedure_code', 'diagnosis_code',
    'provider_type', 'claim_amount', 'prior_authorization',
    'documentation_complete', 'coding_accuracy_score',
    'claim_submission_delay_days', 'payer'
]

# Define the input schema
class ClaimPredictionRequest(BaseModel):
    patient_age: int
    insurance_type: str
    procedure_code: str
    diagnosis_code: str
    provider_type: str
    claim_amount: float
    prior_authorization: str
    documentation_complete: str
    coding_accuracy_score: float
    claim_submission_delay_days: int
    payer: str

# Define the output schema
class FeatureContribution(BaseModel):
    feature: str
    contribution: float
    value: float

class ClaimPredictionResponse(BaseModel):
    denial_probability: float
    risk_level: Literal["Low", "Medium", "High"]
    suggested_action: str
    confidence_score: float
    rule_based_recommendations: List[str]
    feature_contributions: List[FeatureContribution] = []
    shap_available: bool = False

def get_risk_level(probability: float) -> str:
    """Determine risk level based on denial probability"""
    if probability < 0.33:
        return "Low"
    elif probability < 0.67:
        return "Medium"
    else:
        return "High"

def get_suggested_action(probability: float, features: dict) -> str:
    """Provide a simple, patient-friendly suggested action based on denial probability and features"""
    coding_score = features.get('coding_accuracy_score', 0)
    delay_days = features.get('claim_submission_delay_days', 0)
    documentation = features.get('documentation_complete', '')

    if probability >= 0.67:
        return "Your claim has a high chance of being denied. Please fix the issues listed below before submitting."
    elif probability >= 0.33:
        if str(documentation).lower() == 'no':
            return "Your claim is missing some documents. Upload them and recheck before submitting."
        if coding_score < 0.7:
            return "Your medical codes may not match. Ask your billing team to review the codes before submitting."
        if delay_days > 5:
            return "Your claim is being submitted late. Submit sooner next time to avoid rejection."
        return "Your claim looks mostly fine but needs a quick review before submitting."
    else:
        return "Your claim looks good! You can go ahead and submit it."


def get_rule_based_recommendations(features: dict) -> List[str]:
    """Simple, patient-friendly rule-based recommendations for denial prevention"""
    recommendations: List[str] = []

    prior_auth = str(features.get("prior_authorization", "")).lower()
    insurance_type = str(features.get("insurance_type", "")).lower()
    documentation_complete = str(features.get("documentation_complete", "")).lower()
    coding_score = float(features.get("coding_accuracy_score", 0.0))
    delay_days = int(features.get("claim_submission_delay_days", 0))
    claim_amount = float(features.get("claim_amount", 0))

    if prior_auth == "no" and insurance_type == "private":
        recommendations.append("✅ Get Prior Approval — Call your insurer and get a prior authorization number before submitting.")

    if documentation_complete == "no":
        recommendations.append("📄 Upload Missing Documents — Attach doctor's notes or test reports before submitting.")

    if coding_score < 0.6:
        recommendations.append("🔬 Fix Medical Codes — The procedure and diagnosis codes don't match. Ask your billing staff to fix them.")
    elif coding_score < 0.75:
        recommendations.append("🔬 Review Coding — Ask your coder to verify the procedure matches the diagnosis.")

    if delay_days > 10:
        recommendations.append("⏱️ Submit Faster — Your claim is very late. Most insurers reject claims after 90 days.")
    elif delay_days > 5:
        recommendations.append("⏱️ Reduce Delay — Submit within 5 days of treatment to reduce rejection risk.")

    if claim_amount > 50000:
        recommendations.append("💰 Large Claim — High-value claims get extra scrutiny. Ensure all documents and codes are correct.")

    if not recommendations:
        recommendations.append("✅ Everything Looks Good — No issues found. You can submit this claim.")

    return recommendations

# ============================================================
# STARTUP VALIDATION
# ============================================================
@app.on_event("startup")
async def startup_validation():
    """Log startup information without blocking deployment"""
    logger.info("Starting application...")
    
    # Setup security - JWT_SECRET_KEY is optional with default
    jwt_secret = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
    logger.info(f"JWT security: {'custom key configured' if os.getenv('JWT_SECRET_KEY') else 'using default key'}")
    
    # Check if model files exist (log warning if missing, don't block)
    model_files = [MODEL_PATH, ENCODERS_PATH]
    missing_files = [f for f in model_files if not os.path.exists(f)]
    
    if missing_files:
        logger.warning(f"⚠️ Model files not found: {', '.join(missing_files)}")
        logger.warning("App will start but /predict endpoint will fail until models are trained")
    else:
        logger.info("✓ Model files found")
    
    # Log environment info
    logger.info(f"✓ Environment: {ENVIRONMENT}")
    logger.info(f"✓ Frontend URL: {FRONTEND_URL}")
    logger.info(f"✓ SHAP available: {SHAP_AVAILABLE}")
    logger.info("✓ Application is ready to accept requests")

# ============================================================
# CACHING HELPERS
# ============================================================
def get_cached_analytics(cache_key: str, fetch_func, ttl: int = ANALYTICS_CACHE_TTL) -> Dict[str, Any]:
    """
    Get analytics data from cache or fetch and cache if expired.
    
    Args:
        cache_key: Unique key for this analytics query
        fetch_func: Function to call to fetch fresh data
        ttl: Time to live for cache in seconds (default 5 minutes)
        
    Returns:
        Analytics data (cached or fresh)
    """
    with analytics_cache_lock:
        if cache_key in analytics_cache:
            cached_item = analytics_cache[cache_key]
            age = (datetime.utcnow() - cached_item['timestamp']).total_seconds()
            
            if age < ttl:
                logger.debug(f"Cache HIT for {cache_key} (age: {age:.1f}s)")
                return cached_item['data']
            else:
                logger.debug(f"Cache EXPIRED for {cache_key} (age: {age:.1f}s)")
        
        # Fetch fresh data
        logger.debug(f"Cache MISS for {cache_key}, fetching fresh data")
        data = fetch_func()
        
        # Store in cache
        analytics_cache[cache_key] = {
            'data': data,
            'timestamp': datetime.utcnow()
        }
        
        return data

def invalidate_analytics_cache():
    """Invalidate all analytics caches (called after model retraining)"""
    with analytics_cache_lock:
        analytics_cache.clear()
        logger.info("Analytics cache invalidated due to model retrain")

@app.get("/")
def read_root():
    """
    Health check endpoint.
    
    Returns:
        dict: API status and version information
    """
    return {
        "message": "Claim Denial Prediction API",
        "version": "1.0.0",
        "status": "running"
    }

@app.post("/predict", response_model=ClaimPredictionResponse)
def predict_claim_denial(request: ClaimPredictionRequest) -> ClaimPredictionResponse:
    """
    Predict the probability of healthcare claim denial with AI-powered explainability.
    
    This endpoint uses a trained Random Forest model to predict claim denial probability
    and provides SHAP-based feature importance explanations for model transparency.
    
    Args:
        request: ClaimPredictionRequest containing:
            - patient_age: Age of the patient (required)
            - insurance_type: Type of insurance coverage (required)
            - procedure_code: Medical procedure code (required)
            - diagnosis_code: Medical diagnosis code (required)
            - provider_type: Type of medical provider (required)
            - claim_amount: Amount claimed in dollars (required)
            - prior_authorization: Whether prior auth was obtained (required)
            - documentation_complete: Whether documentation is complete (required)
            - coding_accuracy_score: Medical coding accuracy (0-1) (required)
            - claim_submission_delay_days: Days between treatment and submission (required)
            - payer: Insurance payer name (required)
    
    Returns:
        ClaimPredictionResponse containing:
            - denial_probability: Probability of claim denial (0-1)
            - risk_level: Risk categorization (Low/Medium/High)
            - suggested_action: Patient-friendly recommended action
            - confidence_score: Model confidence in prediction (0-1)
            - rule_based_recommendations: List of actionable recommendations
            - feature_contributions: SHAP feature importance breakdown (if available)
            - shap_available: Whether SHAP explanations were generated
    
    Raises:
        HTTPException: 422 if input validation fails
        HTTPException: 429 if rate limit exceeded (60 requests/minute)
        HTTPException: 500 if prediction fails
    
    Example:
        POST /predict
        {
            "patient_age": 45,
            "insurance_type": "Private",
            "procedure_code": "PROC_A",
            "diagnosis_code": "DX1",
            "provider_type": "Specialist",
            "claim_amount": 5000.0,
            "prior_authorization": "Yes",
            "documentation_complete": "Yes",
            "coding_accuracy_score": 0.85,
            "claim_submission_delay_days": 3,
            "payer": "BlueCross"
        }
    """
    try:
        # Check if model is available
        if model is None or encoder is None:
            raise HTTPException(
                status_code=503,
                detail="Model not available. Please train the model first by running 'python predict_claim_denials.py'"
            )
        
        # Create a DataFrame with the input data
        input_data = pd.DataFrame([request.dict()])
        
        # Resolve column lists from saved schema (falls back to defaults if schema missing)
        categorical_cols = schema.get('categorical_columns', _DEFAULT_CAT_COLS)
        feature_order    = schema.get('feature_names',       _DEFAULT_FEAT_ORDER)

        # Encode all categorical columns at once.
        # OrdinalEncoder automatically maps any unknown value (new payer, new code,
        # new insurer from a different dataset) to -1, which RandomForest handles fine.
        cols_present = [c for c in categorical_cols if c in input_data.columns]
        if cols_present:
            input_data[cols_present] = encoder.transform(input_data[cols_present])

        # Align column order to match training data
        input_data = input_data[feature_order]
        
        # Make prediction
        prediction = model.predict(input_data)[0]
        prediction_proba = model.predict_proba(input_data)[0]
        
        # Get denial probability (class 1)
        denial_probability = float(prediction_proba[1])
        
        # Determine risk level
        risk_level = get_risk_level(denial_probability)
        
        # Get suggested action and rule-based recommendations
        suggested_action = get_suggested_action(
            denial_probability,
            request.dict()
        )

        rule_based_recommendations = get_rule_based_recommendations(request.dict())
        
        # Calculate confidence score (how confident the model is)
        confidence_score = float(max(prediction_proba))
        
        # Generate SHAP feature contributions if available
        feature_contributions = []
        shap_available = False
        global explainer
        if SHAP_AVAILABLE and explainer is None:
            try:
                explainer = shap.TreeExplainer(model)
            except Exception as e:
                logger.warning(f"Could not initialize SHAP explainer: {e}")
        if explainer is not None and SHAP_AVAILABLE:
            try:
                # Get SHAP values for the input
                shap_values = explainer.shap_values(input_data)
                
                # For binary classification, shap_values is a list with 2 elements
                # We want the values for class 1 (denial)
                if isinstance(shap_values, list):
                    shap_vals = shap_values[1][0]
                else:
                    shap_vals = shap_values[0]
                
                # Combine SHAP values with feature names and values
                for idx, feature_name in enumerate(feature_order):
                    contribution = float(shap_vals[idx])
                    feature_value = float(input_data[feature_name].iloc[0])
                    feature_contributions.append(FeatureContribution(
                        feature=feature_name,
                        contribution=round(contribution, 6),
                        value=round(feature_value, 4)
                    ))
                
                # Sort by absolute contribution value (descending)
                feature_contributions.sort(
                    key=lambda x: abs(x.contribution), 
                    reverse=True
                )
                shap_available = True
            except Exception as e:
                logger.warning(f"Could not generate SHAP values: {e}")
        
        response = ClaimPredictionResponse(
            denial_probability=round(denial_probability, 4),
            risk_level=risk_level,
            suggested_action=suggested_action,
            confidence_score=round(confidence_score, 4),
            rule_based_recommendations=rule_based_recommendations,
            feature_contributions=feature_contributions,
            shap_available=shap_available,
        )
        # Save to SQLite
        try:
            db = SessionLocal()
            db.add(PredictionHistory(
                patient_age=request.patient_age,
                insurance_type=request.insurance_type,
                procedure_code=request.procedure_code,
                diagnosis_code=request.diagnosis_code,
                provider_type=request.provider_type,
                claim_amount=request.claim_amount,
                prior_authorization=request.prior_authorization,
                documentation_complete=request.documentation_complete,
                coding_accuracy_score=request.coding_accuracy_score,
                claim_submission_delay_days=request.claim_submission_delay_days,
                payer=request.payer,
                denial_probability=round(denial_probability, 4),
                risk_level=risk_level,
                confidence_score=round(confidence_score, 4),
                suggested_action=suggested_action,
            ))
            db.commit()
            db.close()
        except Exception as db_err:
            logger.warning(f"DB save failed: {db_err}")
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error making prediction: {str(e)}"
        )

@app.post("/retrain", dependencies=[Depends(require_admin_key)])
async def retrain_model(file: UploadFile = File(...)):
    """
    Retrain the model on a custom healthcare claims dataset.
    
    **Important:** Requires X-API-Key header with admin credentials.
    
    This endpoint allows administrators to retrain the denial prediction model
    on new datasets. The model is immediately hot-swapped, so all subsequent
    predictions use the newly trained model without downtime.
    
    Args:
        file: CSV file containing healthcare claims data. The CSV should include
            columns for patient demographics, claim details, and denial status.
            Columns are auto-detected. Maximum file size: 50MB.
    
    Returns:
        dict containing:
            - status: "success" if retraining completed
            - message: Human-readable status message
            - rows_used: Number of rows used for training
            - features: List of feature names
            - feature_importances: Dictionary of feature importance scores
            - categorical_columns: List of categorical columns detected
            - encoder_categories: Categories for each categorical column
    
    Raises:
        HTTPException: 400 if file is not CSV or is invalid
        HTTPException: 403 if API key is missing or invalid
        HTTPException: 413 if file exceeds 50MB
        HTTPException: 500 if retraining fails
    
    Side Effects:
        - Invalidates all analytics caches
        - Resets SHAP explainer (will reinitialize on next prediction)
    """
    global model, encoder, schema, explainer, feature_metadata

    # File extension validation
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    # File size validation (max 50MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    file_size = await file.seek(0, 2)
    await file.seek(0)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is 50MB, received {file_size / 1024 / 1024:.2f}MB"
        )

    # Save upload to a temp file
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        # Validate CSV structure before proceeding
        try:
            test_df = pd.read_csv(tmp_path, nrows=1)
            if test_df.empty:
                raise HTTPException(status_code=400, detail="CSV file is empty.")
            logger.info(f"CSV file validated: {len(test_df.columns)} columns")
        except pd.errors.ParserError as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")

        # Import the generalized training pipeline
        from predict_claim_denials import train as run_training
        new_model, new_encoder, new_schema = run_training(dataset_path=tmp_path)

        # Hot-swap globals — new predictions immediately use the retrained model
        model   = new_model
        encoder = new_encoder
        schema  = new_schema
        feature_metadata = new_schema
        explainer = None  # reset SHAP; will reinitialize lazily

        # Invalidate analytics caches since data may have changed
        invalidate_analytics_cache()

        feature_cols = new_schema.get('feature_names', [])
        importances  = dict(zip(feature_cols, new_model.feature_importances_.tolist()))

        logger.info(f"Model successfully retrained on file: {file.filename}")
        return {
            "status": "success",
            "message": f"Model retrained on '{file.filename}' and hot-swapped.",
            "rows_used": int(new_model.n_features_in_),
            "features": feature_cols,
            "feature_importances": importances,
            "categorical_columns": new_schema.get('categorical_columns', []),
            "encoder_categories": new_schema.get('encoder_categories', {}),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Retraining failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.get("/model-info")
def get_model_info():
    """
    Get detailed information about the currently loaded model.
    
    Returns information about the active prediction model, including:
    - Model type and configuration
    - Features and categorical variables
    - Feature importance scores
    - Encoder categories for categorical variables
    
    Returns:
        dict containing:
            - model_type: Type of model (e.g., "RandomForestClassifier")
            - n_estimators: Number of decision trees in the forest
            - encoder_type: Type of categorical encoder used
            - trained_on_columns: List of features the model was trained on
            - categorical_columns: List of categorical features
            - encoder_categories: Possible values for each categorical feature
            - feature_importances: Dictionary of feature importance scores
    
    Example Response:
        {
            "model_type": "RandomForestClassifier",
            "n_estimators": 100,
            "encoder_type": "OrdinalEncoder",
            "trained_on_columns": ["patient_age", "insurance_type", ...],
            "categorical_columns": ["insurance_type", "procedure_code", ...],
            "encoder_categories": {...},
            "feature_importances": {
                "coding_accuracy_score": 0.1749,
                "claim_submission_delay_days": 0.1679,
                ...
            }
        }
    """
    feature_cols = schema.get('feature_names', _DEFAULT_FEAT_ORDER)
    importances  = dict(zip(feature_cols, model.feature_importances_.tolist()))
    return {
        "model_type": type(model).__name__,
        "n_estimators": model.n_estimators,
        "encoder_type": type(encoder).__name__,
        "trained_on_columns": feature_cols,
        "categorical_columns": schema.get('categorical_columns', _DEFAULT_CAT_COLS),
        "encoder_categories": schema.get('encoder_categories', {}),
        "feature_importances": importances,
    }

@app.get("/analytics")
def get_analytics():
    """
    Get comprehensive aggregated analytics about healthcare claims.
    
    **Cached Response:** Results are cached for 5 minutes to improve performance
    for frequently requested analytics. Cache is invalidated when the model is retrained.
    
    Returns aggregated statistics including:
    - Overall claim statistics and denial rates
    - Top procedures by denial rate
    - Payer-level denial analysis
    - Provider type analysis
    - Insurance type breakdown
    
    Returns:
        dict containing:
            - overall: Summary statistics across all claims
            - procedures: Top procedures by denial rate
            - payers: Denial rates by insurance company
            - providers: Denial rates by provider type
            - insurance_types: Denial rates by insurance type
            - coding: Coding accuracy statistics
    
    Raises:
        HTTPException: 500 if analytics generation fails
    
    Example Response:
        {
            "overall": {
                "total_claims": 5000,
                "denied_claims": 1693,
                "denial_rate": 0.3386,
                ...
            },
            "procedures": [...],
            "payers": [...]
        }
    """
    def fetch_analytics():
        try:
            from claims_analytics import ClaimsAnalytics
            
            analytics = ClaimsAnalytics(os.path.join(BASE_DIR, 'synthetic_healthcare_claims_dataset.csv'))
            result = analytics.generate_all_analytics()
            logger.info("Analytics generated successfully")
            return result
        except Exception as e:
            logger.error(f"Error generating analytics: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error generating analytics: {str(e)}"
            )
    
    return get_cached_analytics('analytics_full', fetch_analytics)

@app.get("/analytics/summary")
def get_analytics_summary():
    """
    Get summary analytics with key metrics and top findings.
    
    **Cached Response:** Results are cached for 5 minutes. Cache is invalidated
    when the model is retrained.
    
    Returns:
        dict containing:
            - overall: Overall claim statistics and denial rates
            - top_procedures: Top 10 procedures by denial rate
            - denial_by_payer: Denial rates for each insurance company
            - claim_amount_comparison: Statistics on claim amounts
    
    Raises:
        HTTPException: 500 if summary generation fails
    """
    def fetch_summary():
        try:
            from claims_analytics import ClaimsAnalytics
            
            analytics = ClaimsAnalytics(os.path.join(BASE_DIR, 'synthetic_healthcare_claims_dataset.csv'))
            result = {
                "overall": analytics.get_overall_statistics(),
                "top_procedures": analytics.get_top_procedures_by_denial_rate(top_n=10),
                "denial_by_payer": analytics.get_denial_rate_by_payer(),
                "claim_amount_comparison": analytics.get_claim_amount_comparison()
            }
            logger.info("Summary analytics generated successfully")
            return result
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error generating summary: {str(e)}"
            )
    
    return get_cached_analytics('analytics_summary', fetch_summary)

@app.get("/analytics/procedures")
def get_procedures_analytics():
    """
    Get detailed procedure-level denial analytics.
    
    **Cached Response:** Results are cached for 5 minutes. Cache is invalidated
    when the model is retrained.
    
    Returns:
        dict containing:
            - procedures: Top 20 procedures ranked by denial rate
    
    Raises:
        HTTPException: 500 if procedure analytics generation fails
    """
    def fetch_procedures():
        try:
            from claims_analytics import ClaimsAnalytics
            
            analytics = ClaimsAnalytics(os.path.join(BASE_DIR, 'synthetic_healthcare_claims_dataset.csv'))
            result = {
                "procedures": analytics.get_top_procedures_by_denial_rate(top_n=20)
            }
            logger.info("Procedure analytics generated successfully")
            return result
        except Exception as e:
            logger.error(f"Error generating procedure analytics: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error generating procedure analytics: {str(e)}"
            )
    
    return get_cached_analytics('analytics_procedures', fetch_procedures)

@app.get("/analytics/payers")
def get_payers_analytics():
    """
    Get insurance company (payer) denial rate analysis.
    
    **Cached Response:** Results are cached for 5 minutes. Cache is invalidated
    when the model is retrained.
    
    Returns:
        dict containing:
            - payers: List of payers with their denial statistics
    
    Raises:
        HTTPException: 500 if payer analytics generation fails
    """
    def fetch_payers():
        try:
            from claims_analytics import ClaimsAnalytics
            
            analytics = ClaimsAnalytics(os.path.join(BASE_DIR, 'synthetic_healthcare_claims_dataset.csv'))
            result = {
                "payers": analytics.get_denial_rate_by_payer(),
                "providers": analytics.get_denial_rate_by_provider_type()
            }
            logger.info("Payer analytics generated successfully")
            return result
        except Exception as e:
            logger.error(f"Error generating payer analytics: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Error generating payer analytics: {str(e)}"
            )
    
    return get_cached_analytics('analytics_payers', fetch_payers)

@app.get("/shap/status")
def get_shap_status():
    """
    Check SHAP explainability availability.
    
    Returns:
        dict containing:
            - shap_available: Whether SHAP library is installed
            - explainer_loaded: Whether SHAP explainer is currently initialized
            - message: Human readable status message
    """
    return {
        "shap_available": SHAP_AVAILABLE,
        "explainer_loaded": explainer is not None,
        "message": "SHAP feature importance analysis is available" if explainer is not None else "SHAP explainer not loaded"
    }

@app.post("/shap/explain")
def get_shap_explanation(request: ClaimPredictionRequest) -> Dict[str, Any]:
    """
    Get detailed SHAP explanation for a claim prediction.
    
    **Requires SHAP:** The SHAP library must be installed (installed by default).
    
    This endpoint provides detailed feature contribution analysis for individual
    predictions using SHAP (SHapley Additive exPlanations) values. SHAP values
    explain how each input feature contributed to the prediction, improving
    model interpretability and trust.
    
    Args:
        request: ClaimPredictionRequest with claim details to explain
    
    Returns:
        dict containing:
            - denial_probability: Predicted denial probability (0-1)
            - risk_level: Risk categorization (Low/Medium/High)
            - feature_contributions: Detailed SHAP values for each feature
            - base_value: Model's baseline prediction
            - shap_available: Whether SHAP analysis was successful
    
    Raises:
        HTTPException: 400 if SHAP library is not installed
        HTTPException: 500 if explanation generation fails
    """
    global explainer
    if not explainer and SHAP_AVAILABLE:
        try:
            explainer = shap.TreeExplainer(model)
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Could not initialize SHAP explainer: {e}")
    if not explainer:
        raise HTTPException(
            status_code=503,
            detail="SHAP explainer not available. Run predict_claim_denials.py to initialize."
        )
    
    try:
        # Create a DataFrame with the input data
        input_data = pd.DataFrame([request.dict()])
        
        # Extract categorical columns that need encoding
        categorical_columns = [
            'insurance_type',
            'procedure_code',
            'diagnosis_code',
            'provider_type',
            'prior_authorization',
            'documentation_complete',
            'payer'
        ]
        
        # Encode categorical variables
        for col in categorical_columns:
            if col not in label_encoders:
                raise HTTPException(status_code=400, detail=f"Unknown categorical value for {col}")
            try:
                input_data[col] = label_encoders[col].transform(input_data[col])
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Invalid value for {col}: {str(e)}")
        
        # Ensure feature order
        feature_order = [
            'patient_age', 'insurance_type', 'procedure_code', 'diagnosis_code', 
            'provider_type', 'claim_amount', 'prior_authorization', 
            'documentation_complete', 'coding_accuracy_score', 
            'claim_submission_delay_days', 'payer'
        ]
        input_data = input_data[feature_order]
        
        # Get SHAP values
        shap_values = explainer.shap_values(input_data)
        
        # Handle both binary and multi-class cases
        if isinstance(shap_values, list):
            shap_vals = shap_values[1][0]  # Class 1 (denial)
        else:
            shap_vals = shap_values[0]
        
        # Create detailed explanation
        explanation = {
            "input_features": request.dict(),
            "feature_contributions": []
        }
        
        for idx, feature_name in enumerate(feature_order):
            explanation["feature_contributions"].append({
                "feature": feature_name,
                "value": float(input_data[feature_name].iloc[0]),
                "shap_value": float(shap_vals[idx]),
                "contribution_type": "increases_denial" if shap_vals[idx] > 0 else "decreases_denial"
            })
        
        # Sort by absolute SHAP value
        explanation["feature_contributions"].sort(
            key=lambda x: abs(x["shap_value"]), 
            reverse=True
        )
        
        return explanation
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating SHAP explanation: {str(e)}"
        )

@app.get("/history")
def get_history(limit: int = 20):
    """
    Get prediction history from the database.
    
    Retrieves recent claim predictions stored in the database, showing
    the most recent predictions first. Useful for auditing and analysis.
    
    Query Parameters:
        limit: Maximum number of historical records to return (default: 20, max: 100)
    
    Returns:
        list of dict containing:
            - id: Unique prediction ID
            - payer: Insurance company name
            - insurance_type: Type of insurance
            - claim_amount: Amount claimed in dollars
            - denial_probability: Predicted denial probability
            - risk_level: Risk categorization
            - created_at: Timestamp of prediction
    
    Raises:
        HTTPException: 500 if database query fails
    """
    try:
        # Limit to 100 maximum to prevent large data transfers
        limit = min(limit, 100)
        
        db = SessionLocal()
        records = db.query(PredictionHistory)\
                    .order_by(PredictionHistory.created_at.desc())\
                    .limit(limit).all()
        db.close()
        
        logger.info(f"Retrieved {len(records)} prediction history records")
        return [{"id": r.id, "payer": r.payer, "insurance_type": r.insurance_type,
                 "claim_amount": r.claim_amount, "denial_probability": r.denial_probability,
                 "risk_level": r.risk_level, "created_at": str(r.created_at)} for r in records]
    except Exception as e:
        logger.error(f"Error retrieving prediction history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    logger.info("="*60)
    logger.info("Starting Claim Denial Prediction API...")
    logger.info(f"Using Port: {port}")
    logger.info(f"Dashboard: http://localhost:{port}")
    logger.info(f"API Docs: http://localhost:{port}/docs")
    logger.info("="*60)
    uvicorn.run(app, host="0.0.0.0", port=port)
