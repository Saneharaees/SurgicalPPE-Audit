# Surgical PPE Audit System

YOLOv8-based PPE (Personal Protective Equipment) detection app — separate
backend (FastAPI) and frontend (React), with the trained model kept in its
own folder.

## 📁 Project Structure

```
SurgicalPPE-Audit/
├── model/              ← Put your trained best.pt here
│   └── best.pt
├── backend/              ← FastAPI inference server
│   ├── app.py
│   └── requirements.txt
└── frontend/             ← React UI
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.js
        ├── App.css
        ├── index.js
        └── index.css
```

## 🚀 Setup (VS Code)

### 1. Model
Copy your trained file into the `model` folder and rename it to `best.pt`:
```
SurgicalPPE-Audit/model/best.pt
```

### 2. Backend (FastAPI)
Open a terminal in VS Code:
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```
Backend will run at: **http://localhost:8000**
Test it: open http://localhost:8000/health in browser — should show `"model_loaded": true`.

### 3. Frontend (React)
Open a **second** terminal:
```bash
cd frontend
npm install
npm start
```
Frontend will run at: **http://localhost:3000**

### 4. Use the App
- Open http://localhost:3000 in your browser
- Upload a surgery scene image
- Adjust Confidence / IOU sliders if needed
- Click **Analyze Scene** → see annotated image + PPE inventory table

## 🔧 Notes
- Backend and frontend run as two separate servers — keep both terminals running.
- If you deploy later, update `API_URL` in `frontend/src/App.js` to your backend's live URL.
- CORS is open (`*`) for local development — restrict it before production deployment.
