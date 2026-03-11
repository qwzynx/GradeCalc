export function calculateGrades(assignments: { percentage?: number | null; weight?: number | null }[], targetGrade: number = 0.0) {
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
  const targety = calcRequired(targetGrade);

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
