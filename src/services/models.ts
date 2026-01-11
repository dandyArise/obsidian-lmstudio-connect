//models (interfaces/types, not llms...)

import type { ModelMessage } from "ai";

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

export type ResponseMessage = { type: "text", parts: string[], isFinal: boolean }
	| { type: "reasoning", parts: string[] }
	| { type: "tool-call", id: string, name: string, input: any }
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
}

export function toApiMessages(exchanges: Exchange[]): ModelMessage[] {
	let modelMessages: ModelMessage[] = [];

	for (const { userMessage, response } of exchanges) {
		modelMessages.push({ role: "user", content: [{ type: "text", text: userMessage.content }] });

		for (const message of response.messages) {
			switch (message.type) {
				case "text":
					modelMessages.push({ role: "assistant", content: message.parts.join("") });
					break;
				//TODO: other types...
			}
		}
	}

	return modelMessages;
}
