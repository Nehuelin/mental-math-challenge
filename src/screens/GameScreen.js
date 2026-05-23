import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DIFFICULTIES, GAME_MODES } from '../constants/gameConfig';
import { PrimaryButton } from '../components/PrimaryButton';
import { generateQuestion, normalizeClassicAnswer } from '../utils/mathGame';
import { getScoreBreakdown, summarizeResults } from '../utils/scoring';
import { useSoundEffects } from '../hooks/useSoundEffects';

export function GameScreen({ settings, onCancel, onFinish }) {
  const difficultyConfig = DIFFICULTIES[settings.difficulty];
  const playSound = useSoundEffects();
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [question, setQuestion] = useState(() => generateQuestion(settings));
  const [answers, setAnswers] = useState([]);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [questionTimeLimitMs, setQuestionTimeLimitMs] = useState(difficultyConfig.maxTimeMs);
  const [remainingMs, setRemainingMs] = useState(difficultyConfig.maxTimeMs);
  const [trialRemainingMs, setTrialRemainingMs] = useState(difficultyConfig.timeTrialMs);
  const [feedback, setFeedback] = useState('');
  const [trialBonusLabel, setTrialBonusLabel] = useState('');
  const feedbackScale = useRef(new Animated.Value(1)).current;
  const driftA = useRef(new Animated.Value(0)).current;
  const driftB = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const trialBonusFade = useRef(new Animated.Value(0)).current;
  const startTimeRef = useRef(Date.now());
  const trialStartTimeRef = useRef(null);
  const trialBonusMsRef = useRef(0);
  const lockRef = useRef(false);
  const finishedRef = useRef(false);

  const isTimeTrial = settings.mode === 'timeTrial';
  const dynamicDifficultyEnabled = !!settings.dynamicDifficulty;
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

  const animateFeedback = useCallback(() => {
    feedbackScale.setValue(0.94);
    Animated.spring(feedbackScale, {
      toValue: 1,
      friction: 4,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [feedbackScale]);

  const animateTrialBonus = useCallback((bonusMs) => {
    if (!bonusMs) {
      return;
    }

    setTrialBonusLabel(`+${(bonusMs / 1000).toFixed(1)}s`);
    trialBonusFade.stopAnimation();
    trialBonusFade.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(trialBonusFade, {
          toValue: 1,
          duration: 170,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(trialBonusFade, {
          toValue: 0.65,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(trialBonusFade, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => setTrialBonusLabel(''));
  }, [trialBonusFade]);

  const moveNext = useCallback((finalAnswers, nextTimeLimitMs) => {
    if (!isTimeTrial && finalAnswers.length >= settings.iterations) {
      finishRound(finalAnswers);
      return;
    }

    lockRef.current = false;
    setFeedback('');
    setTypedAnswer('');
    setQuestion(generateQuestion(settings));
    setQuestionTimeLimitMs(nextTimeLimitMs);
    setRemainingMs(nextTimeLimitMs);
    startTimeRef.current = Date.now();
  }, [finishRound, isTimeTrial, settings]);

  const submitAnswer = useCallback((rawAnswer, timedOut = false) => {
    if (lockRef.current || !gameStarted) {
      return;
    }

    lockRef.current = true;
    const responseTimeMs = timedOut ? null : Math.min(Date.now() - startTimeRef.current, questionTimeLimitMs);
    const normalizedAnswer = settings.mode === 'classic' ? normalizeClassicAnswer(rawAnswer) : rawAnswer;
    const isCorrect = !timedOut && normalizedAnswer === question.correctAnswer;
    const scoreBreakdown = getScoreBreakdown({
      difficulty: settings.difficulty,
      isCorrect,
      timedOut,
      responseTimeMs: responseTimeMs ?? questionTimeLimitMs,
    });
    const nextTimeLimitMs = (() => {
      if (!dynamicDifficultyEnabled) {
        return questionTimeLimitMs;
      }

      if (isCorrect) {
        return Math.max(difficultyConfig.minDynamicTimeMs, questionTimeLimitMs - difficultyConfig.dynamicTimeStepMs);
      }

      const recoveryGap = Math.max(0, difficultyConfig.maxTimeMs - questionTimeLimitMs);
      const recoveryStepMs = Math.max(
        Math.round(difficultyConfig.dynamicTimeStepMs * 0.6),
        Math.round(recoveryGap * 0.2),
      );

      return Math.min(difficultyConfig.maxTimeMs, questionTimeLimitMs + recoveryStepMs);
    })();
    const difficultyBoosted = nextTimeLimitMs < questionTimeLimitMs;
    const trialTimeBonusMs = isTimeTrial && isCorrect
      ? ({ easy: 2500, medium: 2000, hard: 1500 }[settings.difficulty] || 0)
      : 0;

    if (trialTimeBonusMs > 0) {
      trialBonusMsRef.current += trialTimeBonusMs;
      setTrialRemainingMs((current) => current + trialTimeBonusMs);
      animateTrialBonus(trialTimeBonusMs);
    }

    const result = {
      questionId: question.id,
      expression: question.expression,
      expectedAnswer: question.correctAnswer,
      submittedAnswer: timedOut ? null : normalizedAnswer,
      isCorrect,
      timedOut,
      responseTimeMs,
      timeLimitMs: questionTimeLimitMs,
      difficultyBoosted,
      points: scoreBreakdown.points,
      scoreBreakdown,
    };
    const finalAnswers = [...answers, result];

    setAnswers(finalAnswers);
    setFeedback(timedOut ? 'Tiempo expirado' : isCorrect ? `Correcto • +${scoreBreakdown.points}` : `Incorrecto • ${scoreBreakdown.points}`);
    animateFeedback();
    playSound(isCorrect ? 'iterationGood' : 'iterationBad');

    if (difficultyBoosted) {
      setTimeout(() => playSound('levelUp'), 220);
    }

    if (isTimeTrial && (!isCorrect || timedOut)) {
      setTimeout(() => finishRound(finalAnswers), 650);
      return;
    }

    setTimeout(() => moveNext(finalAnswers, nextTimeLimitMs), 650);
  }, [animateFeedback, animateTrialBonus, answers, difficultyConfig.dynamicTimeStepMs, difficultyConfig.minDynamicTimeMs, dynamicDifficultyEnabled, finishRound, gameStarted, isTimeTrial, moveNext, playSound, question, questionTimeLimitMs, settings.difficulty, settings.mode]);

  useEffect(() => {
    if (gameStarted) {
      return undefined;
    }

    if (countdown > 0) {
      playSound('preroundCountdown');
      const timeoutId = setTimeout(() => setCountdown((value) => value - 1), 1000);
      return () => clearTimeout(timeoutId);
    }

    startTimeRef.current = Date.now();
    trialStartTimeRef.current = Date.now();
    setGameStarted(true);
    return undefined;
  }, [countdown, gameStarted, playSound]);

  useEffect(() => {
    if (!gameStarted) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setRemainingMs(Math.max(0, questionTimeLimitMs - elapsed));
    }, 100);

    return () => clearInterval(intervalId);
  }, [gameStarted, question.id, questionTimeLimitMs]);

  useEffect(() => {
    if (gameStarted && remainingMs <= 0) {
      submitAnswer(null, true);
    }
  }, [gameStarted, remainingMs, submitAnswer]);

  useEffect(() => {
    if (!isTimeTrial || !gameStarted) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - trialStartTimeRef.current;
      setTrialRemainingMs(Math.max(0, difficultyConfig.timeTrialMs + trialBonusMsRef.current - elapsed));
    }, 100);

    return () => clearInterval(intervalId);
  }, [difficultyConfig.timeTrialMs, gameStarted, isTimeTrial]);

  useEffect(() => {
    if (gameStarted && isTimeTrial && trialRemainingMs <= 0) {
      finishRound(answers);
    }
  }, [answers, finishRound, gameStarted, isTimeTrial, trialRemainingMs]);

  const timerRatio = useMemo(() => remainingMs / questionTimeLimitMs, [questionTimeLimitMs, remainingMs]);
  const trialRatio = useMemo(() => Math.min(1, trialRemainingMs / difficultyConfig.timeTrialMs), [difficultyConfig.timeTrialMs, trialRemainingMs]);
  const runningScore = useMemo(() => answers.reduce((sum, answer) => sum + answer.points, 0), [answers]);

  // ANIMACION DE FONDO
  useEffect(() => {
    const animationA = Animated.loop(
      Animated.sequence([
        Animated.timing(driftA, {
          toValue: 1,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(driftA, {
          toValue: 0,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const animationB = Animated.loop(
      Animated.sequence([
        Animated.timing(driftB, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(driftB, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animationA.start();
    animationB.start();
    pulseAnimation.start();

    return () => {
      animationA.stop();
      animationB.stop();
      pulseAnimation.stop();
    };
  }, [driftA, driftB, pulse]);

  const distractionBlobAStyle = useMemo(() => ({
    transform: [
      {
        translateX: driftA.interpolate({
          inputRange: [0, 1],
          outputRange: [-32, 38],
        }),
      },
      {
        translateY: driftA.interpolate({
          inputRange: [0, 1],
          outputRange: [-24, 28],
        }),
      },
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        }),
      },
    ],
  }), [driftA, pulse]);

  const distractionBlobBStyle = useMemo(() => ({
    transform: [
      {
        translateX: driftB.interpolate({
          inputRange: [0, 1],
          outputRange: [35, -30],
        }),
      },
      {
        translateY: driftB.interpolate({
          inputRange: [0, 1],
          outputRange: [26, -22],
        }),
      },
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1.18, 0.95],
        }),
      },
    ],
  }), [driftB, pulse]);

  if (!gameStarted) {
    return (
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownEyebrow}>Prepárate</Text>
        <Text style={styles.countdownNumber}>{countdown || '¡YA!'}</Text>
        <Text style={styles.countdownText}>La ronda empieza en segundos...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View pointerEvents="none" style={styles.distractionBackground}>
        <Animated.View style={[styles.distractionBlob, styles.distractionBlobA, distractionBlobAStyle]} />
        <Animated.View style={[styles.distractionBlob, styles.distractionBlobB, distractionBlobBStyle]} />
        <Animated.View style={[styles.distractionRing, distractionBlobBStyle]} />
      </View>


      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <View>
            <Text style={styles.meta}>{GAME_MODES[settings.mode].label} • {DIFFICULTIES[settings.difficulty].label}</Text>
            <Text style={styles.progress}>{progressText}</Text>
          </View>
          <PrimaryButton title="Salir" variant="ghost" onPress={onCancel} />
        </View>

        {isTimeTrial && (
          <View style={styles.trialTimerContainer}>
            <Animated.Text
              pointerEvents="none"
              style={[
                styles.trialBonusText,
                {
                  opacity: trialBonusFade,
                  transform: [
                    {
                      translateY: trialBonusFade.interpolate({
                        inputRange: [0, 1],
                        outputRange: [4, -16],
                      }),
                    },
                    {
                      scale: trialBonusFade.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.92, 1.08],
                      }),
                    },
                  ],
                },
              ]}
            >
              {trialBonusLabel}
            </Animated.Text>
            <View style={styles.trialTimerWrap}>
              <View style={[styles.trialTimerFill, { width: `${trialRatio * 100}%` }]} />
              <Text style={styles.trialTimerText}>Tiempo de ronda: {(trialRemainingMs / 1000).toFixed(1)}s</Text>
            </View>
          </View>
        )}

        {dynamicDifficultyEnabled && (
          <View style={styles.dynamicPill}>
            <Text style={styles.dynamicPillText}>Dificultad dinámica: {(questionTimeLimitMs / 1000).toFixed(1)}s por pregunta</Text>
          </View>
        )}

        <Animated.View style={[styles.card, { transform: [{ scale: feedbackScale }] }]}>
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
        </Animated.View>

        {/* <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Scoring</Text>
          <Text style={styles.rulesText}>
            Las respuestas correctas otorgan una puntuación basada en la dificultad más un bonus variable por velocidad. Los errores y los tiempos expirados restan puntos.
          </Text>
        </View> */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  countdownContainer: {
    alignItems: 'center',
    backgroundColor: '#17213f',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  countdownEyebrow: {
    color: '#6fffe9',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  countdownNumber: {
    color: '#ffffff',
    fontSize: 110,
    fontWeight: '900',
    marginVertical: 12,
  },
  countdownText: {
    color: '#c8d0ea',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 42,
  },
  distractionBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f7ff',
    overflow: 'hidden',
  },
  distractionBlob: {
    borderRadius: 999,
    opacity: 0.18,
    position: 'absolute',
  },
  distractionBlobA: {
    backgroundColor: '#3957ff',
    height: 260,
    left: -84,
    top: 88,
    width: 260,
  },
  distractionBlobB: {
    backgroundColor: '#ff3d8b',
    bottom: 106,
    height: 230,
    right: -76,
    width: 230,
  },
  distractionRing: {
    borderColor: '#06d6a0',
    borderRadius: 999,
    borderWidth: 20,
    height: 190,
    left: 108,
    opacity: 0.22,
    position: 'absolute',
    top: 288,
    width: 190,
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
  trialTimerContainer: {
    marginVertical: 16,
    position: 'relative'
  },
  trialTimerWrap: {
    backgroundColor: '#dfe5ff',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trialTimerFill: {
    backgroundColor: '#6fffe9',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  trialBonusText: {
    color: '#12805c',
    fontSize: 18,
    fontWeight: '900',
    left: 0,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
    top: -24,
  },
  trialTimerText: {
    color: '#17213f',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  dynamicPill: {
    backgroundColor: '#e9fff9',
    borderColor: '#6fffe9',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  dynamicPillText: {
    color: '#12805c',
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
    fontSize: 18,
    fontWeight: '900',
    marginTop: 16,
    textAlign: 'center',
  },
  rulesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginTop: 14,
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