import { useCallback, useMemo } from "react";
import {
  Canvas,
  Group,
  Image as SkiaImage,
  Path,
  Rect,
  Skia,
  useImage,
} from "@shopify/react-native-skia";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import type { ImageAsset, NormalizedPoint } from "@/entities/image-asset";
import { useImageLassoStore } from "@/features/select-image-area";
import {
  normalizedImagePointToScreenPoint,
  screenPointToNormalizedImagePoint,
  type Point,
  type Size,
} from "@/shared/lib/geometry";

import { styles } from "./ImageLassoEditor.styles";

type ImageRect = Point & Size;

export type ImageLassoEditorProps = {
  asset: ImageAsset;
  size: Size;
  onLayout: (event: LayoutChangeEvent) => void;
};

const getContainRect = (
  imageWidth: number,
  imageHeight: number,
  container: Size,
): ImageRect => {
  const scale = Math.min(
    container.width / imageWidth,
    container.height / imageHeight,
  );
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: (container.width - width) / 2,
    y: (container.height - height) / 2,
    width,
    height,
  };
};

const isInside = (point: Point, rect: ImageRect) =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;

const createScreenPath = (points: NormalizedPoint[], imageRect: ImageRect) => {
  if (points.length === 0) {
    return null;
  }

  const path = Skia.Path.Make();
  const first = normalizedImagePointToScreenPoint(points[0]!, imageRect);
  path.moveTo(first.x, first.y);
  points.slice(1).forEach((point) => {
    const screenPoint = normalizedImagePointToScreenPoint(point, imageRect);
    path.lineTo(screenPoint.x, screenPoint.y);
  });
  return path;
};

export const ImageLassoEditor = ({
  asset,
  onLayout,
  size,
}: ImageLassoEditorProps) => {
  const image = useImage(asset.originalUri);
  const points = useImageLassoStore((state) => state.points);
  const beginPath = useImageLassoStore((state) => state.beginPath);
  const appendPoint = useImageLassoStore((state) => state.appendPoint);
  const finishPath = useImageLassoStore((state) => state.finishPath);
  const imageRect = useMemo(
    () =>
      getContainRect(Math.max(asset.width, 1), Math.max(asset.height, 1), size),
    [asset.height, asset.width, size],
  );
  const path = useMemo(
    () => createScreenPath(points, imageRect),
    [imageRect, points],
  );

  const toNormalizedPoint = useCallback(
    (point: Point) => {
      if (!isInside(point, imageRect)) {
        return null;
      }
      return screenPointToNormalizedImagePoint(point, imageRect);
    },
    [imageRect],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((event) => {
          const point = toNormalizedPoint({ x: event.x, y: event.y });
          if (point) {
            beginPath(point);
          }
        })
        .onUpdate((event) => {
          const point = toNormalizedPoint({ x: event.x, y: event.y });
          if (point) {
            appendPoint(point);
          }
        })
        .onEnd(() => finishPath()),
    [appendPoint, beginPath, finishPath, toNormalizedPoint],
  );

  return (
    <View onLayout={onLayout} style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Canvas
          accessibilityLabel="올가미 이미지 편집 영역"
          style={styles.canvas}
        >
          {image ? (
            <SkiaImage
              fit="fill"
              height={imageRect.height}
              image={image}
              width={imageRect.width}
              x={imageRect.x}
              y={imageRect.y}
            />
          ) : null}
          {path ? (
            <>
              <Group clip={path} invertClip>
                <Rect
                  color="rgba(20, 15, 13, 0.58)"
                  height={size.height}
                  width={size.width}
                  x={0}
                  y={0}
                />
              </Group>
              <Path
                color="#F3B6A2"
                path={path}
                style="stroke"
                strokeCap="round"
                strokeJoin="round"
                strokeWidth={4}
              />
            </>
          ) : null}
        </Canvas>
      </GestureDetector>
    </View>
  );
};
