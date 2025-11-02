from pydantic import BaseModel, Field
from typing import List, Optional

class PredictionOutput(BaseModel):
    predicted_price: float
    base_price: float
    adjustment_percentage: float
    adjustment_euro: float

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
    insurance_price: Optional[float] = Field(None, description="Price of the insurance in CHF (optional)")

class RuleItem(BaseModel):
    BMI: float
    AGE: int
    SMOKER: bool
    PRACTICE_SPORT: bool
    DECISION: str
    COMMENT: str
    
class RuleUpdate(BaseModel):
    rules: list[RuleItem]