<div align="center">

<img src="https://img.shields.io/badge/EWS-Early%20Warning%20System-C9A84C?style=for-the-badge&labelColor=0A1628" alt="EWS"/>

# Early Warning System
### Student Dropout Prediction Dashboard

A full-stack machine learning application that predicts which students are at risk of dropping out — using attendance and learning score data to flag at-risk students **before** they drop out.

[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![CatBoost](https://img.shields.io/badge/CatBoost-1.2+-yellow?style=flat-square)](https://catboost.ai)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## What is this?

The EWS (Early Warning System) is a data-driven tool built for education administrators and policymakers. You upload a student data file (Excel or CSV), and the system uses a trained machine learning model to assign every student a **dropout probability score** and classify them as **High**, **Medium**, or **Low** risk.

The model was trained on historical student data and learned that low attendance and low learning scores together are strong predictors of dropout. It uses an ensemble of two algorithms (CatBoost + HistGradientBoosting) for better accuracy than either alone.

**The goal:** identify at-risk students early enough that intervention is still possible.

---

## Screenshots

| Dashboard | Students | Schools |
|---|---|---|
| Upload data, see summary cards and charts | Browse every student with risk scores | Compare schools side by side |

| Visualizer | Evaluation | Predict |
|---|---|---|
| Interactive dropout probability heatmap | Model accuracy charts (ROC, PR curves) | Instant single-student prediction |

---

## Repository Structure

```
Early-Warning-System/
│
├── backend/                          # FastAPI backend + ML models
│   ├── backend.py                    # Main API server (all endpoints)
│   ├── dropout_model_v3.py           # Model training script
│   ├── generate_eval.py              # Generates model_eval.csv for /eval endpoint
│   ├── dropout_model_catboost_v3.cbm # Trained CatBoost model
│   ├── dropout_ensemble_v3.pkl       # Ensemble: HistGBT + blend weight + threshold
│   ├── model_eval.csv                # Validation predictions for evaluation charts
│   ├── requirements.txt              # Python dependencies
│   ├── Test Data 1.xlsx              # Training data (historical student records)
│   └── Test Data 2 1.xlsx            # Training data (historical student records)
│
└── frontend/                         # React + Vite dashboard
    ├── src/
    │   ├── services/                 # API calls (fetch wrapper + endpoints)
    │   ├── context/                  # Global state (DataContext)
    │   ├── hooks/                    # useDebounce, usePagination, useSort
    │   ├── utils/                    # formatters, validators, constants
    │   ├── components/
    │   │   ├── common/               # ErrorBoundary, Badge, EmptyState, Spinner
    │   │   ├── layout/               # Sidebar, Header, Layout
    │   │   ├── dashboard/            # FileUpload, KPICards, charts
    │   │   ├── students/             # StudentTable
    │   │   ├── schools/              # SchoolTable
    │   │   ├── visualizer/           # D3 Heatmap, SliceChart, controls
    │   │   ├── evaluation/           # ROCCurve, PRCurve, ThresholdSweep
    │   │   └── predict/              # PredictForm, ProbabilityGauge
    │   ├── pages/                    # One file per route (lazy-loaded)
    │   ├── App.jsx                   # Router + lazy loading + error boundaries
    │   └── index.css                 # Design tokens (all CSS variables)
    ├── package.json
    ├── vite.config.js
    ├── Dockerfile
    └── nginx.conf
```

---

## Tech Stack

### Backend
| | |
|---|---|
| **Framework** | FastAPI |
| **ML Models** | CatBoost + HistGradientBoosting (scikit-learn) |
| **Data** | pandas, numpy |
| **Serving** | Uvicorn |

### Frontend
| | |
|---|---|
| **Framework** | React 19 + Vite 6 |
| **Routing** | React Router v7 |
| **Charts** | Recharts (all charts) + D3 v7 (heatmap only) |
| **Icons** | Lucide React |
| **Styling** | Vanilla CSS with CSS custom properties |
| **Testing** | Vitest + React Testing Library |

---

## Getting Started

### Prerequisites
- Python 3.11 or 3.12
- Node.js 20+
- Git

### 1. Clone the repo

```bash
git clone https://github.com/RagnarokAnsh/Early-Warning-System.git
cd Early-Warning-System
```

### 2. Start the backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn backend:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
Interactive API docs at `http://localhost:8000/docs`

### 3. Start the frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The dashboard will open at `http://localhost:5173`

---

## Using the App

1. **Open** `http://localhost:5173` in your browser
2. **Go to Dashboard** — drag and drop your Excel/CSV student data file onto the upload zone
3. **Set the threshold** using the slider (default 0.41 — lower = flag more students, higher = flag fewer)
4. **Click "Upload & Predict"** — the model scores every student instantly
5. **Explore the results** across six pages:

| Page | What you can do |
|---|---|
| **Dashboard** | Overview — summary cards, risk donut, attendance bars, probability histogram, top at-risk schools |
| **Students** | Search by school, filter by risk tier, sort any column, export to CSV |
| **Schools** | Compare all schools, click a row to drill into that school's students |
| **Visualizer** | Explore the 2D dropout probability heatmap and 1-D slice charts |
| **Evaluation** | View model accuracy — ROC curve, Precision-Recall curve, threshold sweep, feature importance |
| **Predict** | Type in any attendance % and learning score % to get an instant risk prediction |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Check if the backend and models are loaded |
| `GET` | `/model-info` | Feature importances, blend weights, threshold |
| `POST` | `/predict` | Single student prediction `{attendance, learning_score, threshold}` |
| `GET` | `/surface` | 50×50 probability grid for the heatmap |
| `GET` | `/surface/slice` | 1-D probability curve (one variable fixed) |
| `GET` | `/eval` | ROC curve, PR curve, threshold sweep data |
| `POST` | `/bulk` | Upload Excel/CSV → all student predictions + dashboard data |

---

## The Machine Learning Model

### How it works

The model takes two inputs per student:
- **Attendance %** from the previous academic year
- **Learning Score %** from the previous academic year

These are transformed into **8 features** through engineering:

| Feature | Description |
|---|---|
| `attendance` | Raw attendance % |
| `learning_score` | Raw learning score (school-level median imputed if missing) |
| `ls_missing` | Was learning score absent? (1 = yes — itself a risk signal) |
| `inv_att` | 1 ÷ (attendance + 1) — captures non-linearity at very low attendance |
| `att_x_ls` | Attendance × Learning Score — joint low values are disproportionately risky |
| `att_low` | Flag: attendance below 25% |
| `att_very_low` | Flag: attendance below 10% |
| `ls_low` | Flag: learning score below 60% |

### Two models, blended

```
Final probability = 0.59 × CatBoost + 0.41 × HistGradientBoosting
```

The blend ratio (59/41) was found automatically by maximising Average Precision Score on a held-out validation set.

### Performance

| Metric | Value |
|---|---|
| AUC-ROC | **0.7935** (vs 0.50 random baseline) |
| AUPRC | **0.4590** (vs 0.14 random baseline) |
| Optimal Threshold | **0.635** |
| Training data | ~36,784 students |
| Dropout rate in data | ~14% |

### Retraining the model

If you have new training data, simply run:

```bash
cd backend
python dropout_model_v3.py        # retrains and saves new .cbm and .pkl
python generate_eval.py           # regenerates model_eval.csv
# restart the backend server — models reload automatically
```

---

## Environment Variables

Create a `.env.development` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=development
VITE_APP_TITLE=EWS Dashboard
```

For production, create `.env.production` with your deployed backend URL.

---

## Running Tests

```bash
cd frontend
npm test              # run all tests once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

---

## Production Build

### Frontend only

```bash
cd frontend
npm run build         # outputs optimised files to frontend/dist/
npm run preview       # test the production build locally
```

### Docker (Frontend)

```bash
cd frontend
docker build -t ews-frontend .
docker run -p 80:80 ews-frontend
```

The Docker container uses nginx to serve the app with:
- SPA routing (page refresh works on any route)
- Long-lived caching for static assets
- Gzip compression enabled

---

## Data Format

Your uploaded Excel or CSV file needs these columns:

| Column | Type | Required |
|---|---|---|
| `Sch_id` | Text | ✅ Yes |
| `Attendance % in 2023-24` | Number (0–100) | ✅ Yes |
| `Learning Score in % in 2023-24` | Number (0–100) | ✅ Yes |

> **Note:** The backend also accepts files with columns loosely named (containing "attend" or "learn"/"score") as a fallback if your column names are slightly different.

---

## Understanding the Output

Every student gets:

- **Dropout Probability** — a number between 0 and 1 (e.g. `0.812`)
- **Prediction** — `Dropout` if probability ≥ threshold, else `Promoted`
- **Risk Tier** — based on probability relative to threshold:

| Tier | Condition | Meaning |
|---|---|---|
| 🔴 High | prob ≥ threshold | Predicted to drop out — intervene now |
| 🟡 Medium | prob ≥ threshold × 0.6 | Borderline — monitor closely |
| 🟢 Low | prob < threshold × 0.6 | Likely fine |

---

## Project Structure Decisions

- **No Tailwind** — full control over the institutional government aesthetic using CSS custom properties
- **D3 only for heatmap** — loaded dynamically on the Visualizer page only; other pages are not affected
- **sessionStorage for state** — uploaded data survives navigation between pages but clears when the tab closes
- **School-level imputation** — missing learning scores are filled using the school's median, not the global median, matching the training pipeline exactly
- **Threshold stored in model** — the optimal threshold (0.635) lives in `dropout_ensemble_v3.pkl` and is served via `/model-info`, so the frontend is always in sync with what the model was trained to use

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

Built with FastAPI · React · CatBoost · D3 · Recharts

</div>
