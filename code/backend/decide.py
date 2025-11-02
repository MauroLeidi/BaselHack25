import pandas as pd
import numpy as np

LEARN_FLAG = True  # Global learning flag

columns = ['BMI', 'AGE', 'SMOKER', 'PRACTICE_SPORT', 'DECISION', 'COMMENT']

rules_df = pd.read_csv("../assets/learned_rules.csv")

# --------------------------------------------------
# 1. Operational Analytical Rule
# --------------------------------------------------
def operational_rule(BMI, AGE, SMOKER, PRACTICE_SPORT):
    # --- Hard rejections ---
    if AGE > 85:
        return "rejected", "very high age (86+ years)"
    if BMI > 45:
        return "rejected", "morbid obesity (BMI > 45)"
    if BMI < 14 and AGE < 18:
        return "rejected", "severely underweight minor (BMI < 14)"
    if BMI < 16 and AGE >= 18:
        return "rejected", "severe underweight adult (BMI < 16)"
    if SMOKER and BMI > 35:
        return "rejected", "obese smoker (BMI > 35)"
    if SMOKER and AGE > 67 and not PRACTICE_SPORT:
        return "rejected", "aged smoker without sport"

    # --- Adolescents ---
    if AGE < 18:
        if BMI < 16 or BMI > 30:
            return "need for additional information", "BMI outside healthy adolescent range"
        else:
            return "accepted", "healthy adolescent profile"

    # --- Very healthy older adults (lenient rule for 60–85) ---
    if AGE <= 85 and AGE > 60 and not SMOKER and PRACTICE_SPORT and 18.5 <= BMI <= 30:
        return "accepted with extra charge", "healthy older adult (60–85), active and good BMI"

    if AGE > 75 and not PRACTICE_SPORT:
        return "rejected", "older adult (>=76), not active"
    # --- Extra charge rules ---
    if SMOKER and BMI > 25:
        return "accepted with extra charge", "smoker with overweight BMI"
    if SMOKER and AGE > 60:
        return "accepted with extra charge", "older smoker"
    if 35 <= BMI <= 45:
        return "accepted with extra charge", "obese (BMI 35–45)"
    if BMI < 18.5:
        return "accepted with extra charge", "underweight adult"
    if AGE >= 70 and not SMOKER:
        return "accepted with extra charge", "advanced age (70+)"
    if PRACTICE_SPORT == False and BMI > 30:
        return "accepted with extra charge", "inactive overweight"

    # --- Need more info for specific age/BMI combos ---
    if 65 <= AGE < 70:
        return "need for additional information", "age between 65–70, require medical exam"
    if 18 <= AGE <= 25 and (BMI < 18.5 or BMI > 30):
        return "need for additional information", "unusual BMI for young adult"

    # --- Default acceptance ---
    if (18.5 <= BMI <= 30) and (AGE <= 60) and not SMOKER and PRACTICE_SPORT:
        return "accepted", "healthy BMI, non-smoker, active, age ≤ 60"
    if (18.5 <= BMI <= 30) and (AGE <= 60) and not SMOKER:
        return "accepted", "healthy BMI, non-smoker, age ≤ 60"

    # --- Catch-all ---
    return "accepted with extra charge", "moderate risk profile, no major issues"


# --------------------------------------------------
# 2. Similarity and rule selection
# --------------------------------------------------
def compute_similarity(row, x_input):
    sim = 0
    sim += 1 - abs(row['BMI'] - x_input['BMI']) / 100
    sim += 1 - abs(row['AGE'] - x_input['AGE']) / 100
    sim += 1 if row['SMOKER'] == x_input['SMOKER'] else 0
    sim += 1 if row['PRACTICE_SPORT'] == x_input['PRACTICE_SPORT'] else 0
    return sim


def find_best_rule(rules_df, x_input):
    similarities = rules_df.apply(lambda r: compute_similarity(r, x_input), axis=1)
    best_idx = similarities.idxmax()
    return rules_df.loc[best_idx], similarities[best_idx]


# --------------------------------------------------
# 3. Decision and learning logic
# --------------------------------------------------
def decide_and_learn(rules_df, x_input, learn_flag=True):
    operational_decision, operational_comment = operational_rule(
        x_input['BMI'], x_input['AGE'], x_input['SMOKER'], x_input['PRACTICE_SPORT']
    )

    best_rule, similarity = find_best_rule(rules_df, x_input)

    perfect_match = (
        (best_rule['BMI'] == x_input['BMI']) and
        (best_rule['AGE'] == x_input['AGE']) and
        (best_rule['SMOKER'] == x_input['SMOKER']) and
        (best_rule['PRACTICE_SPORT'] == x_input['PRACTICE_SPORT'])
    )

    if perfect_match:
        decision = best_rule['DECISION']
        comment = best_rule["COMMENT"]
        if decision != operational_decision and learn_flag:
            rules_df.loc[best_rule.name, ['DECISION', 'COMMENT']] = [operational_decision, operational_comment]
            decision = operational_decision
            comment = operational_comment
    else:
        decision = best_rule['DECISION']
        comment = best_rule["COMMENT"]
        if learn_flag:
            new_rule = {
                'BMI': x_input['BMI'],
                'AGE': x_input['AGE'],
                'SMOKER': x_input['SMOKER'],
                'PRACTICE_SPORT': x_input['PRACTICE_SPORT'],
                'DECISION': operational_decision,
                'COMMENT': operational_comment
            }
            rules_df.loc[len(rules_df)] = new_rule

    return decision, operational_decision, comment, operational_comment, rules_df


# --------------------------------------------------
# 4. Helper for API use (no learning)
# --------------------------------------------------
def predict_decision(x_input):
    """
    Predict decision from form data without modifying the rules table.
    """
    decision,_,comment,_, _ = decide_and_learn(rules_df, x_input, learn_flag=False)
    return decision, comment

# --------------------------------------------------
# 5. Admin bulk rule update
# --------------------------------------------------
def replace_rule_table(new_rules):
    """
    Replace the entire rules table with new rules.

    Parameters:
    - rules_df: current DataFrame of rules
    - new_rules: list of dicts, each with keys:
        'BMI', 'AGE', 'SMOKER', 'PRACTICE_SPORT', 'DECISION', 'COMMENT'

    Returns:
    - Updated rules_df
    """
    global rules_df
    # Convert new rules list into a DataFrame
    new_df = pd.DataFrame(new_rules, columns=rules_df.columns)
    
    # Replace the current rules_df with the new one
    rules_df = new_df.copy()
    
    return len(rules_df)
