import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "../app-button";
import { AppText } from "../app-text";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary] Unhandled render error", error, info);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  override render() {
    if (!this.state.error) return this.props.children;

    return (
      <View accessibilityRole="alert" style={styles.screen}>
        <AppText variant="title">문제가 발생했어요.</AppText>
        <AppText tone="secondary">
          다시 시도해도 계속되면 앱을 완전히 닫았다가 다시 열어 주세요.
        </AppText>
        {__DEV__ ? (
          <AppText style={styles.developmentError}>
            {this.state.error.message}
          </AppText>
        ) : null}
        <AppButton label="다시 시도" onPress={this.retry} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
    padding: 28,
    backgroundColor: "#F5FAF9",
  },
  developmentError: {
    color: "#A33A45",
  },
});
