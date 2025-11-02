"""
price_predictor.py - Insurance Premium Prediction Service

This module defines the `InsuranceModel` class responsible for managing and 
serving the machine learning model used for insurance premium prediction and 
adjustment calculation.

The model calculates a predicted price based on customer features (Age, BMI, 
Smoker status, Sport practice) and determines the percentage and euro adjustment 
relative to a provided base price.

Key Components:
- `InsuranceModel`: Handles loading the Random Forest model and a base price 
  constant using `joblib`.
- `calculate_price_adjustment`: The core method for predicting the final premium 
  and computing the adjustment metrics.
"""

from schemas import PredictionOutput
from typing import Optional
import numpy as np
import joblib

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
            self.rf_model = joblib.load(f"../../assets/{self.model_path}")
            self.base_price = joblib.load(f"../../assets/{self.base_price_path}")
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
        base_price = data["PRICE_INSURANCE"]
        
        # Prediction
        predicted_price = self.rf_model.predict(input_data)[0]

        
        # Calculate adjustment
        difference = predicted_price - base_price

        if difference >= 0:
            adjustment_percentage = (difference / base_price) * 100
        else:
            adjustment_percentage = 0
        
        return PredictionOutput(
            predicted_price=round(predicted_price, 2),
            base_price=round(float(base_price), 2),
            adjustment_percentage=round(adjustment_percentage, 2),
            adjustment_euro=round(difference, 2)
        )

# =========================
# Global instance (singleton)
# =========================
insurance_model = InsuranceModel()