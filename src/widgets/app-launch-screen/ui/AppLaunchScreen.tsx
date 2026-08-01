import { useEffect, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

import { AppText } from "@/shared/ui";

type AppLaunchScreenProps = {
  onFinish: () => void;
};

const DISPLAY_DURATION_MS = 850;
const FADE_DURATION_MS = 260;

export const AppLaunchScreen = ({ onFinish }: AppLaunchScreenProps) => {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        duration: FADE_DURATION_MS,
        toValue: 0,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, DISPLAY_DURATION_MS);

    return () => {
      clearTimeout(timer);
      opacity.stopAnimation();
    };
  }, [onFinish, opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="auto"
      style={[styles.overlay, { opacity }]}
    >
      <View style={styles.glow} />
      <Image
        resizeMode="cover"
        source={require("../../../../assets/branding/icon.png")}
        style={styles.icon}
      />
      <AppText variant="title" style={styles.title}>
        시꾸
      </AppText>
      <AppText tone="secondary" style={styles.subtitle}>
        나만의 시계 꾸미기
      </AppText>
      <View style={styles.brandPill}>
        <AppText variant="label" style={styles.brandText}>
          SIKKU
        </AppText>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "#EFF9F7",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  glow: {
    backgroundColor: "rgba(156, 220, 210, 0.2)",
    borderRadius: 190,
    height: 380,
    position: "absolute",
    transform: [{ translateY: -88 }],
    width: 380,
  },
  icon: {
    borderRadius: 48,
    height: 216,
    shadowColor: "#4A9F94",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    width: 216,
  },
  title: {
    color: "#143A35",
    fontSize: 42,
    marginTop: 34,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 8,
  },
  brandPill: {
    backgroundColor: "rgba(184, 228, 221, 0.64)",
    borderColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 30,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  brandText: {
    color: "#26766D",
    letterSpacing: 4,
  },
});
