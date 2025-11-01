from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import base64
from openai import OpenAI
from pydantic import BaseModel, Field, field_validator, ValidationError
from typing import List, Optional
import json
from dotenv import load_dotenv
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware # 1. Import Middleware
from decide import predict_decision,replace_rule_table

load_dotenv()


app = FastAPI(title="Form Processing API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Permette tutte le origini
    allow_credentials=True,             # Permette cookies, Authorization headers, ecc.
    allow_methods=["*"],                # Permette tutti i metodi (GET, POST, PUT, DELETE, OPTIONS, etc.)
    allow_headers=["*"],                # Permette tutti gli header (incluso Content-Type)
)

# Initialize OpenAI client
client = OpenAI()

# Define your Pydantic schema for the form fields
class FormData(BaseModel):
    """Schema for extracting health-related form fields from the image"""
    first_name: Optional[str] = Field(None, description="First name of the person")
    last_name: Optional[str] = Field(None, description="Last name of the person")
    smokes: bool = Field(description="Whether the person smokes (Yes/No, True/False)")
    cigarettes_per_day: Optional[int] = Field(None, description="Number of cigarettes smoked per day. None if doesn't smoke or not specified")
    height_cm: Optional[float] = Field(None, description="Height in centimeters")
    weight_kg: Optional[float] = Field(None, description="Weight in kilograms")
    date_of_birth: Optional[str] = Field(None, description="The birth year of the person in format DD.MM.YYYY")
    sports: Optional[List[str]] = Field(None, description="List of sports the person practices")

# -------------------------------------------------------------------------------
# Pydantic model for rules, useful when rules updates are made from the frontend
# -------------------------------------------------------------------------------
class RuleItem(BaseModel):
    BMI: float
    AGE: int
    SMOKER: bool
    PRACTICE_SPORT: bool
    DECISION: str
    COMMENT: str
    
class RuleUpdate(BaseModel):
    rules: list[RuleItem]

def extract_form_fields_from_image(image_bytes: bytes) -> FormData:
    """
    Extract form fields from an image using OpenAI's structured outputs
    
    Args:
        image_bytes: Image file bytes
        
    Returns:
        FormData object with extracted fields
    """
    # Encode the image
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    # Make API call with structured output
    response = client.responses.parse(
        model="gpt-4o",  # Vision-capable model
        input=[
            {
                "role": "system",
                "content": "You are a medical form extraction assistant. Extract health-related information from the form. For height and weight, convert to centimeters and kilograms if given in other units. If smoking status is 'No' or unchecked, set cigarettes_per_day to None."
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": "Please extract all the form fields from this image."
                    },
                    {
                        "type": "input_image",
                        "image_url": f"data:image/jpeg;base64,{base64_image}"
                    }
                ]
            }
        ],
        text_format=FormData
    )
    
    # Return parsed structured data
    return response.output_parsed


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
    decision, comment = predict_decision(form_data.dict())
    return JSONResponse(content={
        "status": "success",
        "decision": decision,
        "reason": comment
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