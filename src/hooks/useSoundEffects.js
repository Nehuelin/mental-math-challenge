import { useCallback } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

const SOUND_SOURCES = {
  iterationGood: require('../../assets/sfx/sfx_iteration_good.mp3'),
  iterationBad: require('../../assets/sfx/sfx_iteration_bad.mp3'),
  levelUp: require('../../assets/sfx/sfx_level_up.mp3'),
  preroundCountdown: require('../../assets/sfx/sfx_preround_countdown.mp3'),
  coins: require('../../assets/sfx/sfx_coins.mp3'),
  evilCoins: require('../../assets/sfx/sfx_coins_evil.mp3'),
};

export function useSoundEffects() {
  const iterationGood = useAudioPlayer(SOUND_SOURCES.iterationGood);
  const iterationBad = useAudioPlayer(SOUND_SOURCES.iterationBad);
  const levelUp = useAudioPlayer(SOUND_SOURCES.levelUp);
  const preroundCountdown = useAudioPlayer(SOUND_SOURCES.preroundCountdown);
  const coins = useAudioPlayer(SOUND_SOURCES.coins);
  const evilCoins = useAudioPlayer(SOUND_SOURCES.evilCoins);

  const playPlayer = useCallback((player) => {
    setAudioModeAsync({ playsInSilentMode: true });
    player.seekTo(0);
    player.play();
  }, []);

  return useCallback((soundName) => {
    const players = {
      iterationGood,
      iterationBad,
      levelUp,
      preroundCountdown,
      coins,
      evilCoins,
    };

    const player = players[soundName];
    if (player) {
      playPlayer(player);
    }
  }, [iterationBad, iterationGood, levelUp, playPlayer, preroundCountdown, coins, evilCoins]);
}