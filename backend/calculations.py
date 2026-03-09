from typing import List, Dict, Union, Any

def calculate_grades(assignments: List[Dict[str, float]], target_grade: float = 0.0) -> Dict[str, Any]:
    """
    Translates the frontend grading calculation logic into Python.
    `assignments` should be a list of dicts with 'percentage' and 'weight'.
    Example: [{"percentage": 85.0, "weight": 20.0}, ...]
    """
    total_score = 0.0
    total_weight = 0.0

    for item in assignments:
        p = item.get("percentage")
        w = item.get("weight")
        if p is not None and w is not None:
            total_score += p * w
            total_weight += w

    final_average = 0.0
    if total_weight > 0:
        final_average = total_score / total_weight

    # hml represents the remaining weight (100 - totalWeight)
    hml = 100.0 - total_weight

    def calc_required(target: float) -> Union[float, str]:
        if hml <= 0:
            return "N/A" # No remaining weight to achieve target
        required = ((target * 100) - (final_average * total_weight)) / hml
        return required

    get_fifty = calc_required(50)
    targety = calc_required(target_grade)

    yorku_gpa = 0.0
    yorku_letter = ""
    higher: Union[float, str] = 0.0
    lower: Union[float, str] = 0.0

    if final_average < 50:
        yorku_gpa = 0.0
        yorku_letter = "F"
        higher = calc_required(50)
        lower = 0.0
    elif 50 <= final_average < 55:
        yorku_gpa = 2 + ((final_average - 50) / 5)
        yorku_letter = "D"
        higher = calc_required(55)
        lower = calc_required(49)
    elif 55 <= final_average < 60:
        yorku_gpa = 3 + ((final_average - 55) / 5)
        yorku_letter = "D+"
        higher = calc_required(60)
        lower = calc_required(54)
    elif 60 <= final_average < 65:
        yorku_gpa = 4 + ((final_average - 60) / 5)
        yorku_letter = "C"
        higher = calc_required(65)
        lower = calc_required(59)
    elif 65 <= final_average < 70:
        yorku_gpa = 5 + ((final_average - 65) / 5)
        yorku_letter = "C+"
        higher = calc_required(70)
        lower = calc_required(64)
    elif 70 <= final_average < 75:
        yorku_gpa = 6 + ((final_average - 70) / 5)
        yorku_letter = "B"
        higher = calc_required(75) # Fixed logical typo in JS (was 76 instead of 75 for B -> B+)
        lower = calc_required(69)
    elif 75 <= final_average < 80:
        yorku_gpa = 7 + ((final_average - 75) / 5)
        yorku_letter = "B+"
        higher = calc_required(80)
        lower = calc_required(74)
    elif 80 <= final_average < 90:
        yorku_gpa = 8 + ((final_average - 80) / 10)
        yorku_letter = "A"
        higher = calc_required(90)
        lower = calc_required(79)
    elif final_average >= 90:
        # Based on YorkU grading system GPA tops out at 9.0, but final average can exceed 100
        yorku_gpa = min(9.0, 9.0) # Ensure it doesn't break YorkU's 9.0 scale 
        yorku_letter = "A+"
        higher = 100.0
        lower = calc_required(89)

    # Helper format function to safely round float metrics
    def safe_round(val: Union[float, str]) -> Union[float, str]:
        if isinstance(val, (int, float)):
            return round(val, 2)
        return val

    return {
        "final_average": round(final_average, 2),
        "remaining_weight": round(hml, 2),
        "get_fifty": safe_round(get_fifty),
        "target_required_score": safe_round(targety),
        "yorku_gpa": round(yorku_gpa, 2),
        "yorku_letter": yorku_letter,
        "higher_target_score": safe_round(higher),
        "lower_target_score": safe_round(lower)
    }

def calculate_simple_percentage(points: float, from_total: float) -> Union[float, None]:
    """
    Calculates a simple percentage based on points and total points.
    Matches the JS `pTopContainer` behaviour to calculate assignment mark.
    """
    if from_total > 0:
        return round((points / from_total) * 100, 2)
    return None
