import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DIFFICULTIES, GAME_MODES, ITERATION_OPTIONS } from '../constants/gameConfig';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatCard } from '../components/StatCard';

export function SetupScreen({
  difficulty,
  mode,
  iterations,
  dynamicDifficulty,
  history,
  onDifficultyChange,
  onModeChange,
  onIterationsChange,
  onDynamicDifficultyChange,
  onStart,
  onClearHistory,
}) {
  const bestScore = history.length ? Math.max(...history.map((round) => round.summary.score)) : 0;
  const roundsPlayed = history.length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Juego de Cálculo Mental</Text>
        <Text style={styles.title}>Gánale al reloj utilizando aritmética rápida.</Text>
        <Text style={styles.subtitle}>Configura las rondas y resuelve las operaciones.</Text>
        {/* <Text style={styles.subtitle}>Tu velocidad, precisión, puntaje e historial se guardan localmente.</Text> */}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dificultad</Text>
        <View style={styles.grid}>
          {Object.entries(DIFFICULTIES).map(([key, config]) => (
            <PrimaryButton
              key={key}
              title={`${config.label} • ${(config.maxTimeMs / 1000).toFixed(1)}s`}
              selected={difficulty === key}
              variant="ghost"
              onPress={() => onDifficultyChange(key)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dificultad dinámica</Text>
        <View style={styles.dynamicCard}>
          <Text style={styles.modeDescription}>
            Reduce gradualmente el tiempo disponible después de cada acierto. Respuestas incorrectas aumentan el tiempo.
          </Text>
          <PrimaryButton
            title={dynamicDifficulty ? 'Activada' : 'Desactivada'}
            selected={dynamicDifficulty}
            variant="ghost"
            onPress={() => onDynamicDifficultyChange(!dynamicDifficulty)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modo de juego</Text>
        {Object.entries(GAME_MODES).map(([key, config]) => (
          <View key={key} style={styles.modeRow}>
            <PrimaryButton title={config.label} selected={mode === key} variant="ghost" onPress={() => onModeChange(key)} />
            <Text style={styles.modeDescription}>{config.description}</Text>
          </View>
        ))}
      </View>

      {mode !== 'timeTrial' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Iteraciones por ronda</Text>
          <View style={styles.iterations}>
            {ITERATION_OPTIONS.map((value) => (
              <PrimaryButton
                key={value}
                title={`${value}`}
                selected={iterations === value}
                variant="ghost"
                onPress={() => onIterationsChange(value)}
              />
            ))}
          </View>
        </View>
      )}

      <PrimaryButton title="Iniciar juego" onPress={onStart} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progreso</Text>
        <View style={styles.statsRow}>
          <StatCard label="High score" value={bestScore} />
          <StatCard label="Rondas guardadas" value={roundsPlayed} />
        </View>
        {history.slice(0, 5).map((round) => (
          <View key={round.id} style={styles.historyItem}>
            <Text style={styles.historyTitle}>{round.modeLabel} • {round.difficultyLabel}</Text>
            <Text style={styles.historyMeta}>
              {round.summary.score} puntos • {round.summary.accuracy}% precisión • {new Date(round.playedAt).toLocaleDateString()}
            </Text>
          </View>
        ))}
        {history.length > 0 && <PrimaryButton title="Limpiar historial" variant="danger" onPress={onClearHistory} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f7ff',
    padding: 20,
    paddingBottom: 42,
  },
  hero: {
    backgroundColor: '#17213f',
    borderRadius: 28,
    marginBottom: 18,
    padding: 24,
  },
  eyebrow: {
    color: '#6fffe9',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 39,
    marginTop: 10,
  },
  subtitle: {
    color: '#c8d0ea',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 12,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    color: '#17213f',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  grid: {
    gap: 6,
  },
  dynamicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    gap: 8,
    padding: 10,
  },
  modeRow: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginBottom: 10,
    padding: 10,
  },
  modeDescription: {
    color: '#6f7894',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  iterations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 8,
    padding: 14,
  },
  historyTitle: {
    color: '#17213f',
    fontSize: 15,
    fontWeight: '900',
  },
  historyMeta: {
    color: '#6f7894',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
});