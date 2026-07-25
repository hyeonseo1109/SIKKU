import { fontFamilies } from "./fonts";

export const typography = {
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  label: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 30,
    lineHeight: 38,
  },
  heading: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    lineHeight: 30,
  },
} as const;
