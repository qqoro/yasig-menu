import log from "electron-log";
import { defineStore } from "pinia";
import { ref } from "vue";
import Data from "../lib/data";
const console = log;

export const useGame = defineStore("game", () => {
  const clearGame = ref<string[]>(Data.getJSON("clearGame") ?? []);
  const saveClearGame = (newClearGame: string[]) => {
    clearGame.value = newClearGame;
    Data.setJSON("clearGame", newClearGame);
    console.log("clearGame saved!", clearGame.value);
  };
  const recentGame = ref<string[]>(Data.getJSON("recentGame") ?? []);
  const saveRecentGame = (newRecentGame: string[]) => {
    recentGame.value = newRecentGame;
    Data.setJSON("recentGame", newRecentGame);
    console.log("recentGame saved!", recentGame.value);
  };

  return {
    clearGame,
    saveClearGame,
    recentGame,
    saveRecentGame,
  };
});
