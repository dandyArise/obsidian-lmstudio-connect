import { tool } from "ai";
import type LMStudioConnectPlugin from "src/main";
import z from "zod";

const DESCRIPTION = `Reads a markdown file from the user's current Obsidian vault. You can access any file directly by using this tool.
Assume this tool is able to read all files in the vault. If the User provides a path to a file assume that path is valid. 
It is okay to read a file that does not exist; an error will be returned.

Usage:
- You have the capability to call multiple tools in a single response. It is always better to speculatively read multiple files as a batch that are potentially useful.
- If you read a file that exists but has empty contents you will receive a system reminder warning in place of file contents.`;

export function createReadFileTool(plugin: LMStudioConnectPlugin) {
	return tool({
		description: DESCRIPTION,
		inputSchema: z.object({ filePath: z.string().describe("The path to the file to read") }),
		execute: async ({ filePath }: { filePath: string }) => {
			try {
				const file = plugin.app.vault.getFileByPath(filePath);
				console.log("file read requested: ", filePath);
				if (!file) {
					throw new Error(`File not found: ${filePath}`);
				}

				const fileContent = await plugin.app.vault.cachedRead(file);

				return fileContent;
			} catch (error) {
				console.log("err: ", error);
				throw error;
			}
		}
	});
}

