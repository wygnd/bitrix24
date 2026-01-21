export function getNoun(number: number, words: string[]): string {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) return `${number} ${words[2]}`;

  n %= 10;
  if (n === 1) return `${number} ${words[0]}`;

  if (n >= 2 && n <= 4) return `${number} ${words[1]}`;

  return `${number} ${words[2]}`;
}
