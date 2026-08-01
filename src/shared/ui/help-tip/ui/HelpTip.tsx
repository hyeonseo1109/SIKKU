import { useState } from "react";
import { Modal, Pressable, View } from "react-native";

import { AppText } from "@/shared/ui/app-text";

import { styles } from "./HelpTip.styles";

type HelpTipProps = {
  accessibilityLabel?: string;
  message: string;
  title: string;
};

export const HelpTip = ({
  accessibilityLabel,
  message,
  title,
}: HelpTipProps) => {
  const [visible, setVisible] = useState(false);
  const dismiss = () => setVisible(false);

  return (
    <>
      <Pressable
        accessibilityHint="설명을 팝업으로 엽니다."
        accessibilityLabel={accessibilityLabel ?? `${title} 도움말`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.helpButton,
          pressed && styles.helpButtonPressed,
        ]}
      >
        <AppText style={styles.helpLabel}>?</AppText>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={dismiss}
        statusBarTranslucent
        transparent
        visible={visible}
      >
        <Pressable
          accessibilityLabel="도움말 닫기"
          accessibilityRole="button"
          onPress={dismiss}
          style={styles.backdrop}
        >
          <Pressable
            accessibilityViewIsModal
            onPress={(event) => event.stopPropagation()}
            style={styles.card}
          >
            <View style={styles.header}>
              <AppText variant="heading" style={styles.title}>
                {title}
              </AppText>
              <Pressable
                accessibilityLabel="도움말 닫기"
                accessibilityRole="button"
                hitSlop={10}
                onPress={dismiss}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed,
                ]}
              >
                <AppText style={styles.closeLabel}>×</AppText>
              </Pressable>
            </View>
            <AppText tone="secondary">{message}</AppText>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
