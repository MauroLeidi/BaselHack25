import numpy as np
import pandas as pd
import numpy as np
from schemas import FormData

def sample_population(n_samples=10_000, seed=42):
    """
    Generate a realistic Swiss population sample (all ages) 
    based on menuCH data and Swiss demographics.

    Returns:
        DataFrame with columns:
        ['AGE', 'SEX', 'HEIGHT_CM', 'WEIGHT_KG', 'BMI', 'SMOKER', 'PRACTICE_SPORT']
    """
    np.random.seed(seed)

    # -------------------------------------------------------------------------
    # 1. Swiss population age distribution (source: Swiss Federal Statistics)
    # -------------------------------------------------------------------------
    # Total adds up to 1.0
    age_groups = {
        '0-19': 0.20,
        '20-64': 0.60,
        '65-79': 0.14,
        '80+': 0.06
    }

    # Sex ratio roughly 50/50
    sex_categories = ['Male', 'Female']
    sex_probs = [0.5, 0.5]

    # -------------------------------------------------------------------------
    # 2. Sample age (continuous within each group)
    # -------------------------------------------------------------------------
    ages = []
    for _ in range(n_samples):
        group = np.random.choice(list(age_groups.keys()), p=list(age_groups.values()))
        if group == '0-19':
            ages.append(np.random.randint(0, 20))
        elif group == '20-64':
            ages.append(np.random.randint(20, 65))
        elif group == '65-79':
            ages.append(np.random.randint(65, 80))
        else:
            ages.append(np.random.randint(80, 95))
    ages = np.array(ages)

    # -------------------------------------------------------------------------
    # 3. Assign sex
    # -------------------------------------------------------------------------
    sexes = np.random.choice(sex_categories, size=n_samples, p=sex_probs)

    # -------------------------------------------------------------------------
    # 4. Anthropometrics
    # -------------------------------------------------------------------------
    height = np.zeros(n_samples)
    weight = np.zeros(n_samples)
    bmi = np.zeros(n_samples)

    for i, sex in enumerate(sexes):
        age = ages[i]

        # Children & adolescents
        if age < 20:
            if sex == 'Male':
                height[i] = np.random.normal(165 if age > 15 else 150, 10)
                bmi[i] = np.random.normal(20 if age > 15 else 18, 2.5)
            else:
                height[i] = np.random.normal(160 if age > 15 else 145, 10)
                bmi[i] = np.random.normal(19 if age > 15 else 17.5, 2.5)

        # Adults
        elif age < 65:
            if sex == 'Male':
                bmi_mean = 25.0 if age < 50 else 25.9
                bmi_sd = 3.8
                height[i] = np.random.normal(178, 7.5)
            else:
                bmi_mean = 23.8 if age < 50 else 24.5
                bmi_sd = 4.0
                height[i] = np.random.normal(165, 6.5)
            bmi[i] = np.random.normal(bmi_mean, bmi_sd)

        # Seniors (65+)
        else:
            if sex == 'Male':
                bmi[i] = np.random.normal(26.0, 3.5)
                height[i] = np.random.normal(173, 7.0)
            else:
                bmi[i] = np.random.normal(25.0, 3.8)
                height[i] = np.random.normal(160, 6.0)

        # Compute weight
        weight[i] = bmi[i] * (height[i] / 100) ** 2

    # Sanity checks (clip)
    height = np.clip(height, 50, 202)
    weight = np.clip(weight, 3, 250)
    bmi = np.round(weight / (height / 100) ** 2, 1)

    # -------------------------------------------------------------------------
    # 5. Lifestyle & behavior (only for adults)
    # -------------------------------------------------------------------------
    smoker = np.zeros(n_samples, dtype=bool)
    practice_sport = np.zeros(n_samples, dtype=bool)

    for i, age in enumerate(ages):
        if age < 16:
            smoker[i] = False
            practice_sport[i] = np.random.rand() < 0.65  # active kids
        else:
            # Smoking: ~25% overall, slightly higher in men
            smoker[i] = np.random.rand() < (0.27 if sexes[i] == 'Male' else 0.22)

            # Physical activity: decreases with age
            if age < 35:
                p_sport = 0.65
            elif age < 65:
                p_sport = 0.55
            elif age < 80:
                p_sport = 0.45
            else:
                p_sport = 0.30
            practice_sport[i] = np.random.rand() < p_sport
    # ------------------- NEW: Remove sport for obese adults -------------------
    for i in range(n_samples):
        if (sexes[i] == 'Female' and weight[i] > 90) or (sexes[i] == 'Male' and weight[i] > 100):
            practice_sport[i] = False
    # -------------------------------------------------------------------------
    # 6. Assemble DataFrame
    # -------------------------------------------------------------------------
    df = pd.DataFrame({
        'AGE': ages,
        'SEX': sexes,
        'HEIGHT_CM': np.round(height, 1),
        'WEIGHT_KG': np.round(weight, 1),
        'BMI': bmi,
        'SMOKER': smoker,
        'PRACTICE_SPORT': practice_sport
    })

    return df

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
        'PRACTICE_SPORT': len(form_data.sports) > 0,
        'PRICE_INSURANCE': form_data.insurance_price
    }