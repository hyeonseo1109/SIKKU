import { Platform } from "react-native";

export const shadows = {
  card:
    Platform.select({
      ios: {
        shadowColor: "#2C211D",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }) ?? {},
} as const;
