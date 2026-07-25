export const shadows = {
  control: {
    boxShadow: [
      {
        blurRadius: 10,
        color: "rgba(28, 76, 70, 0.08)",
        offsetX: 0,
        offsetY: 4,
        spreadDistance: -3,
      },
    ],
  },
  card: {
    boxShadow: [
      {
        blurRadius: 26,
        color: "rgba(28, 76, 70, 0.12)",
        offsetX: 0,
        offsetY: 12,
        spreadDistance: -8,
      },
      {
        blurRadius: 5,
        color: "rgba(28, 76, 70, 0.05)",
        offsetX: 0,
        offsetY: 2,
        spreadDistance: -1,
      },
    ],
  },
  floating: {
    boxShadow: [
      {
        blurRadius: 34,
        color: "rgba(22, 65, 60, 0.17)",
        offsetX: 0,
        offsetY: 18,
        spreadDistance: -10,
      },
      {
        blurRadius: 8,
        color: "rgba(22, 65, 60, 0.07)",
        offsetX: 0,
        offsetY: 3,
        spreadDistance: -2,
      },
    ],
  },
} as const;
