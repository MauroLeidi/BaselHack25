# BaselHack25 INSPECT AND UNDERWRITE

# Insurance Underwriting & Premium Prediction System

A comprehensive AI-powered insurance underwriting platform that combines machine learning, rule-based decision engines, and explainable AI to automate insurance application processing and premium calculation.

## 🎯 Overview

This system provides end-to-end automation for insurance underwriting, featuring:

- **Intelligent Form Extraction**: Automated data extraction from scanned application forms using vision language models
- **Hybrid Decision Engine**: Combines human operational rules with adaptive learned rules using reinforcement learning
- **ML-Powered Premium Prediction**: Random Forest model for accurate premium calculations
- **Explainable AI**: SHAP values + GPT-4 for human-readable decision explanations
- **Monte Carlo Simulation**: Understanding risk and trends from the data
- **Multilingual Support**: Full internationalization (English, German, French, Italian)

## 🖼️ Application Screenshot

![BaselHack25 App Screenshot Top](assets/app_screen_top.png)
![BaselHack25 App Screenshot Bottom](assets/app_screen_bottom.png)

## 🏗️ Project Structure

### Backend (FastAPI)

```
code/backend/
├── app.py                 # Main API endpoints & orchestration
├── decide.py              # Hybrid rules engine (Operational + Learned)
├── price_predictor.py     # ML model for premium prediction
├── reasoning_agent.py     # SHAP + GPT explanation generator
├── helpers.py             # Synthetic data generation & form extraction
└── schemas.py             # Pydantic data models
```

**File Descriptions:**

- **`app.py`**: Core FastAPI application defining three main endpoints: `/process` for image-based form extraction, `/predict` for underwriting decisions, pricing, and explainability of decision, and `/admin/update_rules` for rule management. Orchestrates all backend components.

- **`decide.py`**: Implements a two-tier decision system combining human operational rules (immediate rejections, risk tiers) with a similarity-based learned rules table stored in CSV. Supports continuous learning via the `LEARN_FLAG` (the reinforcement learning part).

- **`price_predictor.py`**: Manages the Random Forest regression model for premium prediction (based on synthetic historical data). Calculates predicted prices and adjustment percentages/amounts relative to base premiums.

- **`reasoning_agent.py`**: Provides explainable AI using SHAP values to quantify feature contributions, then generates natural language explanations via GPT-4 for underwriting decisions.

- **`helpers.py`**: Contains utilities for generating synthetic Swiss population data based on demographic statistics ([federal statistical office](https://www.bfs.admin.ch/bfs/en/home.html)), extracting structured form data from images using OpenAI Vision API, and transforming raw inputs into model-ready features.

- **`schemas.py`**: Defines Pydantic models for API request/response validation including `FormData`, `PredictionOutput`, and `RuleUpdate`.

### Frontend (Next.js)
```
code/frontend/
├── .next/                     # Next.js build output (auto-generated)
├── app/                       # App Router structure
│   ├── [locale]/              # Dynamic route for multilingual support
│   │   ├── admin/             # Admin dashboard pages
│   │   │   └── page.tsx
│   │   ├── form/              # User input form (health, insurance, etc.)
│   │   │   └── page.tsx
│   │   ├── result/            # Result/summary after form submission
│   │   │   └── page.tsx
│   │   ├── layout.tsx         # Shared layout per locale
│   │   └── page.tsx           # Root localized landing page
│   ├── components/            # components
│   │   ├── admin/             # Admin-specific components
│   │   ├── form/              # Form-related fields & inputs
│   ├── locales/               # Translation files (Next-Intl)
│   │   ├── de.json
│   │   ├── en.json
│   │   ├── fr.json
│   │   └── it.json
│   ├── page.tsx               # Root homepage
│   └── providers.tsx          # Context providers (Mantine, Intl, etc.)
```

The Frontend is coded in ReactJs with Mantine and Tabler Iconography.

### ML Models & Notebooks

```
code/notebooks/
├── premium_predictor.ipynb    # Random Forest premium prediction model
└── rules_handling.ipynb       # Rule engine development & testing (reiforcement learning training)
```

**Notebook Descriptions:**

- **`premium_predictor.ipynb`**: Develops a Random Forest regression model for insurance premium prediction using synthetic Swiss population data. Features include age, BMI, smoking status, and sports activity, with pricing logic that applies surcharges for smokers and discounts for active individuals (resembling a bit the real historical data from insurances).

- **`rules_handling.ipynb`**: Demonstrates the rule-based override system that applies business logic on top of ML predictions. Shows how operational rules can adjust predicted premiums based on specific conditions (e.g., non-smoker rewards, threshold-based pricing). This is where the reinforcement learning comes into play by learning from errors and correction.

## 📊 API Endpoints

### `POST /process`
Extract structured form data from uploaded image files.

### `POST /predict`
Get underwriting decision, premium calculation, and detailed reasoning for an application.

### `POST /admin/update_rules`
Bulk update the learned rules table with new decision patterns.

### `GET /health`
Health check endpoint for monitoring.

## 🛠️ Setup & Installation

### Backend Setup
```bash
cd code/backend

# Create and activate the Conda environment from the YAML file
conda env create -f environment.yml
conda activate backend

# Set your environment variables
echo "OPENAI_API_KEY=your_key_here" > .env

# Run the FastAPI server
uvicorn app:app --reload --port 8000

```

### Frontend Setup
```bash
cd code/frontend
npm install
npm run dev
```

### Required Assets
Place in `assets/` directory:
- `insurance_model.joblib` - Premium prediction model
- `base_price.joblib` - Mean training price
- `predictor_decision.joblib` - Decision classifier
- `label_encoder.joblib` - Outcome encoder
- `learned_rules.csv` - Adaptive rule table
