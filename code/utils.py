# utils.py
import joblib
import numpy as np
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

def get_insurance_data(form_data: FormData):
    height_m = form_data.height_cm / 100
    BMI = round(form_data.weight_kg / (height_m ** 2), 1)
    birth_year = int(form_data.date_of_birth.split(".")[-1])
    current_year = 2025
    AGE = current_year - birth_year
    return {
        'BMI': BMI,
        'AGE': AGE,
        'SMOKER': form_data.smokes,
        'PRACTICE_SPORT': len(form_data.sports) > 0
    }




# =========================
# Class to manage the model
# =========================
class InsuranceModel:
    def __init__(self, model_path: str = "insurance_model.joblib", 
                 base_price_path: str = "base_price.joblib"):
        self.model_path = model_path
        self.base_price_path = base_price_path
        self.rf_model: Optional[object] = None
        self.base_price: Optional[float] = None
        
    def load_model(self) -> bool:
        """Loads the model and base price"""
        try:
            self.rf_model = joblib.load(f"../assets/{self.model_path}")
            self.base_price = joblib.load(f"../assets/{self.base_price_path}")
            print("✅ Model loaded successfully")
            return True
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.rf_model = None
            self.base_price = None
            return False
    
    def is_loaded(self) -> bool:
        """Checks if the model is loaded"""
        return self.rf_model is not None and self.base_price is not None
    
    def calculate_price_adjustment(self, data) -> PredictionOutput:
        """
        Calculates the predicted price and percentage adjustment.
        
        Args:
            data: Customer data (age, bmi, smoker, sport)
        
        Returns:
            PredictionOutput with predicted price and adjustments
            
        Raises:
            ValueError: If the model is not loaded
        """
        if not self.is_loaded():
            raise ValueError("Model not loaded. Run load_model() first.")
        
        # Prepare data for prediction
        input_data = np.array([[data["BMI"], data["AGE"], data["SMOKER"], data["PRACTICE_SPORT"]]])
        
        # Prediction
        predicted_price = self.rf_model.predict(input_data)[0]
        
        # Calculate adjustment
        difference = predicted_price - self.base_price

        if difference >= 0:
            adjustment_percentage = (difference / self.base_price) * 100
        else:
            adjustment_percentage = 0
        
        return PredictionOutput(
            predicted_price=round(predicted_price, 2),
            base_price=round(float(self.base_price), 2),
            adjustment_percentage=round(adjustment_percentage, 2),
            adjustment_euro=round(difference, 2)
        )

# =========================
# Global instance (singleton)
# =========================
insurance_model = InsuranceModel()