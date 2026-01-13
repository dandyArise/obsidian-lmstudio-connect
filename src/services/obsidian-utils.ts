import { MarkdownView, TFile } from 'obsidian';
import type LMStudioConnectPlugin from 'src/main';

export function getOpenFiles(plugin: LMStudioConnectPlugin): TFile[] {
    const openFiles: TFile[] = [];

    plugin.app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view instanceof MarkdownView) {
            const file = leaf.view.file;
            if (file) {
                openFiles.push(file);
            }
        }
    });

    // remove duplicates if the same file is open in multiple tabs
    const uniqueFiles = [...new Set(openFiles)];

    return uniqueFiles;
}
