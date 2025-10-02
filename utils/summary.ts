
import { DiffLine, DiffType, PanelData } from '../types';

export const generateSimpleSummary = (
    diffResults: (DiffLine[] | null)[], 
    panels: PanelData[]
): string => {
    let totalAdded = 0;
    let totalRemoved = 0;
    const changedFileTitles: string[] = [];

    diffResults.forEach((diff, index) => {
        if (diff && index > 0) { // index 0 is the base, has no diff
            const added = diff.filter(line => line.type === DiffType.Added).length;
            const removed = diff.filter(line => line.type === DiffType.Removed).length;

            if (added > 0 || removed > 0) {
                totalAdded += added;
                totalRemoved += removed;
                changedFileTitles.push(panels[index].title);
            }
        }
    });

    if (totalAdded === 0 && totalRemoved === 0) {
        return "No differences found between the panels.";
    }

    let summary = `Found ${totalAdded} additions and ${totalRemoved} removals.`;
    if (changedFileTitles.length > 0) {
        summary += `\nChanges were detected in: ${changedFileTitles.join(', ')}.`;
    }

    return summary;
};
