import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { Modal, Pressable, View } from "react-native";

import { AppText } from "@/shared/ui/app-text";

import {
  AppDialogContext,
  type AppDialogAction,
  type AppDialogOptions,
} from "../model/AppDialogContext";
import { styles } from "./AppDialog.styles";

const DEFAULT_ACTIONS: AppDialogAction[] = [{ label: "확인", tone: "primary" }];

export const AppDialogProvider = ({ children }: PropsWithChildren) => {
  const [dialog, setDialog] = useState<AppDialogOptions | null>(null);
  const showDialog = useCallback((options: AppDialogOptions) => {
    setDialog(options);
  }, []);
  const dismiss = useCallback(() => setDialog(null), []);
  const controller = useMemo(() => ({ showDialog }), [showDialog]);
  const actions = dialog?.actions?.length ? dialog.actions : DEFAULT_ACTIONS;

  const runAction = (action: AppDialogAction) => {
    dismiss();
    action.onPress?.();
  };

  return (
    <AppDialogContext.Provider value={controller}>
      {children}
      <Modal
        animationType="fade"
        onRequestClose={dismiss}
        statusBarTranslucent
        transparent
        visible={Boolean(dialog)}
      >
        <View accessibilityViewIsModal style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.copy}>
              <AppText variant="heading">{dialog?.title}</AppText>
              <AppText tone="secondary">{dialog?.message}</AppText>
            </View>
            <View style={styles.actions}>
              {actions.map((action) => (
                <Pressable
                  accessibilityRole="button"
                  key={action.label}
                  onPress={() => runAction(action)}
                  style={({ pressed }) => [
                    styles.action,
                    action.tone === "primary" && styles.primaryAction,
                    action.tone === "danger" && styles.dangerAction,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText
                    variant="label"
                    style={[
                      action.tone === "primary" && styles.primaryLabel,
                      action.tone === "danger" && styles.dangerLabel,
                    ]}
                  >
                    {action.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AppDialogContext.Provider>
  );
};
