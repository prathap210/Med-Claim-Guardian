from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os
import tempfile
import shutil
from typing import Literal, List, Dict, Any
import warnings
import socket
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()
warnings.filterwarnings('ignore')

# Database
from database import SessionLocal, Base, engine, PredictionHistory
Base.metadata.create_all(bind=engine)
print("[OK] SQLite database ready")

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Admin API key for protected endpoints
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "change-this-key")
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

# Add CORS middleware
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model and label encoders
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'denial_model.pkl')
ENCODERS_PATH = os.path.join(BASE_DIR, 'label_encoders.pkl')
EXPLAINER_PATH = os.path.join(BASE_DIR, 'shap_explainer.pkl')
FEATURE_NAMES_PATH = os.path.join(BASE_DIR, 'feature_names.pkl')

try:
    model = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODERS_PATH)   # OrdinalEncoder (handles unknown categories)
    print("[OK] Model and encoder loaded successfully!")
except FileNotFoundError as e:
    print(f"Error: Could not load model or encoder. {e}")
    raise

# SHAP explainer will be initialized lazily on first prediction request
explainer = None
print("[OK] SHAP will initialize on first prediction (lazy load)")

# Load schema (feature order, categorical columns, encoder categories)
schema: Dict[str, Any] = {}
try:
    if os.path.exists(FEATURE_NAMES_PATH):
        schema = joblib.load(FEATURE_NAMES_PATH)
        print("[OK] Schema metadata loaded successfully!")
except Exception as e:
    print(f"Warning: Could not load schema: {e}")

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

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "message": "Claim Denial Prediction API",
        "version": "1.0.0",
        "status": "running"
    }

@app.post("/predict", response_model=ClaimPredictionResponse)
def predict_claim_denial(request: ClaimPredictionRequest) -> ClaimPredictionResponse:
    """
    Predict the probability of claim denial.
    
    Args:
        request: ClaimPredictionRequest with all required fields
        
    Returns:
        ClaimPredictionResponse with denial probability, risk level, and suggested action
    """
    try:
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
                print(f"Warning: Could not initialize SHAP explainer: {e}")
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
                print(f"Warning: Could not generate SHAP values: {e}")
        
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
            print(f"Warning: DB save failed: {db_err}")
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
    Retrain the model on any uploaded CSV dataset.
    Accepts any healthcare claims CSV — columns are auto-detected.
    The new model is immediately hot-swapped into the running server.
    """
    global model, encoder, schema, explainer, feature_metadata

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    # Save upload to a temp file
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        # Import the generalized training pipeline
        from predict_claim_denials import train as run_training
        new_model, new_encoder, new_schema = run_training(dataset_path=tmp_path)

        # Hot-swap globals — new predictions immediately use the retrained model
        model   = new_model
        encoder = new_encoder
        schema  = new_schema
        feature_metadata = new_schema
        explainer = None  # reset SHAP; will reinitialize lazily

        feature_cols = new_schema.get('feature_names', [])
        importances  = dict(zip(feature_cols, new_model.feature_importances_.tolist()))

        return {
            "status": "success",
            "message": f"Model retrained on '{file.filename}' and hot-swapped.",
            "rows_used": int(new_model.n_features_in_),
            "features": feature_cols,
            "feature_importances": importances,
            "categorical_columns": new_schema.get('categorical_columns', []),
            "encoder_categories": new_schema.get('encoder_categories', {}),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.get("/model-info")
def get_model_info():
    """Get live information about the currently loaded model"""
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
    """Get aggregated analytics about claims"""
    try:
        from claims_analytics import ClaimsAnalytics
        
        analytics = ClaimsAnalytics(os.path.join(BASE_DIR, 'synthetic_healthcare_claims_dataset.csv'))
        return analytics.generate_all_analytics()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating analytics: {str(e)}"
        )

@app.get("/analytics/summary")
def get_analytics_summary():
    """Get summary analytics"""
    try:
        from claims_analytics import ClaimsAnalytics
        
        analytics = ClaimsAnalytics(os.path.join(BASE_DIR, 'synthetic_healthcare_claims_dataset.csv'))
        return {
            "overall": analytics.get_overall_statistics(),
            "top_procedures": analytics.get_top_procedures_by_denial_rate(top_n=10),
            "denial_by_payer": analytics.get_denial_rate_by_payer(),
            "claim_amount_comparison": analytics.get_claim_amount_comparison()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating summary: {str(e)}"
        )

@app.get("/analytics/procedures")
def get_procedures_analytics():
    """Get procedure-level analytics"""
    try:
        from claims_analytics import ClaimsAnalytics
        
        analytics = ClaimsAnalytics(os.path.join(BASE_DIR, 'synthetic_healthcare_claims_dataset.csv'))
        return {
            "procedures": analytics.get_top_procedures_by_denial_rate(top_n=20)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating procedure analytics: {str(e)}"
        )

@app.get("/analytics/payers")
def get_payers_analytics():
    """Get payer-level analytics"""
    try:
        from claims_analytics import ClaimsAnalytics
        
        analytics = ClaimsAnalytics(os.path.join(BASE_DIR, 'synthetic_healthcare_claims_dataset.csv'))
        return {
            "payers": analytics.get_denial_rate_by_payer(),
            "providers": analytics.get_denial_rate_by_provider_type()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating payer analytics: {str(e)}"
        )

@app.get("/shap/status")
def get_shap_status():
    """Check if SHAP explainer is available"""
    return {
        "shap_available": SHAP_AVAILABLE,
        "explainer_loaded": explainer is not None,
        "message": "SHAP feature importance analysis is available" if explainer is not None else "SHAP explainer not loaded"
    }

@app.post("/shap/explain")
def get_shap_explanation(request: ClaimPredictionRequest) -> Dict[str, Any]:
    """
    Get detailed SHAP explanation for a claim prediction.
    
    Returns detailed feature contribution analysis using SHAP values.
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
    """Get last N predictions from the database"""
    try:
        db = SessionLocal()
        records = db.query(PredictionHistory)\
                    .order_by(PredictionHistory.created_at.desc())\
                    .limit(limit).all()
        db.close()
        return [{"id": r.id, "payer": r.payer, "insurance_type": r.insurance_type,
                 "claim_amount": r.claim_amount, "denial_probability": r.denial_probability,
                 "risk_level": r.risk_level, "created_at": str(r.created_at)} for r in records]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print("\n" + "="*60)
    print("[STARTUP] Starting Claim Denial Prediction API...")
    print(f"[INFO] Using Port: {port}")
    print(f"[INFO] Dashboard: http://localhost:{port}")
    print(f"[INFO] API Docs: http://localhost:{port}/docs")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=port)
