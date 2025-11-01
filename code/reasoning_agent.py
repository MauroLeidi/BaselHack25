import joblib
import pandas as pd
import numpy as np
import shap
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class InsuranceDecisionExplainer:
    """
    Explains insurance decisions using Random Forest predictions and SHAP values.
    """
    
    def __init__(self, model_path="../assets/predictor_decision.joblib", 
                 encoder_path="../assets/label_encoder.joblib",
                 openai_api_key=None):
        """
        Initialize the explainer by loading the trained model and encoder.
        
        Args:
            model_path: Path to the saved Random Forest model
            encoder_path: Path to the saved LabelEncoder
            openai_api_key: OpenAI API key (or set via OPENAI_API_KEY env var)
        """
        self.clf = joblib.load(model_path)
        self.le = joblib.load(encoder_path)
        self.explainer = shap.TreeExplainer(self.clf)
        self.client = OpenAI(api_key=openai_api_key) if openai_api_key else OpenAI()
        
    def predict_with_explanation(self, BMI, AGE, SMOKER, PRACTICE_SPORT, 
                                 use_gpt=True, gpt_model="gpt-4"):
        """
        Predict insurance decision and generate explanation using SHAP + GPT.
        
        Args:
            BMI: Body Mass Index (float)
            AGE: Age in years (int)
            SMOKER: Whether person smokes (bool or int: 0/1)
            PRACTICE_SPORT: Whether person practices sports (bool or int: 0/1)
            use_gpt: Whether to generate GPT explanation (default: True)
            gpt_model: Which GPT model to use (default: "gpt-4")
            
        Returns:
            dict with keys:
                - decision: predicted decision label (str)
                - probability: confidence score (float)
                - all_probabilities: dict of all class probabilities
                - shap_values: dict of feature contributions
                - top_features: list of (feature, shap_value) tuples sorted by importance
                - explanation: GPT-generated explanation (str, if use_gpt=True)
        """
        # Prepare input
        test_sample = pd.DataFrame({
            "BMI": [float(BMI)],
            "AGE": [int(AGE)],
            "SMOKER": [int(SMOKER)],
            "PRACTICE_SPORT": [int(PRACTICE_SPORT)]
        })
        
        # Get prediction
        pred_proba = self.clf.predict_proba(test_sample)[0]
        pred_label = self.clf.predict(test_sample)[0]
        pred_decision = self.le.inverse_transform([pred_label])[0]
        
        # Compute SHAP values
        shap_values = self.explainer.shap_values(test_sample)
        
        # Extract SHAP values for predicted class
        pred_class_idx = int(pred_label)
        sv = shap_values[0, :, pred_class_idx]
        
        # Create feature importance dict
        shap_dict = {
            "BMI": float(sv[0]),
            "AGE": float(sv[1]),
            "SMOKER": float(sv[2]),
            "PRACTICE_SPORT": float(sv[3])
        }
        
        # Sort by absolute importance
        top_features = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
        
        # Build result
        result = {
            "decision": pred_decision,
            "probability": float(pred_proba[pred_class_idx]),
            "all_probabilities": dict(zip(self.le.classes_, [float(p) for p in pred_proba])),
            "shap_values": shap_dict,
            "top_features": top_features,
            "input_values": {
                "BMI": float(BMI),
                "AGE": int(AGE),
                "SMOKER": bool(SMOKER),
                "PRACTICE_SPORT": bool(PRACTICE_SPORT)
            }
        }
        
        # Generate GPT explanation if requested
        if use_gpt:
            explanation = self._generate_gpt_explanation(result, gpt_model)
            result["explanation"] = explanation
        
        return result
    
    def _generate_gpt_explanation(self, result, model="gpt-4"):
        """
        Generate a natural language explanation using GPT based on SHAP values.
        """
        decision = result["decision"]
        input_vals = result["input_values"]
        shap_vals = result["shap_values"]
        top_features = result["top_features"]
        
        # Format SHAP contributions for GPT
        shap_explanation = []
        for feat, val in top_features:
            direction = "increases" if val > 0 else "decreases"
            shap_explanation.append(f"  - {feat} (value: {input_vals[feat]}): SHAP = {val:+.4f} ({direction} likelihood)")
        
        shap_text = "\n".join(shap_explanation)
        
        prompt = f"""You are an insurance underwriter explaining a decision to a client.

Decision: {decision}
Confidence: {result['probability']:.1%}

Applicant Profile:
- BMI: {input_vals['BMI']:.1f}
- Age: {input_vals['AGE']} years
- Smoker: {'Yes' if input_vals['SMOKER'] else 'No'}
- Practices Sport: {'Yes' if input_vals['PRACTICE_SPORT'] else 'No'}

SHAP Feature Contributions (most important first):
{shap_text}

Based on these SHAP values, provide a brief, professional explanation (1-2 sentences) for why this decision was made. Focus on the most important contributing factors.

Example styles:
- "Rejected due to high-risk combination of obesity (BMI > 30) and smoking"
- "Accepted with extra charge: smoker without regular physical activity increases premium risk"
- "Standard acceptance: young, healthy profile with active lifestyle"
- "Requires additional information: borderline risk factors need medical review"

Your explanation:"""
        print(prompt)

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a concise insurance underwriter. Provide brief, factual explanations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=100
            )
            
            explanation = response.choices[0].message.content.strip()
            return explanation
            
        except Exception as e:
            return f"Error generating explanation: {str(e)}"

if __name__ == "__main__":
    # Initialize explainer
    explainer = InsuranceDecisionExplainer(
        model_path="../assets/predictor_decision.joblib",
        encoder_path="../assets/label_encoder.joblib"
    )
    
    # Example 1: Single prediction
    print("="*80)
    print("Example 1: High-risk case (BMI=28, AGE=51, SMOKER=True)")
    print("="*80)
    
    result = explainer.predict_with_explanation(
        BMI=28,
        AGE=51,
        SMOKER=1,
        PRACTICE_SPORT=1,
        use_gpt=True
    )
    
    print(f"\nDecision: {result['decision']}")
    print(f"Confidence: {result['probability']:.1%}")
    print(f"\nTop Contributing Features:")
    for feat, shap_val in result['top_features']:
        print(f"  {feat:20s}: {shap_val:+.4f}")
    
    if 'explanation' in result:
        print(f"\nGPT Explanation:\n  {result['explanation']}")