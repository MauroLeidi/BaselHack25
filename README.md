# BaselHack25 INSPECT AND UNDERWRITE

This repository contains the backend API for BaselHack25, including health decision rules, form processing, and AI-assisted data extraction.

## Table of Contents

* [Requirements](#requirements)
* [Setup with Conda](#setup-with-conda)
* [Running the API](#running-the-api)
* [Endpoints](#endpoints)

---

## Requirements

* [Anaconda](https://www.anaconda.com/) or [Miniconda](https://docs.conda.io/en/latest/miniconda.html)
* Python 3.12 (managed via Conda)

---

## Setup with Conda

1. **Clone the repository** (if not already done):

```bash
git clone https://github.com/MauroLeidi/BaselHack25.git
cd BaselHack25/code
```

2. **Create the Conda environment from the YAML file**:

```bash
conda env create -f environment.yml
```

This will create a self-contained environment with all dependencies installed.

3. **Activate the environment**:

```bash
conda activate baselhack25
```

4. **Verify installation** (optional):

```bash
python -c "import pandas, numpy, fastapi, uvicorn; print('All imports successful')"
```

---

## Running the API

Once the environment is activated:

```bash
uvicorn api:app --reload
```

This will start the FastAPI server at:

```
http://127.0.0.1:8000
```

* `--reload` enables hot-reload for development.

---

## Endpoints

### 1. `/predict` – Predict decision from online form

**Method:** `POST`
**Body (JSON):**

```json
{
  "smokes": true,
  "cigarettes_per_day": 10,
  "height_cm": 175,
  "weight_kg": 70,
  "date_of_birth": "15.03.1988"
}
```

**Response:**

```json
{
  "status": "success",
  "decision": "accepted",
  "reason": "Nothing special: healthy lifestyle"
}
```

---

### 2. `/process` – Process image or online form

* **Method:** `POST`
* **Form Data:**

  * `type`: `"image"` or `"online"`
  * `file`: image file (required if type="image")
  * `data`: JSON string (required if type="online")

---

### 3. `/admin/update_rules` – Update rules table

**Method:** `POST`
**Body (JSON):**

```json
{
  "rules": [
    {
      "BMI": 22,
      "AGE": 25,
      "SMOKER": false,
      "PRACTICE_SPORT": true,
      "DECISION": "accepted",
      "COMMENT": "Nothing special"
    },
    {
      "BMI": 30,
      "AGE": 45,
      "SMOKER": true,
      "PRACTICE_SPORT": false,
      "DECISION": "accepted with extra charge",
      "COMMENT": "Higher risk: middle-aged smoker, inactive"
    }
  ]
}
```

* Replaces the entire rule table in memory.

---

### 4. `/health` – Health check

**Method:** `GET`
**Response:**

```json
{
  "status": "healthy"
}
```
