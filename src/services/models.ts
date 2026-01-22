//models (interfaces/types, not llms...)

import type { AssistantModelMessage, ToolModelMessage } from "ai";
import type { ReadFileInput } from "src/llm/tools/readFile";
import type { WebFetchInput } from "src/llm/tools/webFetch";

export interface ModelInfo {
	id: string,
	object: string,
	type: string,
	state: string,
	max_context_length: number
}

export type ServerConnection = {
	name: string;
	url: string;
	status: "pending" | "ok" | "error";
	isDefault: boolean;
};
export interface Replacement {
	from: number;
	to: number;
	value: string;
}
export interface InputValue { text: string, markdownFiles?: string[], display: string }

export interface ToolInputs {
  readFile: ReadFileInput;
  webFetch: WebFetchInput;
}
export type ToolCallMessage = {
  [K in keyof ToolInputs]: { 
    type: "tool-call"; 
    id: string; 
    name: K; 
    input: ToolInputs[K]; 
  }
}[keyof ToolInputs];

export type ResponseMessage = { type: "text", parts: string[], isFinal: boolean }
	| { type: "reasoning", parts: string[] }
	| ToolCallMessage
	| { type: "tool-result", id: string, content: string };

export const orderOf = (type: string) => {
	if (type === 'text') return 1;
	return 0;
};

export interface Exchange {
	created: number;
	userMessage: { content: string, displayHTML: string };
	response: {
		status: "in-progress" | "completed" | "error";
		messages: ResponseMessage[];
	}
	ai_sdk_messages: (AssistantModelMessage | ToolModelMessage)[];
}

