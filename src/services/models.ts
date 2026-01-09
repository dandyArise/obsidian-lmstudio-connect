//models (interfaces/types, not llms...)

import type { ModelMessage, TextPart, FilePart } from "ai";

export interface ModelInfo {
	id: string,
	object: string,
	type: string,
	state: string,
	max_context_length: number
}

export interface Replacement {
	from: number;
	to: number;
	value: string;
}
export interface InputValue { text: string, markdownFiles?: string[], display: string }

export enum Role { Assistant = "assistant", User = "user" }
export enum Status { Pending = "pending", Streaming = "streaming", Complete = "complete" }

//TODO: a need to break this out into user/assistant variants is near..
export interface ChatMessage {
	status: Status;
	role: Role;
	parts: string[]
	fileParts?: string[]
	display?: string
}
export enum SendStatus { Idle, Sending }

export type ServerConnection = {
	name: string;
	url: string;
	status: "pending" | "ok" | "error";
	isDefault: boolean;
};

export function toApiMessages(messages: ChatMessage[]): ModelMessage[] {
	let modelMessages: ModelMessage[] = [];
	for (const m of messages) {
		if (m.role === Role.Assistant) {
			modelMessages.push({ role: m.role, content: m.parts.join("") });
		} else if (m.role === Role.User) {
			const content: (TextPart | FilePart)[] = [];
			const textPart: TextPart | undefined = m.parts.some((p) => p)
				? { type: "text", text: m.parts.join("") }
				: undefined;

			//NOTE: apparently ai sdk only supports image and pdf so its recommended to use textpart
			const fileParts: TextPart[] | undefined = m.fileParts?.map(f => ({
				type: "text",
				text: f
			}));
			// (f) => ({
			// 	type: "file",
			// 	data: f,
			// 	mediaType: "text/markdown",
			// }),
			// );
			if (textPart) {
				content.push(textPart);
			}
			fileParts?.forEach((f) => content.push(f));
			modelMessages.push({ role: m.role, content });
		}
	}
	console.log(modelMessages);
	return modelMessages;
}
