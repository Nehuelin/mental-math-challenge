import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { StatCard } from '../components/StatCard';
import PieChart from 'react-native-pie-chart';

const formatSeconds = (ms) => `${(ms / 1000).toFixed(2)}s`;
const formatPercent = (value, total) => `${((value * 100) / total).toFixed(1)}%`;

export function SummaryScreen({ round, onRestart, onHome }){
  const [showStatCards, setShowStatCards] = useState(false);
  const [showQuestionRegister, setShowQuestionRegister] = useState(false);
  const { summary } = round;
  const maxResponseTime = Math.max(...round.answers.map((answer) => answer.timeLimitMs ?? answer.responseTimeMs ?? 1), 1);
  const largestScorePart = Math.max(
    summary.scoreBreakdown.basePoints,
    summary.scoreBreakdown.speedBonus,
    summary.scoreBreakdown.quickBonus,
    Math.abs(summary.scoreBreakdown.penalties),
    1,
  );

  const accuracySeries = [
    { value: summary.incorrect, color: '#c93d5a' },
    { value: summary.correct, color: '#3957ff' },
    { value: summary.timedOut, color: '#929293' },
  ].filter((slice) => slice.value > 0)
    .map((slice) => ({
      ...slice,
      label: { text: formatPercent(slice.value, summary.total), fontWeight: 800 },
    }));

  const scoreParts = [
    { label: 'Base', value: summary.scoreBreakdown.basePoints, color: '#3957ff' },
    { label: 'Velocidad', value: summary.scoreBreakdown.speedBonus, color: '#12805c' },
    { label: 'Rapidez extra', value: summary.scoreBreakdown.quickBonus, color: '#6fffe9' },
    { label: 'Penalizaciones', value: Math.abs(summary.scoreBreakdown.penalties), rawValue: summary.scoreBreakdown.penalties, color: '#c93d5a' },
  ].filter((part) => part.value > 0);

  return(
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Ronda completada</Text>
        <Text style={styles.title}>{summary.score} puntos</Text>
        <Text style={styles.subtitle}>{round.modeLabel} • {round.difficultyLabel}</Text>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.deployableHeader} onPress={() => setShowStatCards((current) => !current)}>
          <Text style={styles.sectionTitle}>Resumen de estadísticas</Text>
          <Text style={styles.deployableIcon}>{showStatCards ? '▲' : '▼'}</Text>
        </Pressable>
        {showStatCards && (
          <View style={styles.statsRow}>
            <StatCard label="Precisión" value={`${summary.accuracy}%`}></StatCard>
            <StatCard label="Correctas" value={summary.correct} />
            <StatCard label="Incorrectas" value={summary.incorrect} />
            <StatCard label="Fuera de tiempo" value={summary.timedOut} />
            <StatCard label="Tiempo promedio" value={formatSeconds(summary.averageResponseMs)} />
            <StatCard label="Más rápida" value={formatSeconds(summary.fastestResponseMs)} />
            <StatCard label="Más lenta" value={formatSeconds(summary.slowestResponseMs)} />
            <StatCard label="Preguntas totales" value={summary.total} />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gráfica de precisión</Text>
        <View style={styles.pieWrap}>
          <PieChart widthAndHeight={250} series={accuracySeries}/>
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendText}>Correctas: {summary.correct}</Text>
          <Text style={styles.legendText}>Fallos / tiempo: {summary.incorrect}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desglose de puntaje</Text>
        {scoreParts.map((part) => (
          <View key={part.label} style={styles.chartRow}>
            <Text style={styles.chartLabel}>{part.label}</Text>
            <View style={styles.chartTrack}>
              <View style={[styles.chartFill, { backgroundColor: part.color, width: `${(part.value / largestScorePart) * 100}%` }]} />
            </View>
            <Text style={styles.chartValue}>{part.rawValue ?? part.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Velocidad por pregunta</Text>
        <View style={styles.speedChart}>
          {round.answers.map((answer, index) => {
            const responseTime = answer.responseTimeMs ?? (answer.timeLimitMs ?? maxResponseTime);
            const height = Math.max(8, (responseTime / maxResponseTime) * 110);
            return (
              <View key={`${answer.questionId}-bar-${index}`} style={styles.speedBarWrap}>
                <View style={[styles.speedBar, answer.isCorrect ? styles.speedBarCorrect : styles.speedBarIncorrect, { height }]} />
                <Text style={styles.speedBarLabel}>{index + 1}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.deployableHeader} onPress={() => setShowQuestionRegister((current) => !current)}>
          <Text style={styles.sectionTitle}>Registro de preguntas</Text>
          <Text style={styles.deployableIcon}>{showQuestionRegister ? '▲' : '▼'}</Text>
        </Pressable>
        {showQuestionRegister && round.answers.map((answer, index) => (
          <View key={`${answer.questionId}-${index}`} style={styles.answerRow}>
            <Text style={styles.answerExpression}>{index + 1}. {answer.expression}</Text>
            <Text style={[styles.answerMeta, answer.isCorrect ? styles.correct : styles.incorrect]}>
              {answer.timedOut ? 'Sin respuesta' : answer.isCorrect ? 'Correcta' : 'Incorrecta'} | {answer.points} puntos |{' '}
              {answer.responseTimeMs === null ? '—' : formatSeconds(answer.responseTimeMs)} | Límite {formatSeconds(answer.timeLimitMs ?? 0)}
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
    backgroundColor: '#ffffff',
    borderRadius: 22,
    marginVertical: 14,
    padding: 16
  },
  sectionTitle: {
    color: '#17213f',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },
  deployableHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deployableIcon: {
    color: '#6f7894',
    fontSize: 12,
    fontWeight: '900',
  },
  accuracyTrack: {
    backgroundColor: '#f5f7ff',
    borderRadius: 999,
    flexDirection: 'row',
    height: 20,
    overflow: 'hidden',
  },
  accuracyCorrect: {
    backgroundColor: '#12805c',
  },
  accuracyIncorrect: {
    backgroundColor: '#c93d5a',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  legendText: {
    color: '#6f7894',
    fontSize: 12,
    fontWeight: '800',
  },
  pieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  chartRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  chartLabel: {
    color: '#17213f',
    fontSize: 13,
    fontWeight: '900',
    width: 92,
  },
  chartTrack: {
    backgroundColor: '#f5f7ff',
    borderRadius: 999,
    flex: 1,
    height: 14,
    overflow: 'hidden',
  },
  chartFill: {
    borderRadius: 999,
    height: '100%',
  },
  chartValue: {
    color: '#6f7894',
    fontSize: 13,
    fontWeight: '900',
    minWidth: 38,
    textAlign: 'right',
  },
  speedChart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    minHeight: 140,
  },
  speedBarWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  speedBar: {
    borderRadius: 999,
    maxWidth: 28,
    width: '100%',
  },
  speedBarCorrect: {
    backgroundColor: '#3957ff',
  },
  speedBarIncorrect: {
    backgroundColor: '#c93d5a',
  },
  speedBarLabel: {
    color: '#6f7894',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 5,
  },
  answerRow: {
    backgroundColor: '#f5f7ff',
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

