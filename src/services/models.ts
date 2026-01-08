//models (interfaces/types, not llms...)

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
export interface InputValue { text: string, display: string }

export enum Role { Assistant = "assistant", User = "user" }
export enum Status { Pending = "pending", Streaming = "streaming", Complete = "complete" }

export interface ChatMessage {
	status: Status;
	role: Role;
	parts: string[]
	display?: string
}
export enum SendStatus { Idle, Sending }

export type ServerConnection = {
	name: string;
	url: string;
	status: "pending" | "ok" | "error";
	isDefault: boolean;
};
