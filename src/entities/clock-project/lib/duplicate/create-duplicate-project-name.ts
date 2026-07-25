const COPY_SUFFIX = " 복사본";
const NUMBERED_COPY_SUFFIX = / 복사본(?: \d+)?$/u;

export const createDuplicateProjectName = (
  sourceName: string,
  existingNames: Iterable<string>,
  maxLength = 60,
): string => {
  const names = new Set(existingNames);
  const root = sourceName.trim().replace(NUMBERED_COPY_SUFFIX, "") || "시계";
  const build = (sequence?: number) => {
    const suffix = `${COPY_SUFFIX}${sequence ? ` ${sequence}` : ""}`;
    return `${root.slice(0, Math.max(1, maxLength - suffix.length))}${suffix}`;
  };

  const first = build();
  if (!names.has(first)) return first;

  let sequence = 2;
  while (names.has(build(sequence))) sequence += 1;
  return build(sequence);
};
