import type { ClockLayer } from "@/entities/clock-layer";

export type ClockType = "digital" | "analog";

export type ClockCanvas = {
  width: number;
  height: number;
  backgroundColor: string;
};

export type ClockProject = {
  id: string;
  name: string;
  type: ClockType;
  canvas: ClockCanvas;
  layers: ClockLayer[];
  createdAt: string;
  updatedAt: string;
};
