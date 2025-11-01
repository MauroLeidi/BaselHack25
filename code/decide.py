import pandas as pd
import numpy as np

# --------------------------------------------------
# 1. Setup and initial rules
# --------------------------------------------------
LEARN_FLAG = True  # Global learning flag

columns = ['BMI', 'AGE', 'SMOKER', 'PRACTICE_SPORT', 'DECISION', 'COMMENT']

rules_data = [
    [22.0, 25, False, True,  "accepted", "Nothing special"],
    [30.0, 45, True,  False, "accepted with extra charge", "Higher risk: middle-aged smoker, inactive"],
    [27.0, 35, False, False, "need for additional information", "Missing health activity data"],
    [35.0, 55, True,  False, "rejected", "Too high risk: older smoker with high BMI"],
    [19.0, 20, False, True,  "accepted", "Young and active, low risk"],
    [25.0, 40, True,  True,  "accepted with extra charge", "Smoker but compensates with sport activity"]
]

rules_df = pd.DataFrame(rules_data, columns=columns)

# --------------------------------------------------
# 2. Operational Analytical Rule
# --------------------------------------------------
def operational_rule(BMI, AGE, SMOKER, PRACTICE_SPORT):
    if SMOKER and BMI > 30:
        return "rejected", "Rejected because of too high risk (smoker with high BMI)"
    elif SMOKER and not PRACTICE_SPORT:
        return "accepted with extra charge", "Smoker without physical activity → higher premium"
    elif BMI < 20 and AGE < 25:
        return "accepted", "Nothing special: low BMI and young"
    elif BMI > 27 and AGE > 50:
        return "rejected", "Rejected due to advanced age and high BMI"
    elif PRACTICE_SPORT and not SMOKER:
        return "accepted", "Nothing special: healthy lifestyle"
    else:
        return "need for additional information", "Unclear risk profile → additional info needed"


# --------------------------------------------------
# 3. Similarity and rule selection
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
# 4. Decision and learning logic
# --------------------------------------------------
def decide_and_learn(rules_df, x_input, learn_flag=True):
    operational_decision, comment = operational_rule(
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
        if decision != operational_decision and learn_flag:
            rules_df.loc[best_rule.name, ['DECISION', 'COMMENT']] = [operational_decision, comment]
            decision = operational_decision
    else:
        decision = best_rule['DECISION']
        if learn_flag:
            new_rule = {
                'BMI': x_input['BMI'],
                'AGE': x_input['AGE'],
                'SMOKER': x_input['SMOKER'],
                'PRACTICE_SPORT': x_input['PRACTICE_SPORT'],
                'DECISION': operational_decision,
                'COMMENT': comment
            }
            rules_df.loc[len(rules_df)] = new_rule

    return decision, operational_decision, comment, rules_df


# --------------------------------------------------
# 5. Helper for API use (no learning)
# --------------------------------------------------
def predict_decision(form_data):
    """
    Predict decision from form data without modifying the rules table.
    """
    # Derive BMI and AGE roughly
    height_m = form_data['height_cm'] / 100
    BMI = round(form_data['weight_kg'] / (height_m ** 2), 1)
    birth_year = int(form_data['date_of_birth'].split(".")[-1])
    current_year = 2025
    AGE = current_year - birth_year

    x_input = {
        'BMI': BMI,
        'AGE': AGE,
        'SMOKER': form_data['smokes'],
        'PRACTICE_SPORT': len(form_data['sports']) > 0
    }

    decision, _, comment, _ = decide_and_learn(rules_df, x_input, learn_flag=False)
    return decision, comment

# --------------------------------------------------
# 6. Admin bulk rule update
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
