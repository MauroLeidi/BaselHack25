from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import base64
from openai import OpenAI
from pydantic import BaseModel, Field, field_validator, ValidationError
from typing import Optional
import json
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()


app = FastAPI(title="Form Processing API")

# Initialize OpenAI client
client = OpenAI()

# Define your Pydantic schema for the form fields
class FormData(BaseModel):
    """Schema for extracting health-related form fields from the image"""
    smokes: bool = Field(description="Whether the person smokes (Yes/No, True/False)")
    cigarettes_per_day: Optional[int] = Field(None, description="Number of cigarettes smoked per day. None if doesn't smoke or not specified")
    height_cm: Optional[float] = Field(None, description="Height in centimeters")
    weight_kg: Optional[float] = Field(None, description="Weight in kilograms")
    date_of_birth: Optional[str] = Field(None, description="The birth year of the person in format DD.MM.YYYY")

    @field_validator('cigarettes_per_day')
    @classmethod
    def validate_cigarettes(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError('cigarettes_per_day must be 0 or greater')
            if v > 30:
                raise ValueError('cigarettes_per_day cannot exceed 30')
        return v
    
    @field_validator('height_cm')
    @classmethod
    def validate_height(cls, v):
        if v is not None:
            if v < 50:
                raise ValueError('height_cm must be at least 50 cm')
            if v > 250:
                raise ValueError('height_cm cannot exceed 250 cm')
        return v
    
    @field_validator('weight_kg')
    @classmethod
    def validate_weight(cls, v):
        if v is not None:
            if v < 2:
                raise ValueError('weight_kg must be at least 2 kg')
            if v > 300:
                raise ValueError('weight_kg cannot exceed 300 kg')
        return v
    
    @field_validator('date_of_birth')
    @classmethod
    def validate_date_of_birth(cls, v):
        if v is not None:
            try:
                # Parse the date
                birth_date = datetime.strptime(v, '%d.%m.%Y')
                
                # Calculate age
                today = datetime.now()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                
                # Validate age range
                if age < 1:
                    raise ValueError('age must be at least 1 year')
                if age > 100:
                    raise ValueError('age cannot exceed 100 years')
                
                # Validate date is not in the future
                if birth_date > today:
                    raise ValueError('date_of_birth cannot be in the future')
                    
            except ValueError as e:
                if 'does not match format' in str(e):
                    raise ValueError('date_of_birth must be in format DD.MM.YYYY')
                raise
        return v

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
    type: str = Form(..., description="Type of input: 'image' or 'online'"),
    file: Optional[UploadFile] = File(None, description="Image file (required if type='image')"),
    data: Optional[str] = Form(None, description="JSON data (required if type='online')")
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
        if type.lower() == "image":
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
            except ValidationError as e:
                # Format validation errors nicely
                errors = []
                for error in e.errors():
                    field = error['loc'][0] if error['loc'] else 'unknown'
                    message = error['msg']
                    errors.append(f"{field}: {message}")
                
                raise HTTPException(
                    status_code=422, 
                    detail={
                        "message": "Validation failed for extracted data",
                        "errors": errors
                    }
                )
            
            return JSONResponse(content={
                "status": "success",
                "source": "image_extraction",
                "data": form_data.model_dump()
            })
        
        elif type.lower() == "online":
            # Check if data is provided
            if not data:
                raise HTTPException(status_code=400, detail="JSON data is required when type='online'")
            
            # Parse and validate JSON data
            try:
                json_data = json.loads(data)
                # Validate against FormData schema
                form_data = FormData(**json_data)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid JSON format")
            except ValidationError as e:
                # Format validation errors nicely
                errors = []
                for error in e.errors():
                    field = error['loc'][0] if error['loc'] else 'unknown'
                    message = error['msg']
                    errors.append(f"{field}: {message}")
                
                raise HTTPException(
                    status_code=422, 
                    detail={
                        "message": "Validation failed",
                        "errors": errors
                    }
                )
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid form data: {str(e)}")
            
            return JSONResponse(content={
                "status": "success",
                "source": "online_form",
                "data": form_data.model_dump()
            })
        
        else:
            raise HTTPException(status_code=400, detail="Type must be either 'image' or 'online'")
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
@app.post("/predict")
async def predict(form_data: FormData):
    # Esempio di elaborazione:
    message = f"Dati ricevuti con successo. Stato fumo: {'Sì' if form_data.smokes else 'No'}."
    
   # TODO MAURO
    return JSONResponse(content={
        "status": "success",
        "message": message,
        "received_data": form_data.model_dump()
    })


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)