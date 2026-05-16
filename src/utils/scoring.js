import { DIFFICULTIES } from "../constants/gameConfig";

export const scoreAnswer = ({ difficulty, isCorrect, timedOut, responseTimeMs }) => {
	const config = DIFFICULTIES[difficulty];

	if (timedOut) {
		return -config.timeoutPenalty;
	}

	if (!isCorrect) {
		return -config.wrongPenalty;
	}

	const speedRatio = Math.max(0, 1 - responseTimeMs / config.maxTimeMs);
	const speedBonus = Math.round(config.speedBonus * speedRatio);
	const streakNudge = responseTimeMs < config.maxTimeMs * config.fastRatio ? 12 : 0;

	return config.baseScore + speedBonus + streakNudge;
};

export const summarizeResults = (answers) => {
	const total = answers.length;
	const correct = answers.filter((answer) => answer.isCorrect).length;
	const incorrect = answers.filter((answer) => !answer.isCorrect).length;
	const timedOut = answers.filter((answer) => answer.timedOut).length;
	const score = answers.reduce((sum, answer) => sum + answer.points, 0);
	const responseTimes = answers.filter((answer) => answer.responseTimeMs !== null).map((answer) => answer.responseTimeMs);
	const averageResponseMs = responseTimes.length ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length) : 0;

	return {
		total,
		correct,
		incorrect,
		timedOut,
		score,
		accuracy: total ? Math.round((correct / total) * 100) : 0,
		averageResponseMs,
	};
};