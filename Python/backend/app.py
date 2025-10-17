# backend/app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from pathlib import Path
import os

APP_ROOT   = Path(__file__).resolve().parent          # .../Python/backend
MODELS_DIR = APP_ROOT.parent / "models"               # .../Python/models

def PKL(name: str) -> str:
    return str(MODELS_DIR / name)

vectorizer = joblib.load(PKL("vectorizer.pkl"))
models = {
    "mnb": joblib.load(PKL("spam_classifier_nb.pkl")),
    "svm": joblib.load(PKL("spam_classifier_svm.pkl")),
    "rf":  joblib.load(PKL("spam_classifier_randforest.pkl")),
    "lr":  joblib.load(PKL("spam_classifier_logreg.pkl")),
}

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],  # your React dev URL(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClassifyIn(BaseModel):
    text: str
    algo: str  # one of "mnb" | "svm" | "rf" | "lr"

@app.post("/api/classify")
def classify(payload: ClassifyIn):
    algo = payload.algo.lower()
    if algo not in models:
        raise HTTPException(status_code=400, detail=f"Unknown algo '{payload.algo}'")

    X = vectorizer.transform([payload.text])
    model = models[algo]
    label = model.predict(X)[0]

    # Try to return a confidence score if the model supports it
    score = None
    if hasattr(model, "predict_proba"):
        score = float(model.predict_proba(X)[0].max())
    elif hasattr(model, "decision_function"):
        # scale decision_function to a 0..1-ish number for display (optional)
        import math
        raw = float(model.decision_function(X)[0])
        score = 1.0 / (1.0 + math.exp(-raw))  # simple logistic squish

    return {"label": "SPAM" if int(label)==1 else "NOT_SPAM", "score": score, "algo": algo}
