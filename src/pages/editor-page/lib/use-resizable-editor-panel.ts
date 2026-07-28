import { useMemo, useState } from "react";
import { PanResponder, useWindowDimensions } from "react-native";

import { clamp } from "@/shared/lib/geometry";

const MIN_PANEL_HEIGHT = 230;
const DEFAULT_PANEL_HEIGHT = 280;
const RESERVED_SCREEN_HEIGHT = 370;
const RESERVED_PREVIEW_SURROUNDINGS = 240;
const MIN_PREVIEW_HEIGHT = 110;
const MAX_PREVIEW_HEIGHT = 390;
const PANEL_STEP = 56;

export const useResizableEditorPanel = () => {
  const { height: screenHeight } = useWindowDimensions();
  const maxPanelHeight = Math.max(
    MIN_PANEL_HEIGHT,
    screenHeight - RESERVED_SCREEN_HEIGHT,
  );
  const [panelHeight, setPanelHeight] = useState(() =>
    clamp(DEFAULT_PANEL_HEIGHT, MIN_PANEL_HEIGHT, maxPanelHeight),
  );
  const visiblePanelHeight = clamp(
    panelHeight,
    MIN_PANEL_HEIGHT,
    maxPanelHeight,
  );
  const previewHeight = clamp(
    screenHeight - visiblePanelHeight - RESERVED_PREVIEW_SURROUNDINGS,
    MIN_PREVIEW_HEIGHT,
    MAX_PREVIEW_HEIGHT,
  );

  const resizeBy = (amount: number) => {
    setPanelHeight((current) =>
      clamp(current + amount, MIN_PANEL_HEIGHT, maxPanelHeight),
    );
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 3,
        onPanResponderMove: (_, gesture) => {
          setPanelHeight(
            clamp(
              visiblePanelHeight - gesture.dy,
              MIN_PANEL_HEIGHT,
              maxPanelHeight,
            ),
          );
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [maxPanelHeight, visiblePanelHeight],
  );

  return {
    decreasePanelHeight: () => resizeBy(-PANEL_STEP),
    increasePanelHeight: () => resizeBy(PANEL_STEP),
    panelHeight: visiblePanelHeight,
    previewHeight,
    resizeHandlePanHandlers: panResponder.panHandlers,
  };
};
