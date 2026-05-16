export const DIFFICULTIES = {
  easy: {
    label: 'Fácil',
    maxTimeMs: 10000,
    timeTrialMs: 60000,
    operands: { min: 1, max: 20 },
    multipliers: { min: 2, max: 9 },
    operators: ['+', '-'],
    baseScore: 82,
    speedBonus: 38,
    wrongPenalty: 24,
    timeoutPenalty: 42,
    fastRatio: 0.6,
    dynamicTimeStepMs: 650,
    minDynamicTimeMs: 4500,
  },
  medium: {
    label: 'Medio',
    maxTimeMs: 7500,
    timeTrialMs: 50000,
    operands: { min: 8, max: 75 },
    multipliers: { min: 3, max: 12 },
    operators: ['+', '-', '×'],
    baseScore: 112,
    speedBonus: 55,
    wrongPenalty: 35,
    timeoutPenalty: 58,
    fastRatio: 0.55,
    dynamicTimeStepMs: 575,
    minDynamicTimeMs: 3400,
  },
  hard: {
    label: 'Difícil',
    maxTimeMs: 5500,
    timeTrialMs: 45000,
    operands: { min: 18, max: 160 },
    multipliers: { min: 6, max: 19 },
    operators: ['+', '-', '×', '÷'],
    baseScore: 148,
    speedBonus: 84,
    wrongPenalty: 52,
    timeoutPenalty: 76,
    fastRatio: 0.5,
		dynamicTimeStepMs: 450,
    minDynamicTimeMs: 2500,
  },
};

export const GAME_MODES = {
  classic: {
    label: 'Clásico',
    description: 'Escribe el resultado exacto antes de que se termine el tiempo.',
  },
  trueFalse: {
    label: 'Verdadero / Falso',
    description: 'Decide si la ecuación mostrada es correcta o no.',
  },
  multipleChoice: {
    label: 'Multiple Choice',
    description: 'Escoje la respuesta correcta entre cuatro opciones',
  },
  timeTrial: {
    label: 'Contra Reloj',
    description: 'Responde continuamente hasta que se acabe el tiempo o falles.',
  },
};

export const ITERATION_OPTIONS = [5, 10, 15, 20];
export const DEFAULT_ITERATIONS = 10;
export const HISTORY_LIMIT = 25;