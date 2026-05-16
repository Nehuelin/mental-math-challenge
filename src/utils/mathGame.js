import { DIFFICULTIES } from '../constants/gameConfig';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (items) => items[randomInt(0, items.length - 1)];
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const buildOperation = (difficulty) => {
  const config = DIFFICULTIES[difficulty];
  const operator = pick(config.operators);
  const { operands, multipliers } = config;

  if (operator === '×') {
    const left = randomInt(multipliers.min, multipliers.max);
    const right = randomInt(multipliers.min, multipliers.max);
    return { expression: `${left} × ${right}`, answer: left * right };
  }

  if (operator === '÷') {
    const divisor = randomInt(multipliers.min, multipliers.max);
    const quotient = randomInt(multipliers.min, multipliers.max);
    const dividend = divisor * quotient;
    return { expression: `${dividend} ÷ ${divisor}`, answer: quotient };
  }

  const left = randomInt(operands.min, operands.max);
  const right = randomInt(operands.min, operands.max);

  if (operator === '-') {
    const larger = Math.max(left, right);
    const smaller = Math.min(left, right);
    return { expression: `${larger} - ${smaller}`, answer: larger - smaller };
  }

  return { expression: `${left} + ${right}`, answer: left + right };
};

const makeDistractors = (answer, difficulty) => {
  const spread = difficulty === 'hard' ? 16 : difficulty === 'medium' ? 11 : 7;
  const values = new Set([answer]);

  while (values.size < 4) {
    const offset = randomInt(1, spread) * (Math.random() > 0.5 ? 1 : -1);
    values.add(answer + offset);
  }

  return shuffle([...values]);
};

const makePresentedAnswer = (answer, difficulty) => {
  const shouldBeCorrect = Math.random() > 0.45;

  if (shouldBeCorrect) {
    return { displayedAnswer: answer, statementIsTrue: true };
  }

  const [displayedAnswer] = makeDistractors(answer, difficulty).filter((value) => value !== answer);
  return { displayedAnswer, statementIsTrue: false };
};

export const generateQuestion = ({ difficulty, mode }) => {
  const operation = buildOperation(difficulty);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  if (mode === 'trueFalse') {
    const trueFalsePayload = makePresentedAnswer(operation.answer, difficulty);
    return {
      id,
      mode,
      difficulty,
      expression: `${operation.expression} = ${trueFalsePayload.displayedAnswer}`,
      correctAnswer: trueFalsePayload.statementIsTrue,
      rawAnswer: operation.answer,
      choices: [true, false],
    };
  }

  if (mode === 'multipleChoice' || mode === 'timeTrial') {
    return {
      id,
      mode,
      difficulty,
      expression: operation.expression,
      correctAnswer: operation.answer,
      rawAnswer: operation.answer,
      choices: makeDistractors(operation.answer, difficulty),
    };
  }

  return {
    id,
    mode,
    difficulty,
    expression: operation.expression,
    correctAnswer: operation.answer,
    rawAnswer: operation.answer,
    choices: [],
  };
};

export const normalizeClassicAnswer = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }

  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
};