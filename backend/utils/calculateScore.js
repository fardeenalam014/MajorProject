/**
 * Calculate score from student answers against test sections.
 *
 * @param {Array}  sections  - test.sections from DB
 * @param {Object} answers   - { "<sectionId>_<qIndex>": "studentAnswer", ... }
 * @returns {{ score, totalMarks, percentage, passed, passPercentage }}
 */
const calculateScore = (sections, answers = {}, passPercentage = 40) => {
  let score      = 0;
  let totalMarks = 0;

  sections.forEach((sec) => {
    sec.questions.forEach((q, qi) => {
      const marks       = q.marks       ?? 1;
      const negativeMark = q.negativeMark ?? 0;
      totalMarks += marks;

      const key        = `${sec._id}_${qi}`;
      const studentAns = answers[key];

      if (studentAns !== undefined && studentAns !== null && studentAns !== "") {
        if (String(studentAns).trim() === String(q.correct).trim()) {
          score += marks;
        } else if (negativeMark > 0) {
          score -= negativeMark;
        }
      }
    });
  });

  score = Math.max(0, score); // floor at 0
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const passed     = percentage >= passPercentage;

  return { score, totalMarks, percentage, passed, passPercentage };
};

module.exports = calculateScore;