import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
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
  const previousScreenRef = useRef(screen);
  const transitionOpacity = useRef(new Animated.Value(1)).current;
  const transitionTranslate = useRef(new Animated.Value(0)).current;

  const setupMusic = useAudioPlayer(require('./assets/music/NMT-choose.mp3'));
  const gameMusic1991 = useAudioPlayer(require('./assets/music/1991.mp3'));
  const gameMusicField = useAudioPlayer(require('./assets/music/Field.mp3'));
  const gameMusicHighTogether = useAudioPlayer(require('./assets/music/High-Together.mp3'))
  const gameMusicEnsenada= useAudioPlayer(require('./assets/music/Ensenada.mp3'))
  const endMusic = useAudioPlayer(require('./assets/music/Tomorrowland.mp3'));

  const stopAllMusic = useCallback(() => {
    [setupMusic, gameMusic1991, gameMusicField, gameMusicHighTogether, gameMusicEnsenada, endMusic].forEach((player) => {
      player.pause();
      player.seekTo(0);
    });
  }, [endMusic, gameMusic1991, gameMusicField, gameMusicEnsenada, gameMusicHighTogether, setupMusic]);

  const playMusic = useCallback((player) => {
    setAudioModeAsync({ playsInSilentMode: true });
    stopAllMusic();
    player.seekTo(0);
    player.play();
  }, [stopAllMusic]);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
    [setupMusic, gameMusic1991, gameMusicField, gameMusicHighTogether, gameMusicEnsenada, endMusic].forEach((player) => {
      player.loop = true;
    });
  }, [endMusic, gameMusic1991, gameMusicField, gameMusicHighTogether, gameMusicEnsenada, setupMusic]);

  useEffect(() => {
    const previousScreen = previousScreenRef.current;

    if (screen === 'setup') {
      playMusic(setupMusic);
    } else if (screen === 'game' && previousScreen !== 'game') {
      const gameTracks = [gameMusic1991, gameMusicField, gameMusicHighTogether, gameMusicEnsenada];
      const selectedTrack = gameTracks[Math.floor(Math.random() * gameTracks.length)];
      playMusic(selectedTrack);
    } else if (screen === 'scoreReveal' && previousScreen === 'game') {
      playMusic(endMusic);
    }

    previousScreenRef.current = screen;
  }, [endMusic, gameMusic1991, gameMusicField, gameMusicHighTogether, gameMusicEnsenada, playMusic, screen, setupMusic]);

  useEffect(() => {
    transitionOpacity.setValue(0);
    transitionTranslate.setValue(18);

    Animated.parallel([
      Animated.timing(transitionOpacity, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(transitionTranslate, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [screen, transitionOpacity, transitionTranslate]);

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
      stopAllMusic();
    };
  }, [stopAllMusic]);

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
      <Animated.View style={[styles.screenContainer, { opacity: transitionOpacity, transform: [{ translateY: transitionTranslate }] }]}>
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
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#17213f',
    flex: 1,
  },
  screenContainer: {
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