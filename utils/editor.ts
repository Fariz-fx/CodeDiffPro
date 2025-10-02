import { FoldableRange } from '../types';

/**
 * Finds foldable ranges in a text, typically based on matching curly braces.
 * @param text The text to analyze.
 * @returns An array of foldable ranges, each with a start and end line number.
 */
export const findFoldableRanges = (text: string): FoldableRange[] => {
  const lines = text.split('\n');
  const ranges: FoldableRange[] = [];
  const stack: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Simple logic: find lines with opening braces
    if (line.includes('{')) {
      stack.push(i + 1); // 1-based line number
    }

    // Find lines with closing braces
    if (line.includes('}')) {
      if (stack.length > 0) {
        const startLine = stack.pop()!;
        const endLine = i + 1; // 1-based line number
        // Only consider multi-line blocks as foldable
        if (endLine > startLine) {
          ranges.push({ startLine, endLine });
        }
      }
    }
  }
  
  // Sort ranges by start line number
  return ranges.sort((a, b) => a.startLine - b.startLine);
};
