"""
Surgical PPE Audit - Backend API
---------------------------------
FastAPI server that loads a trained YOLOv8 model (best.pt) and exposes
a /predict endpoint for the React frontend to call.

Run with:
    uvicorn app:app --reload --host 0.0.0.0 --port 8000
"""

import io
import os
import base64

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from ultralytics import YOLO

# ---------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "best.pt")
CLASS_NAMES = ["Coverall", "Face_Shield", "Gloves", "Goggles", "Mask"]

app = FastAPI(title="Surgical PPE Audit API")

# Allow the React dev server (http://localhost:3000 / 5173) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# LOAD MODEL ONCE AT STARTUP
# ---------------------------------------------------------------------
model = None


@app.on_event("startup")
def load_model():
    global model
    if not os.path.exists(MODEL_PATH):
        print(f"⚠️  Model not found at {MODEL_PATH}. Place best.pt inside the /model folder.")
        return
    model = YOLO(MODEL_PATH)
    print(f"✅ Model loaded from {MODEL_PATH}")


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    conf: float = Query(0.25, ge=0.0, le=1.0),
    iou: float = Query(0.45, ge=0.0, le=1.0),
):
    if model is None:
        return JSONResponse(status_code=503, content={"error": "Model not loaded. Check /model/best.pt"})

    # Read uploaded image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    img_array = np.array(image)

    # Run inference
    results = model.predict(source=img_array, conf=conf, iou=iou, verbose=False)
    result = results[0]

    # Annotated image (BGR -> RGB -> base64 PNG)
    annotated = result.plot(line_width=2)
    annotated_rgb = cv2.cvtColor(annotated, cv2.COLOR_BGR2RGB)
    annotated_pil = Image.fromarray(annotated_rgb)

    buffer = io.BytesIO()
    annotated_pil.save(buffer, format="PNG")
    annotated_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    # Build counts + detection list
    boxes = result.boxes
    counts = {name: 0 for name in CLASS_NAMES}
    detections = []

    if boxes is not None and len(boxes) > 0:
        class_ids = boxes.cls.cpu().numpy().astype(int)
        confidences = boxes.conf.cpu().numpy()
        xyxy = boxes.xyxy.cpu().numpy()

        for cls_id, score, box in zip(class_ids, confidences, xyxy):
            name = CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else str(cls_id)
            counts[name] = counts.get(name, 0) + 1
            detections.append(
                {
                    "class": name,
                    "confidence": round(float(score), 3),
                    "box": [round(float(v), 1) for v in box],
                }
            )

    summary = [
        {"item": name, "count": counts[name], "detected": counts[name] > 0}
        for name in CLASS_NAMES
    ]

    return {
        "annotated_image": f"data:image/png;base64,{annotated_b64}",
        "total_detections": len(detections),
        "summary": summary,
        "detections": detections,
    }
