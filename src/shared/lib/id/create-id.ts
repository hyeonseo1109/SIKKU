import { randomUUID } from "expo-crypto";

export const createId = (prefix: string): string => {
  return `${prefix}-${randomUUID()}`;
};
