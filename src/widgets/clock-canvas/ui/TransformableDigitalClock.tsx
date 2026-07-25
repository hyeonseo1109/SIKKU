import type {
  DigitalClockConfig,
  DigitalDisplayTransform,
  DigitalSlotId,
} from "@/entities/digital-clock";
import {
  getDigitalTimeSlots,
  resolveDigitalSlotTransforms,
} from "@/entities/digital-clock";

import { TransformableDigitalSlot } from "./TransformableDigitalSlot";

type TransformableDigitalClockProps = {
  config: DigitalClockConfig;
  date: Date;
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
  selectedSlotId: DigitalSlotId | null;
  onSelect: (slotId: DigitalSlotId) => void;
  onTransformEnd: (
    slotId: DigitalSlotId,
    transform: DigitalDisplayTransform,
  ) => void;
};

export const TransformableDigitalClock = ({
  canvasHeight,
  canvasWidth,
  config,
  date,
  onSelect,
  onTransformEnd,
  scale,
  selectedSlotId,
}: TransformableDigitalClockProps) => {
  const transforms = resolveDigitalSlotTransforms(config, {
    width: canvasWidth,
    height: canvasHeight,
  });
  const slots = getDigitalTimeSlots(date, config);

  return slots.map((slot) => (
    <TransformableDigitalSlot
      canvasHeight={canvasHeight}
      canvasWidth={canvasWidth}
      character={slot.character}
      compact={slot.compact}
      imageUri={slot.digit ? config.digitImageMap[slot.digit] : undefined}
      key={slot.id}
      onSelect={onSelect}
      onTransformEnd={onTransformEnd}
      scale={scale}
      selected={selectedSlotId === slot.id}
      slotId={slot.id}
      transform={transforms[slot.id]}
    />
  ));
};
