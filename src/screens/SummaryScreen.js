import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatCard } from '../components/StatCard';

export function SummaryScreen({ round, onRestart, onHome }){
  const { summary } = round;

  return(
		<ScrollView contentContainerStyle={styles.container}>
			<View style={styles.header}>
				<Text style={styles.eyebrow}>Ronda completada</Text>
				<Text style={styles.title}>{summary.score} puntos</Text>
				<Text style={styles.subtitle}>{round.modeLabel} • {round.difficultyLabel}</Text>
			</View>

			<View style={styles.statsRow}>
				<StatCard label="Precisión" value={`${summary.accuracy}%`}></StatCard>
				<StatCard label="Correctas" value={summary.correct} />
        <StatCard label="Incorrectas" value={summary.incorrect} />
        <StatCard label="Fuera de tiempo" value={summary.timedOut} />
        <StatCard label="Tiempo promedio" value={`${(summary.averageResponseMs / 1000).toFixed(2)}s`} />
        <StatCard label="Preguntas totales" value={summary.total} />
			</View>

			<View style={styles.section}>
        <Text style={styles.sectionTitle}>Registro de preguntas</Text>
        {round.answers.map((answer, index) => (
          <View key={`${answer.questionId}-${index}`} style={styles.answerRow}>
            <Text style={styles.answerExpression}>{index + 1}. {answer.expression}</Text>
            <Text style={[styles.answerMeta, answer.isCorrect ? styles.correct : styles.incorrect]}>
              {answer.timedOut ? 'Sin respuesta' : answer.isCorrect ? 'Correcta' : 'Incorrecta'} • {answer.points} puntos •{' '}
              {answer.responseTimeMs === null ? '—' : `${(answer.responseTimeMs / 1000).toFixed(2)}s`}
            </Text>
          </View>
        ))}
      </View>

      <PrimaryButton title="Reiniciar con la misma configuración" onPress={onRestart} />
      <PrimaryButton title="Volver a configurar" variant="secondary" onPress={onHome} />
		</ScrollView>
	);
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f7ff',
    padding: 20,
    paddingBottom: 42,
  },
  header: {
    backgroundColor: '#17213f',
    borderRadius: 28,
    marginBottom: 16,
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
    fontSize: 40,
    fontWeight: '900',
    marginTop: 8,
  },
  subtitle: {
    color: '#c8d0ea',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  section: {
    marginVertical: 14,
  },
  sectionTitle: {
    color: '#17213f',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  answerRow: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 8,
    padding: 14,
  },
  answerExpression: {
    color: '#17213f',
    fontSize: 16,
    fontWeight: '900',
  },
  answerMeta: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 5,
  },
  correct: {
    color: '#12805c',
  },
  incorrect: {
    color: '#c93d5a',
  },
});

