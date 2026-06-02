export const LETTER_GRADES = [
  { letter: "A+", min: 90, max: 100 },
  { letter: "A",  min: 80, max: 89  },
  { letter: "B+", min: 75, max: 79  },
  { letter: "B",  min: 70, max: 74  },
  { letter: "C+", min: 65, max: 69  },
  { letter: "C",  min: 60, max: 64  },
  { letter: "D+", min: 55, max: 59  },
  { letter: "D",  min: 50, max: 54  },
  { letter: "F",  min: 0,  max: 49  },
] as const;

export function parseTargetGrade(input: string | number): number | null {
  if (typeof input === 'number') return input;
  const trimmed = input.trim();
  if (trimmed === "") return null;
  
  const num = parseFloat(trimmed);
  // If it's a number, ensure it's in a valid range (0-100)
  if (!isNaN(num) && /^\d+(\.\d+)?$/.test(trimmed)) {
    return (num >= 0 && num <= 100) ? num : null;
  }
  
  const upperInput = trimmed.toUpperCase();
  const grade = LETTER_GRADES.find(g => g.letter === upperInput);
  if (grade) return grade.min;
  
  return null;
}

export function calculateGrades(assignments: { percentage?: number | null; weight?: number | null }[], targetGradeInput: string | number = 0.0) {
  const targetGrade = parseTargetGrade(targetGradeInput);
  
  // If target is invalid, we still want to return basic metrics but indicate target failure
  let totalScore = 0.0;
  let totalWeight = 0.0;

  for (const item of assignments) {
    const p = item.percentage;
    const w = item.weight;
    if (p !== undefined && p !== null && w !== undefined && w !== null) {
      totalScore += p * w;
      totalWeight += w;
    }
  }

  let finalAverage = 0.0;
  if (totalWeight > 0) {
    finalAverage = totalScore / totalWeight;
  }

  // hml represents the remaining weight (100 - totalWeight)
  const hml = 100.0 - totalWeight;

  function calcRequired(target: number): number | "N/A" {
    if (hml <= 0) {
      return "N/A"; // No remaining weight to achieve target
    }
    const required = ((target * 100) - (finalAverage * totalWeight)) / hml;
    return required;
  }

  const getFifty = calcRequired(50);
  const targety = targetGrade === null ? "N/A" : calcRequired(targetGrade);

  let yorkuGpa = 0.0;
  let yorkuLetter = "";
  let higher: number | "N/A" = 0.0;
  let lower: number | "N/A" = 0.0;

  if (finalAverage < 50) {
    yorkuGpa = 0.0;
    yorkuLetter = "F";
    higher = calcRequired(50);
    lower = 0.0;
  } else if (finalAverage >= 50 && finalAverage < 55) {
    yorkuGpa = 2 + ((finalAverage - 50) / 5);
    yorkuLetter = "D";
    higher = calcRequired(55);
    lower = calcRequired(49);
  } else if (finalAverage >= 55 && finalAverage < 60) {
    yorkuGpa = 3 + ((finalAverage - 55) / 5);
    yorkuLetter = "D+";
    higher = calcRequired(60);
    lower = calcRequired(54);
  } else if (finalAverage >= 60 && finalAverage < 65) {
    yorkuGpa = 4 + ((finalAverage - 60) / 5);
    yorkuLetter = "C";
    higher = calcRequired(65);
    lower = calcRequired(59);
  } else if (finalAverage >= 65 && finalAverage < 70) {
    yorkuGpa = 5 + ((finalAverage - 65) / 5);
    yorkuLetter = "C+";
    higher = calcRequired(70);
    lower = calcRequired(64);
  } else if (finalAverage >= 70 && finalAverage < 75) {
    yorkuGpa = 6 + ((finalAverage - 70) / 5);
    yorkuLetter = "B";
    higher = calcRequired(75);
    lower = calcRequired(69);
  } else if (finalAverage >= 75 && finalAverage < 80) {
    yorkuGpa = 7 + ((finalAverage - 75) / 5);
    yorkuLetter = "B+";
    higher = calcRequired(80);
    lower = calcRequired(74);
  } else if (finalAverage >= 80 && finalAverage < 90) {
    yorkuGpa = 8 + ((finalAverage - 80) / 10);
    yorkuLetter = "A";
    higher = calcRequired(90);
    lower = calcRequired(79);
  } else if (finalAverage >= 90) {
    yorkuGpa = Math.min(9.0, 9.0);
    yorkuLetter = "A+";
    higher = 100.0;
    lower = calcRequired(89);
  }

  const safeRound = (val: number | "N/A"): number | "N/A" => {
    if (typeof val === "number") {
      return Number(val.toFixed(2));
    }
    return val;
  };

  return {
    final_average: Number(finalAverage.toFixed(2)),
    remaining_weight: Number(hml.toFixed(2)),
    get_fifty: safeRound(getFifty),
    target_required_score: safeRound(targety),
    is_target_invalid: targetGrade === null,
    yorku_gpa: Number(yorkuGpa.toFixed(2)),
    yorku_letter: yorkuLetter,
    higher_target_score: safeRound(higher),
    lower_target_score: safeRound(lower)
  };
}

export function calculateSimplePercentage(points: number, fromTotal: number): number | null {
  if (fromTotal > 0) {
    return Number(((points / fromTotal) * 100).toFixed(2));
  }
  return null;
}

export const GRADE_MAPPING_4_0: Record<string, { value: number; description: string }> = {
  'A+': { value: 4.00, description: 'Excellent' },
  'A':  { value: 3.90, description: 'Excellent' },
  'A-': { value: 3.70, description: 'Excellent' },
  'B+': { value: 3.30, description: 'Good' },
  'B':  { value: 3.00, description: 'Good' },
  'B-': { value: 2.70, description: 'Good' },
  'C+': { value: 2.30, description: 'Satisfactory' },
  'C':  { value: 2.00, description: 'Satisfactory' },
  'C-': { value: 1.70, description: 'Satisfactory' },
  'D+': { value: 1.30, description: 'Marginal' },
  'D':  { value: 1.00, description: 'Marginal' },
  'D-': { value: 0.70, description: 'Marginal' },
  'F':  { value: 0.00, description: 'Failing' }
};

export function calculateCumulativeGPA4_0(courseGrades: { letter: string; credits: number }[]): string {
  let totalCredits = 0;
  let earnedPoints = 0;

  for (const course of courseGrades) {
    const mapping = GRADE_MAPPING_4_0[course.letter];
    if (mapping) {
      totalCredits += course.credits;
      earnedPoints += mapping.value * course.credits;
    }
  }

  if (totalCredits === 0) return "0.00";
  return (earnedPoints / totalCredits).toFixed(2);
}
