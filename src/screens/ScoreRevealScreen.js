import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useSoundEffects } from '../hooks/useSoundEffects';

const buildMilestones = (breakdown) => [
  { key: 'basePoints', label: 'Puntaje base', value: breakdown.basePoints },
  { key: 'speedBonus', label: 'Bonus de velocidad', value: breakdown.speedBonus },
  { key: 'quickBonus', label: 'Bonus de respuestas rápidas', value: breakdown.quickBonus },
  { key: 'penalties', label: 'Penalizaciones', value: breakdown.penalties },
].filter((milestone) => milestone.value !== 0);

export function ScoreRevealScreen({ round, onContinue }) {
  const playSound = useSoundEffects();
  const animatedScore = useRef(new Animated.Value(0)).current;
  const [displayedScore, setDisplayedScore] = useState(0);
  const [revealedKeys, setRevealedKeys] = useState([]);
  const [finished, setFinished] = useState(false);
  const milestones = useMemo(() => buildMilestones(round.summary.scoreBreakdown), [round.summary.scoreBreakdown]);

  useEffect(() => {
    const listenerId = animatedScore.addListener(({ value }) => setDisplayedScore(Math.round(value)));
    return () => animatedScore.removeListener(listenerId);
  }, [animatedScore]);

  useEffect(() => {
    let cancelled = false;
    let runningTotal = 0;

    const runMilestones = async () => {
      for (const milestone of milestones) {
        if (cancelled) {
          return;
        }

        const nextTotal = runningTotal + milestone.value;
        setRevealedKeys((keys) => [...keys, milestone.key]);
        if (milestone.value > 0) {
          playSound('coins');
        } else if (milestone.value < 0){
          playSound('evilCoins');
        }

        await new Promise((resolve) => {
          Animated.timing(animatedScore, {
            toValue: nextTotal,
            duration: 2200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start(resolve);
        });
        runningTotal = nextTotal;
      }

      if (!cancelled) {
        setFinished(true);
      }
    };

    runMilestones();
    return () => {
      cancelled = true;
      animatedScore.stopAnimation();
    };
  }, [animatedScore, milestones, playSound]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Puntaje de la ronda</Text>
        <Text style={styles.score}>{displayedScore}</Text>
        <Text style={styles.subtitle}>{round.modeLabel} • {round.difficultyLabel}</Text>
      </View>

      <View style={styles.breakdownCard}>
        <Text style={styles.sectionTitle}>Desglose animado</Text>
        {milestones.map((milestone) => {
          const revealed = revealedKeys.includes(milestone.key);
          return (
            <View key={milestone.key} style={[styles.milestoneRow, revealed && styles.milestoneActive]}>
              <Text style={styles.milestoneLabel}>{milestone.label}</Text>
              <Text style={[styles.milestoneValue, milestone.value < 0 && styles.negativeValue]}>
                {milestone.value > 0 ? '+' : ''}{milestone.value}
              </Text>
            </View>
          );
        })}
      </View>

      {finished && <PrimaryButton title="Ver estadísticas" onPress={onContinue} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f7ff',
    flexGrow: 1,
    padding: 20,
    paddingBottom: 42,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#17213f',
    borderRadius: 30,
    padding: 28,
  },
  eyebrow: {
    color: '#6fffe9',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  score: {
    color: '#ffffff',
    fontSize: 76,
    fontWeight: '900',
    marginTop: 10,
  },
  subtitle: {
    color: '#c8d0ea',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginTop: 16,
    padding: 18,
  },
  sectionTitle: {
    color: '#17213f',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },
  milestoneRow: {
    alignItems: 'center',
    backgroundColor: '#f5f7ff',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    opacity: 0.45,
    padding: 14,
  },
  milestoneActive: {
    opacity: 1,
  },
  milestoneLabel: {
    color: '#17213f',
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  milestoneValue: {
    color: '#12805c',
    fontSize: 18,
    fontWeight: '900',
  },
  negativeValue: {
    color: '#c93d5a',
  },
  coinCard: {
    alignItems: 'center',
    backgroundColor: '#fff8d7',
    borderRadius: 24,
    marginVertical: 16,
    padding: 18,
  },
  coin: {
    fontSize: 42,
  },
  coinText: {
    color: '#6f7894',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
});