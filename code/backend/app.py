from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import base64
from openai import OpenAI
from pydantic import BaseModel, ValidationError
from typing import Optional
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from decide import predict_decision,replace_rule_table
from price_predictor import insurance_model
from contextlib import asynccontextmanager
from schemas import FormData
from helpers import get_insurance_data
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

# Initialize OpenAI client
client = OpenAI()

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