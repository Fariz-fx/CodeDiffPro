
import { DiffLine, DiffType } from '../types';

export const calculateDiff = (baseText: string, newText: string): DiffLine[] => {
  const baseLines = baseText.split('\n');
  const newLines = newText.split('\n');
  const n = baseLines.length;
  const m = newLines.length;

  const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (baseLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = 1 + dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diff: DiffLine[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && baseLines[i - 1] === newLines[j - 1]) {
      diff.unshift({ type: DiffType.Unchanged, text: newLines[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: DiffType.Added, text: newLines[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({ type: DiffType.Removed, text: baseLines[i - 1] });
      i--;
    } else {
      break;
    }
  }

  return diff;
};
