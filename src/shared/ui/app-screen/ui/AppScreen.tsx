import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "./AppScreen.styles";

export type AppScreenProps = {
  children: ReactNode;
  scrollable?: boolean;
};

export const AppScreen = ({ children, scrollable = false }: AppScreenProps) => {
  return (
    <SafeAreaView
      edges={["top", "right", "bottom", "left"]}
      style={styles.safe}
    >
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </SafeAreaView>
  );
};
