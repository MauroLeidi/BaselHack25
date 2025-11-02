"""
main.py - Core FastAPI

This module defines the primary API endpoints for the insurance application. 
It orchestrates the various components, including:
1. **Data Extraction:** Processing form data from uploaded images (using a helper agent).
2. **Decision Making:** Determining the underwriting decision (Accept/Reject) using 
   the adaptive rules engine (`decide`).
3. **Price Prediction:** Calculating the insurance premium adjustment using a 
   pre-trained machine learning model (`price_predictor`).
4. **Explanation:** Generating detailed, natural-language reasoning for the decision 
   via a reasoning agent (SHAP + GPT).

The service is initialized with a `lifespan` manager to ensure the ML model is 
loaded before the server starts.

Endpoints:
- `/process`: Handles image upload and data extraction.
- `/predict`: Accepts standardized form data and returns the decision, price 
  adjustment, and explanation.
- `/admin/update_rules`: Administrative endpoint for rule table management.
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError
from typing import Optional
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from decide import predict_decision,replace_rule_table
from price_predictor import insurance_model
from contextlib import asynccontextmanager
from schemas import FormData
from helpers import extract_form_fields_from_image, get_insurance_data
from reasoning_agent import explain_insurance_decision
from schemas import RuleUpdate

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading model")
    insurance_model.load_model()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     
    allow_credentials=True,            
    allow_methods=["*"],              
    allow_headers=["*"],
)
@app.post("/process")
async def process_form(
    file: Optional[UploadFile] = File(None, description="Image file (required if type='image')"),
    product: Optional[str] = Form(None, description="Product type")
):
    """
    Process form data - either extract from image or return provided JSON
    
    Parameters:
    - type: 'image' or 'online'
    - file: Image file upload (required if type='image')
    - data: JSON string with form data (required if type='online')
    
    Returns:
    - JSON response with extracted or provided form data
    """
    try:
        # Check if file is provided
        if not file:
            raise HTTPException(status_code=400, detail="Image file is required when type='image'")
        
        # Validate file type
        allowed_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')
        if not file.filename.lower().endswith(allowed_extensions):
            raise HTTPException(status_code=400, detail=f"File must be an image ({', '.join(allowed_extensions)})")
        
        # Read image bytes
        image_bytes = await file.read()
        
        # Extract form fields from image
        try:
            form_data = extract_form_fields_from_image(image_bytes)
        
            return JSONResponse(content={
                "status": "success",
                "source": "image_extraction",
                "data": form_data.model_dump()
            })
        except ValidationError as ve:
            return JSONResponse(status_code=400, content={
                "status": "error",
                "message": "Failed to validate extracted data",
                "errors": ve.errors()
            })
        
    except Exception as e:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid request"})
    
@app.post("/predict")
async def predict(form_data: FormData):
    # get insurance values
    insurance_data = get_insurance_data(form_data)

    # get prediction
    print("Getting prediction..")
    decision, comment = predict_decision(insurance_data)

    # get reasoning via shapey values
    print("Getting explanation for decision..")
    reasoning_advanced = explain_insurance_decision(insurance_data)

    # predict adjustment price change
    print("Getting price adjustment..")
    prediction_output = insurance_model.calculate_price_adjustment(insurance_data)
    
    return JSONResponse(content={
        "status": "success",
        "decision": decision,
        "reason": comment,
        "prediction_output": prediction_output.model_dump(),
        "reasoning_advanced": reasoning_advanced
    })


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.post("/admin/update_rules")
def update_rules(update: RuleUpdate):
    try:
        # Convert list of RuleItem into a DataFrame
        nlines = replace_rule_table(update.rules)
        return {"status": "success", "message": f"Rule table updated. {nlines} rules now active."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update rules: {str(e)}")

# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)