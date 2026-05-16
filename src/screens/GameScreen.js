import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DIFFICULTIES, GAME_MODES } from '../constants/gameConfig';
import { PrimaryButton } from '../components/PrimaryButton';
import { generateQuestion, normalizeClassicAnswer } from '../utils/mathGame';
import { scoreAnswer, summarizeResults } from '../utils/scoring';

export function GameScreen({ settings, onCancel, onFinish }) {
  const difficultyConfig = DIFFICULTIES[settings.difficulty];
  const [question, setQuestion] = useState(() => generateQuestion(settings));
  const [answers, setAnswers] = useState([]);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [remainingMs, setRemainingMs] = useState(difficultyConfig.maxTimeMs);
  const [trialRemainingMs, setTrialRemainingMs] = useState(difficultyConfig.timeTrialMs);
  const [feedback, setFeedback] = useState('');
  const startTimeRef = useRef(Date.now());
  const lockRef = useRef(false);
  const finishedRef = useRef(false);

  const isTimeTrial = settings.mode === 'timeTrial';
  const currentNumber = answers.length + 1;
  const totalQuestions = isTimeTrial ? null : settings.iterations;
  const progressText = isTimeTrial ? `${answers.length} respondidas` : `${currentNumber} / ${totalQuestions}`;

  const finishRound = useCallback((finalAnswers) => {
    if (finishedRef.current) {
      return;
    }

    finishedRef.current = true;
    const summary = summarizeResults(finalAnswers);
    onFinish({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      playedAt: new Date().toISOString(),
      settings,
      difficultyLabel: DIFFICULTIES[settings.difficulty].label,
      modeLabel: GAME_MODES[settings.mode].label,
      summary,
      answers: finalAnswers,
    });
  }, [onFinish, settings]);

  const moveNext = useCallback((finalAnswers) => {
    if (!isTimeTrial && finalAnswers.length >= settings.iterations) {
      finishRound(finalAnswers);
      return;
    }

    lockRef.current = false;
    setFeedback('');
    setTypedAnswer('');
    setQuestion(generateQuestion(settings));
    setRemainingMs(difficultyConfig.maxTimeMs);
    startTimeRef.current = Date.now();
  }, [difficultyConfig.maxTimeMs, finishRound, isTimeTrial, settings]);

  const submitAnswer = useCallback((rawAnswer, timedOut = false) => {
    if (lockRef.current) {
      return;
    }

    lockRef.current = true;
    const responseTimeMs = timedOut ? null : Math.min(Date.now() - startTimeRef.current, difficultyConfig.maxTimeMs);
    const normalizedAnswer = settings.mode === 'classic' ? normalizeClassicAnswer(rawAnswer) : rawAnswer;
    const isCorrect = !timedOut && normalizedAnswer === question.correctAnswer;
    const points = scoreAnswer({
      difficulty: settings.difficulty,
      isCorrect,
      timedOut,
      responseTimeMs: responseTimeMs ?? difficultyConfig.maxTimeMs,
    });
    const result = {
      questionId: question.id,
      expression: question.expression,
      expectedAnswer: question.correctAnswer,
      submittedAnswer: timedOut ? null : normalizedAnswer,
      isCorrect,
      timedOut,
      responseTimeMs,
      points,
    };
    const finalAnswers = [...answers, result];

    setAnswers(finalAnswers);
    setFeedback(timedOut ? 'Tiempo expirado' : isCorrect ? `Correcto • +${points}` : `Incorrecto • ${points}`);

    if (isTimeTrial && (!isCorrect || timedOut)) {
      setTimeout(() => finishRound(finalAnswers), 500);
      return;
    }

    setTimeout(() => moveNext(finalAnswers), 500);
  }, [answers, difficultyConfig.maxTimeMs, finishRound, isTimeTrial, moveNext, question, settings.difficulty, settings.mode]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setRemainingMs(Math.max(0, difficultyConfig.maxTimeMs - elapsed));
    }, 100);

    return () => clearInterval(intervalId);
  }, [difficultyConfig.maxTimeMs, question.id]);

  useEffect(() => {
    if (remainingMs <= 0) {
      submitAnswer(null, true);
    }
  }, [remainingMs, submitAnswer]);

  useEffect(() => {
    if (!isTimeTrial) {
      return undefined;
    }

    const trialStartedAt = Date.now();
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - trialStartedAt;
      setTrialRemainingMs(Math.max(0, difficultyConfig.timeTrialMs - elapsed));
    }, 100);

    return () => clearInterval(intervalId);
  }, [difficultyConfig.timeTrialMs, isTimeTrial]);

  useEffect(() => {
    if (isTimeTrial && trialRemainingMs <= 0) {
      finishRound(answers);
    }
  }, [answers, finishRound, isTimeTrial, trialRemainingMs]);

  const timerRatio = useMemo(() => remainingMs / difficultyConfig.maxTimeMs, [difficultyConfig.maxTimeMs, remainingMs]);
  const trialRatio = useMemo(() => trialRemainingMs / difficultyConfig.timeTrialMs, [difficultyConfig.timeTrialMs, trialRemainingMs]);
  const runningScore = useMemo(() => answers.reduce((sum, answer) => sum + answer.points, 0), [answers]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <View>
            <Text style={styles.meta}>{GAME_MODES[settings.mode].label} • {DIFFICULTIES[settings.difficulty].label}</Text>
            <Text style={styles.progress}>{progressText}</Text>
          </View>
          <PrimaryButton title="Salir" variant="ghost" onPress={onCancel} />
        </View>

        {isTimeTrial && (
          <View style={styles.trialTimerWrap}>
            <View style={[styles.trialTimerFill, { width: `${trialRatio * 100}%` }]} />
            <Text style={styles.trialTimerText}>Tiempo de ronda: {(trialRemainingMs / 1000).toFixed(1)}s</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Puntaje</Text>
            <Text style={styles.scoreValue}>{runningScore}</Text>
          </View>

          <View style={styles.timerTrack}>
            <View style={[styles.timerFill, { width: `${timerRatio * 100}%` }]} />
          </View>
          <Text style={styles.timerText}>{(remainingMs / 1000).toFixed(1)}s restantes</Text>

          <Text style={styles.expression}>{question.expression}</Text>

          {settings.mode === 'classic' ? (
            <View>
              <TextInput
                autoFocus
                keyboardType="number-pad"
                onChangeText={setTypedAnswer}
                onSubmitEditing={() => submitAnswer(typedAnswer)}
                placeholder="Escribe tu respuesta"
                placeholderTextColor="#8891aa"
                returnKeyType="done"
                style={styles.input}
                value={typedAnswer}
              />
              <PrimaryButton title="Confirmar respuesta" onPress={() => submitAnswer(typedAnswer)} />
            </View>
          ) : settings.mode === 'trueFalse' ? (
            <View style={styles.choiceGrid}>
              <PrimaryButton title="Verdadero" onPress={() => submitAnswer(true)} />
              <PrimaryButton title="Falso" variant="secondary" onPress={() => submitAnswer(false)} />
            </View>
          ) : (
            <View style={styles.choiceGrid}>
              {question.choices.map((choice) => (
                <PrimaryButton key={choice} title={`${choice}`} variant="secondary" onPress={() => submitAnswer(choice)} />
              ))}
            </View>
          )}

          {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}
        </View>

        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Scoring</Text>
          <Text style={styles.rulesText}>
            Las respuestas correctas otorgan una puntuación basada en la dificultad más un bonus variable por velocidad. Los errores y los tiempos expirados restan puntos.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    backgroundColor: '#f5f7ff',
    flexGrow: 1,
    padding: 20,
    paddingBottom: 42,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: '#6f7894',
    fontSize: 14,
    fontWeight: '800',
  },
  progress: {
    color: '#17213f',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  trialTimerWrap: {
    backgroundColor: '#dfe5ff',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginVertical: 16,
    overflow: 'hidden',
  },
  trialTimerFill: {
    backgroundColor: '#6fffe9',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  trialTimerText: {
    color: '#17213f',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    elevation: 3,
    marginTop: 16,
    padding: 22,
    shadowColor: '#223',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  scoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  scoreLabel: {
    color: '#6f7894',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  scoreValue: {
    color: '#17213f',
    fontSize: 28,
    fontWeight: '900',
  },
  timerTrack: {
    backgroundColor: '#dfe5ff',
    borderRadius: 999,
    height: 12,
    overflow: 'hidden',
  },
  timerFill: {
    backgroundColor: '#3957ff',
    height: '100%',
  },
  timerText: {
    color: '#6f7894',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 7,
    textAlign: 'right',
  },
  expression: {
    color: '#17213f',
    fontSize: 46,
    fontWeight: '900',
    marginVertical: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f7ff',
    borderColor: '#cfd8ff',
    borderRadius: 18,
    borderWidth: 1,
    color: '#17213f',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
    padding: 16,
    textAlign: 'center',
  },
  choiceGrid: {
    gap: 8,
  },
  feedback: {
    color: '#17213f',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 16,
    textAlign: 'center',
  },
  rulesCard: {
    backgroundColor: '#e9edff',
    borderRadius: 20,
    marginTop: 16,
    padding: 16,
  },
  rulesTitle: {
    color: '#17213f',
    fontSize: 16,
    fontWeight: '900',
  },
  rulesText: {
    color: '#6f7894',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 5,
  },
});