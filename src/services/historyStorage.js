import AsyncStorage from '@react-native-async-storage/async-storage';
import { HISTORY_LIMIT } from '../constants/gameConfig';

const HISTORY_KEY = 'mental-math-challenge:history';

const checkStorage = async () => {
  try {
    const result = await AsyncStorage.getItem(HISTORY_KEY);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

export const loadHistory = async () => {
  const value = await AsyncStorage.getItem(HISTORY_KEY);
  // checkStorage(); // para mostrar los datos almacenados
  return value ? JSON.parse(value) : [];
};

export const saveRoundResult = async (round) => {
  const currentHistory = await loadHistory();
  const updatedHistory = [round, ...currentHistory]
    .sort((left, right) => new Date(right.playedAt).getTime() - new Date(left.playedAt).getTime())
    .slice(0, HISTORY_LIMIT);

  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  return updatedHistory;
};

export const clearHistory = async () => {
  await AsyncStorage.removeItem(HISTORY_KEY);
  return [];
};