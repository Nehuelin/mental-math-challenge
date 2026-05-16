import { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DEFAULT_ITERATIONS } from './src/constants/gameConfig';
import { SetupScreen } from './src/screens/SetupScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ScoreRevealScreen } from './src/screens/ScoreRevealScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { clearHistory, loadHistory, saveRoundResult } from './src/services/historyStorage';

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [difficulty, setDifficulty] = useState('easy');
  const [mode, setMode] = useState('classic');
  const [iterations, setIterations] = useState(DEFAULT_ITERATIONS);
  const [dynamicDifficulty, setDynamicDifficulty] = useState(false);
  const [history, setHistory] = useState([]);
  const [lastRound, setLastRound] = useState(null);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    let mounted = true;

    loadHistory()
      .then((storedHistory) => {
        if (mounted) {
          setHistory(storedHistory);
        }
      })
      .catch(() => {
        if (mounted) {
          setStorageError('Local history could not be loaded on this device.');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const settings = useMemo(() => ({ difficulty, mode, iterations, dynamicDifficulty }), [difficulty, dynamicDifficulty, mode, iterations]);

  const startRound = useCallback(() => {
    setLastRound(null);
    setScreen('game');
  }, []);

  const finishRound = useCallback((round) => {
    setLastRound(round);
    setScreen('scoreReveal');
    saveRoundResult(round)
      .then(setHistory)
      .catch(() => setStorageError('Round finished, but local history could not be saved.'));
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory()
      .then(setHistory)
      .catch(() => setStorageError('Local history could not be cleared.'));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {!!storageError && <Text style={styles.storageError}>{storageError}</Text>}
      {screen === 'setup' && (
        <SetupScreen
          difficulty={difficulty}
          dynamicDifficulty={dynamicDifficulty}
          history={history}
          iterations={iterations}
          mode={mode}
          onClearHistory={handleClearHistory}
          onDifficultyChange={setDifficulty}
          onDynamicDifficultyChange={setDynamicDifficulty}
          onIterationsChange={setIterations}
          onModeChange={setMode}
          onStart={startRound}
        />
      )}
      {screen === 'game' && <GameScreen settings={settings} onCancel={() => setScreen('setup')} onFinish={finishRound} />}
      {screen === 'scoreReveal' && lastRound && <ScoreRevealScreen round={lastRound} onContinue={() => setScreen('summary')} />}
      {screen === 'summary' && lastRound && (
        <SummaryScreen round={lastRound} onHome={() => setScreen('setup')} onRestart={startRound} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#17213f',
    flex: 1,
  },
  storageError: {
    backgroundColor: '#fff0f3',
    color: '#c93d5a',
    fontSize: 13,
    fontWeight: '800',
    padding: 10,
    textAlign: 'center',
  },
});
