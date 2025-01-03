function calculateGrade(studentPoints, totalPoints, totalQuestions) {
  if (totalPoints === 0 || totalQuestions === 0) {
    return "N/A";
  }

  const percentage = (studentPoints * 100) / totalQuestions;

  if (percentage >= 90) {
    // return "A";
    return "championship";
  } else if (percentage >= 80) {
    // return "B";
    return "winner";
  } else if (percentage >= 70) {
    // return "C";
    return "runner up";
  } else {
    // return "D";
    return "participation";
  }
}
module.exports = { calculateGrade };
