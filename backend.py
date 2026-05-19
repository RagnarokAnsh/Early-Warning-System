"""
EWS Backend — FastAPI (Upgraded for Feature Engineering & Explainability)
Run with: uvicorn backend:app --reload
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
import pandas as pd
import io
import joblib
import shap
from catboost import CatBoostClassifier

app = FastAPI(title="EWS API", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 1. Model Loading ────────────────────────────────────────────────────────
# In a real scenario, you will train and save a CatBoost model. 
# For now, we wrap your existing model or load a CatBoost one if available.
try:
    model = CatBoostClassifier()
    model.load_model("dropout_model_catboost.cbm")
    # Set up SHAP explainer for CatBoost
    explainer = shap.TreeExplainer(model)
    USING_CATBOOST = True
except:
    # Fallback to your old scikit-learn model if CatBoost isn't trained yet
    model = joblib.load("dropout_model2.pkl")
    # TreeExplainer works for Random Forest / XGBoost / LightGBM too
    explainer = shap.TreeExplainer(model) 
    USING_CATBOOST = False

# ── 2. Feature Engineering Pipeline ─────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms raw inputs into the engineered features the model actually uses.
    Handles the "Cold Start" by maximizing the value of the 2 variables we have.
    """
    engineered = pd.DataFrame()
    
    # Base features
    engineered['learning_score'] = df['learning_score']
    engineered['attendance'] = df['attendance']
    
    # 1. Interaction Feature: Low attendance + Low score is often exponential risk
    engineered['attendance_score_interaction'] = df['attendance'] * df['learning_score']
    
    # 2. Imputation: Handle missing values gracefully (preparing for the 550 features)
    engineered.fillna({
        'learning_score': engineered['learning_score'].median(),
        'attendance': engineered['attendance'].median(),
        'attendance_score_interaction': 0
    }, inplace=True)
    
    return engineered

# ── 3. Predict Endpoint (Single Student) ────────────────────────────────────

class PredictIn(BaseModel):
    learning_score: float
    attendance: float
    consecutive_absences: Optional[int] = Field(default=0, description="Days absent in a row")
    threshold: float = 0.5

@app.post("/predict")
def predict(body: PredictIn):
    # BASELINE RULE: Overrides ML model completely
    # As per PPT: "If a student is not present for successive 30 school working days... labeled as dropout."
    if body.consecutive_absences >= 30:
        return {
            "probability": 1.0, 
            "prediction": "Dropout", 
            "risk": "critical",
            "reason": "Baseline Rule Triggered: 30+ consecutive days absent."
        }

    # Prepare data for model
    df_input = pd.DataFrame([{
        "learning_score": body.learning_score, 
        "attendance": body.attendance
    }])
    
    # Apply feature engineering
    X_processed = engineer_features(df_input)
    
    # Predict Probability
    prob = float(model.predict_proba(X_processed)[0][1])
    prediction = "Dropout" if prob >= body.threshold else "Promoted"

    # Risk Tiering (Dynamic rather than static)
    if prob < (body.threshold * 0.6):
        risk = "low"
    elif prob < body.threshold:
        risk = "medium"
    elif prob < 0.85:
        risk = "high"
    else:
        risk = "critical"

    # SHAP Explainability: Why is this student at risk?
    shap_values = explainer.shap_values(X_processed)
    
    # Map SHAP values to feature names to tell the frontend what's causing the risk
    feature_names = X_processed.columns.tolist()
    student_shap = shap_values[0] if isinstance(shap_values, list) else shap_values[0]
    
    reasons = [
        {"feature": feat, "impact": float(val)} 
        for feat, val in zip(feature_names, student_shap)
    ]
    # Sort by absolute impact to find the biggest drivers
    reasons.sort(key=lambda x: abs(x["impact"]), reverse=True)

    return {
        "probability": prob, 
        "prediction": prediction, 
        "risk": risk,
        "top_drivers": reasons[:3] # Send top 3 reasons to the frontend
    }

# ── 4. Bulk Processing Endpoint ─────────────────────────────────────────────

@app.post("/bulk")
async def bulk(file: UploadFile = File(...), threshold: float = Form(0.5)):
    content = await file.read()
    ext = file.filename.rsplit(".", 1)[-1].lower()

    try:
        df = pd.read_csv(io.BytesIO(content)) if ext == "csv" else pd.read_excel(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(400, f"Could not parse file: {exc}")

    # Flexible column matching
    learning_col = next((c for c in df.columns if "learning" in c.lower() or "score" in c.lower()), None)
    attend_col = next((c for c in df.columns if "attend" in c.lower()), None)

    if not learning_col or not attend_col:
        raise HTTPException(400, "File must have columns representing 'learning' and 'attendance'.")

    # Standardize column names for the engineering pipeline
    df_clean = df.copy()
    df_clean.rename(columns={learning_col: 'learning_score', attend_col: 'attendance'}, inplace=True)
    
    # Feature Engineering
    X_processed = engineer_features(df_clean[['learning_score', 'attendance']])

    # Batch Predictions
    probs = model.predict_proba(X_processed)[:, 1]
    
    # Attach results back to the original dataframe for the user
    df["dropout_probability"] = [round(float(p), 4) for p in probs]
    df["risk_level"] = np.where(probs >= 0.85, "Critical", 
                       np.where(probs >= threshold, "High", 
                       np.where(probs >= threshold * 0.6, "Medium", "Low")))
    
    df[f"prediction (t={threshold:.2f})"] = np.where(probs >= threshold, "Dropout", "Promoted")

    dropouts = int((probs >= threshold).sum())

    return {
        "rows": df.to_dict(orient="records"),
        "total": len(df),
        "dropouts": dropouts,
        "critical_cases": int((probs >= 0.85).sum())
    }

# ── 5. Risk surface (50×50 grid) ─────────────────────────────────────────────

@app.get("/surface")
def surface():
    """Generates the data for the frontend heat-map scatter plot."""
    xs = np.linspace(0, 100, 50)
    ys = np.linspace(0, 100, 50)
    xx, yy = np.meshgrid(xs, ys)
    
    # Create grid dataframe and run it through the exact same feature pipeline
    grid_df = pd.DataFrame({'learning_score': xx.ravel(), 'attendance': yy.ravel()})
    X_grid = engineer_features(grid_df)
    
    probs = model.predict_proba(X_grid)[:, 1].reshape(50, 50)
    return {
        "x": xs.tolist(),
        "y": ys.tolist(),
        "z": probs.tolist(),
    }