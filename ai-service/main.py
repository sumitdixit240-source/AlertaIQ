from fastapi import FastAPI
from model import predict_risk

app = FastAPI()

@app.post("/predict")
def predict(data: dict):

    features = [
        data["amount"],
        data["days_left"],
        data["missed_count"],
        data["avg_delay"]
    ]

    risk = predict_risk(features)

    if risk == "HIGH_RISK":
        return {
            "risk": risk,
            "priority": 3,
            "message": "🚨 High chance of missed renewal",
            "suggestion": "Send WhatsApp reminder + Email now"
        }

    if risk == "MEDIUM_RISK":
        return {
            "risk": risk,
            "priority": 2,
            "message": "⚠ Medium attention required",
            "suggestion": "Send reminder 2x before expiry"
        }

    return {
        "risk": risk,
        "priority": 1,
        "message": "✔ Low risk user",
        "suggestion": "Normal reminder schedule"
    }
