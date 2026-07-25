import { Platform } from "react-native";

export const shadows = {
  card:
    Platform.select({
      ios: {
        shadowColor: "#214E49",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }) ?? {},
} as const;
