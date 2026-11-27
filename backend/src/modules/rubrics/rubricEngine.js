export class RubricEngine {
  /**
   * Calculates overall weighted score (0 to 100) and breakdown based on rubric criteria:
   * - Number of test cases passed (Sample & Hidden test cases)
   * - Time taken to complete and submit
   * - Overall submission performance (MCQ accuracy, clean runs, correctness)
   */
  static calculateScore(rubric, metrics = {}) {
    const totalDuration = Number(metrics.totalDurationMinutes) || 60;
    const timeTakenMin = (Number(metrics.completionTimeSeconds) || 0) / 60;

    // 1. Test Cases Passed Score (Hidden test cases weighted higher than sample)
    const samplePct = metrics.sampleCasesPassedPct !== undefined ? Number(metrics.sampleCasesPassedPct) : 100;
    const hiddenPct = metrics.hiddenCasesPassedPct !== undefined ? Number(metrics.hiddenCasesPassedPct) : Number(metrics.testCasesPassedPct || 0);
    const testCasesScore = Math.min(100, Math.max(0, Math.round(hiddenPct * 0.7 + samplePct * 0.3)));

    // 2. Time Taken Score (Students completing accurately within allocated time get high efficiency rating)
    const timeRemainingRatio = Math.max(0, (totalDuration - timeTakenMin) / totalDuration);
    // Base 70 for submitting within duration, plus up to 30 bonus points for prompt completion
    const timeScore = Math.min(100, Math.max(20, Math.round(70 + timeRemainingRatio * 30)));

    // 3. Overall Performance Score (Holistic mix of MCQs, correctness, and execution consistency)
    const mcqAccuracy = metrics.mcqAccuracy !== undefined ? Number(metrics.mcqAccuracy) : 100;
    const performanceScore = Math.min(
      100,
      Math.max(0, Math.round(testCasesScore * 0.5 + mcqAccuracy * 0.3 + timeScore * 0.2))
    );

    // If no custom rubric is attached, use the refined standard balanced formula:
    // 55% Test Cases Passed + 25% MCQ Accuracy + 20% Time & Overall Performance
    if (!rubric || !rubric.criteria || !rubric.criteria.length) {
      const finalScore = Math.min(
        100,
        Math.max(
          0,
          Math.round(testCasesScore * 0.55 + mcqAccuracy * 0.25 + timeScore * 0.2)
        )
      );

      return {
        finalScore,
        breakdown: {
          testCasesScore,
          timeScore,
          performanceScore,
          mcqScore: Math.round(mcqAccuracy),
        },
      };
    }

    // Evaluated against custom configured criteria in rubric
    let weightedScore = 0;
    let totalWeight = 0;
    const breakdown = {
      testCasesScore,
      timeScore,
      performanceScore,
      mcqScore: Math.round(mcqAccuracy),
    };

    for (const crit of rubric.criteria) {
      const weight = Number(crit.weight) || 0;
      totalWeight += weight;
      let criterionScore = 0;

      const nameLower = (crit.name || '').toLowerCase();
      const type = crit.type || '';

      if (
        type === 'test_cases_passed_pct' ||
        type === 'hidden_test_cases_passed_pct' ||
        nameLower.includes('test case') ||
        nameLower.includes('correctness') ||
        nameLower.includes('functionality') ||
        nameLower.includes('coding')
      ) {
        criterionScore = testCasesScore;
      } else if (
        type === 'completion_time' ||
        nameLower.includes('time') ||
        nameLower.includes('speed') ||
        nameLower.includes('duration')
      ) {
        criterionScore = timeScore;
      } else if (
        type === 'mcq_accuracy' ||
        nameLower.includes('mcq') ||
        nameLower.includes('aptitude') ||
        nameLower.includes('knowledge')
      ) {
        criterionScore = mcqAccuracy;
      } else {
        // Overall Performance / Code Quality
        criterionScore = performanceScore;
      }

      weightedScore += (criterionScore * weight) / 100;
    }

    if (totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01) {
      weightedScore = weightedScore / (totalWeight / 100);
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

    return {
      finalScore,
      breakdown,
    };
  }
}
