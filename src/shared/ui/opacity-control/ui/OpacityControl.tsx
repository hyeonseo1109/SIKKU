import { PropertySliderRow } from "@/shared/ui/property-slider-row";

type OpacityControlProps = {
  label: string;
  onChange: (opacity: number) => void;
  value: number;
};

const clampOpacity = (opacity: number) =>
  Math.max(0, Math.min(1, Math.round(opacity * 100) / 100));

const opacityToTransparencyPercent = (opacity: number) =>
  Math.round((1 - clampOpacity(opacity)) * 100);

export const OpacityControl = ({
  label,
  onChange,
  value,
}: OpacityControlProps) => {
  return (
    <PropertySliderRow
      label={label}
      maximum={1}
      maximumLabel="투명"
      minimum={0}
      minimumLabel="불투명"
      onChange={(transparency) => onChange(clampOpacity(1 - transparency))}
      step={0.01}
      value={1 - clampOpacity(value)}
      valueLabel={() => `${opacityToTransparencyPercent(value)}%`}
    />
  );
};
