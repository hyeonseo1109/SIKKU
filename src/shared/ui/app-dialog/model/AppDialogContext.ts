import { createContext, useContext } from "react";

export type AppDialogAction = {
  label: string;
  onPress?: () => void;
  tone?: "default" | "primary" | "danger";
};

export type AppDialogOptions = {
  actions?: AppDialogAction[];
  message: string;
  title: string;
};

export type AppDialogController = {
  showDialog: (options: AppDialogOptions) => void;
};

export const AppDialogContext = createContext<AppDialogController | null>(null);

export const useAppDialog = (): AppDialogController => {
  const context = useContext(AppDialogContext);
  if (!context) {
    throw new Error("AppDialogProvider 안에서 useAppDialog를 사용해 주세요.");
  }
  return context;
};
