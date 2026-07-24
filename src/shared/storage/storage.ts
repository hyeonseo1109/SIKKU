import AsyncStorage from "@react-native-async-storage/async-storage";

import type { StorageAdapter } from "./storage.types";

export const storage: StorageAdapter = {
  async getItem<Value>(key: string) {
    const value = await AsyncStorage.getItem(key);

    if (value === null) {
      return null;
    }

    return JSON.parse(value) as Value;
  },
  async setItem<Value>(key: string, value: Value) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  },
};
