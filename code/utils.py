# utils.py
import joblib
import numpy as np
from pydantic import BaseModel, Field
from typing import Optional

# =========================
# Schema di input
# =========================
class InsuranceInput(BaseModel):
    eta: int = Field(..., ge=18, le=100, description="Età del cliente")
    bmi: float = Field(..., ge=10, le=60, description="Indice di massa corporea")
    fumo: int = Field(..., ge=0, le=1, description="Fumatore: 0=No, 1=Sì")
    sport: int = Field(..., ge=0, le=1, description="Pratica sport: 0=No, 1=Sì")

    class Config:
        json_schema_extra = {
            "example": {
                "eta": 35,
                "bmi": 27.5,
                "fumo": 0,
                "sport": 1
            }
        }

class PredictionOutput(BaseModel):
    prezzo_predetto: float
    prezzo_base: float
    aggiustamento_percentuale: float
    aggiustamento_euro: float


# =========================
# Classe per gestire il modello
# =========================
class InsuranceModel:
    def __init__(self, model_path: str = "insurance_model.joblib", 
                 base_price_path: str = "base_price.joblib"):
        self.model_path = model_path
        self.base_price_path = base_price_path
        self.rf_model: Optional[object] = None
        self.base_price: Optional[float] = None
        
    def load_model(self) -> bool:
        """Carica il modello e il prezzo base"""
        try:
            self.rf_model = joblib.load(f"../assets/{self.model_path}")
            self.base_price = joblib.load(f"../assets/{self.base_price_path}")
            print("✅ Modello caricato con successo")
            return True
        except Exception as e:
            print(f"❌ Errore nel caricamento del modello: {e}")
            self.rf_model = None
            self.base_price = None
            return False
    
    def is_loaded(self) -> bool:
        """Verifica se il modello è caricato"""
        return self.rf_model is not None and self.base_price is not None
    
    def calculate_price_adjustment(self, data: InsuranceInput) -> PredictionOutput:
        """
        Calcola il prezzo predetto e l'aggiustamento percentuale.
        
        Args:
            data: Dati del cliente (eta, bmi, fumo, sport)
        
        Returns:
            PredictionOutput con prezzo predetto e aggiustamenti
            
        Raises:
            ValueError: Se il modello non è caricato
        """
        if not self.is_loaded():
            raise ValueError("Modello non caricato. Eseguire load_model() prima.")
        
        # Prepara i dati per la predizione
        input_data = np.array([[data.eta, data.bmi, data.fumo, data.sport]])
        
        # Predizione
        prezzo_predetto = self.rf_model.predict(input_data)[0]
        
        # Calcolo aggiustamento
        differenza = prezzo_predetto - self.base_price

        if differenza >= 0:
            aggiustamento_percentuale = (differenza / self.base_price) * 100
        else:
            aggiustamento_percentuale = 0
        
        return PredictionOutput(
            prezzo_predetto=round(prezzo_predetto, 2),
            prezzo_base=round(float(self.base_price), 2),
            aggiustamento_percentuale=round(aggiustamento_percentuale, 2),
            aggiustamento_euro=round(differenza, 2)
        )


# =========================
# Istanza globale (singleton)
# =========================
insurance_model = InsuranceModel()