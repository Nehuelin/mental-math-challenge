import { DIFFICULTIES } from "../constants/gameConfig";

export const getScoreBreakdown = ({ difficulty, isCorrect, timedOut, responseTimeMs, timeLimitMs }) => {
  const config = DIFFICULTIES[difficulty];
  const allottedMs = timeLimitMs ?? config.maxTimeMs;

  if (timedOut) {
    return {
      points: -config.timeoutPenalty,
      basePoints: 0,
      speedBonus: 0,
      quickBonus: 0,
      penalties: -config.timeoutPenalty,
    };
  }

  if (!isCorrect) {
    return {
      points: -config.wrongPenalty,
      basePoints: 0,
      speedBonus: 0,
      quickBonus: 0,
      penalties: -config.wrongPenalty,
    };
  }

  const speedRatio = Math.max(0, 1 - responseTimeMs / allottedMs);
  const speedBonus = Math.round(config.speedBonus * speedRatio);
  const quickBonus = responseTimeMs < allottedMs * config.fastRatio ? 12 : 0;
  const points = config.baseScore + speedBonus + quickBonus;

  return {
    points,
    basePoints: config.baseScore,
    speedBonus,
    quickBonus,
    penalties: 0,
  };
};

export const scoreAnswer = (payload) => getScoreBreakdown(payload).points;

export const summarizeResults = (answers) => {
  const total = answers.length;
  const correct = answers.filter((answer) => answer.isCorrect).length;
  const incorrect = answers.filter((answer) => !answer.isCorrect && !answer.timedOut).length;
  const timedOut = answers.filter((answer) => answer.timedOut).length;
  const score = answers.reduce((sum, answer) => sum + answer.points, 0);
  const responseTimes = answers.filter((answer) => answer.responseTimeMs !== null).map((answer) => answer.responseTimeMs);
  const averageResponseMs = responseTimes.length ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length) : 0;
  const fastestResponseMs = responseTimes.length ? Math.min(...responseTimes) : 0;
  const slowestResponseMs = responseTimes.length ? Math.max(...responseTimes) : 0;
  const scoreBreakdown = answers.reduce((totals, answer) => {
    const breakdown = answer.scoreBreakdown ?? {
      basePoints: Math.max(answer.points, 0),
      speedBonus: 0,
      quickBonus: 0,
      penalties: Math.min(answer.points, 0),
    };

    return {
      basePoints: totals.basePoints + breakdown.basePoints,
      speedBonus: totals.speedBonus + breakdown.speedBonus,
      quickBonus: totals.quickBonus + breakdown.quickBonus,
      penalties: totals.penalties + breakdown.penalties,
    };
  }, { basePoints: 0, speedBonus: 0, quickBonus: 0, penalties: 0 });

  return {
    total,
    correct,
    incorrect,
    timedOut,
    score,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    averageResponseMs,
    fastestResponseMs,
    slowestResponseMs,
    scoreBreakdown,
  };
};