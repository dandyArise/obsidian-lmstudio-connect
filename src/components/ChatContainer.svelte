<script lang="ts">
	import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
	import { streamText, type ModelMessage } from "ai";
	import LMStudioConnectPlugin from "src/main";
	import { Role, Status, type ChatMessage, type InputValue } from "src/services/models";
	import TopToolbar from "./TopToolbar.svelte";
	import { tick } from "svelte";
	import { setPluginContext } from "src/services/context";
	import EmptyView from "./EmptyView.svelte";
	import Message from "./Message.svelte";
	import {
		currentServer,
		requestServerRefresh,
		toV1BaseURL,
	} from "src/settings.svelte";
	import ErrorMessage from "./ErrorMessage.svelte";
	import ChatInput from "./ChatInput.svelte";
	import { t } from "src/i18n";

	let { plugin }: { plugin: LMStudioConnectPlugin } = $props();
	// svelte-ignore state_referenced_locally
	setPluginContext(plugin);

	let server = $derived(currentServer(plugin.settings));
	let baseURL = $derived(server ? toV1BaseURL(server.url) : "");
	let model = $derived(server?.lastUsedModel ?? "");

	let provider = $derived(
		createOpenAICompatible({
			name: "lmstudio",
			baseURL,
		}),
	);

	let messages: ChatMessage[] = $state([]);
	let bufferHeight = $state(0);
	let errorMessage = $state("");
	// svelte-ignore non_reactive_update
	let messagesContainer: HTMLUListElement;
	let input: ChatInput;
	let cachedInput: InputValue;
	const gap = 20;

	function toApiMessages(messages: ChatMessage[]): ModelMessage[] {
		return messages.map((m) => ({
			role: m.role,
			content: m.parts.join(""),
		}));
	}

	async function onsend() {
		const text = await input.text();
		const html = input.contentHTML()
		cachedInput = { text, display: html };
		
		await send(cachedInput);
	}

	async function send(message: InputValue) {
		errorMessage = "";
		
		messages.push({
			role: Role.User,
			status: Status.Complete,
			parts: [message.text],
			display: message.display
		});
		messages.push({
			role: Role.Assistant,
			status: Status.Pending,
			parts: [],
		});
		const result = streamText({
			model: provider(model),
			prompt: toApiMessages(messages.slice(0, -1)),
			onError({ error }) {
				console.error(error);
				messages = messages.slice(0, -1);
				errorMessage = t('errors.somethingWentWrong');
				requestServerRefresh();
			},
		});
		input.clear();

		await tick();
		const lastUserMessage = messagesContainer.children[messages.length - 2];
		bufferHeight =
			messagesContainer.clientHeight -
			(lastUserMessage?.clientHeight ?? 0) -
			gap;

		const response = messages[messages.length - 1];
		for await (const textPart of result.textStream) {
			response.parts.push(textPart);
			if (response.status === Status.Pending)
				response.status = Status.Streaming;
		}
		response.status = Status.Complete;
	}

	function clearMessages(e: Event) {
		e.preventDefault();
		messages = [];
	}

	function resend() {
		requestServerRefresh();
		messages = messages.slice(0, -1);
		send(cachedInput);
	}
</script>

<div class="lmsc container">
	<TopToolbar onclear={clearMessages} />

	{#if messages.length}
		<ul bind:this={messagesContainer} style="--buffer-height: {bufferHeight}px">
			{#each messages as message}
				<Message {message} />
			{/each}

			{#if errorMessage}
				<ErrorMessage message={errorMessage} onretry={resend} />
			{/if}
		</ul>
	{:else}
		<EmptyView />
	{/if}

	<ChatInput bind:this={input} {onsend} />
</div>

<style>
	.container {
		container-type: inline-size;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		gap: var(--size-4-1);
		padding-bottom: var(--size-4-1);
	}

	ul {
		flex: 1;
		overflow-y: auto;
		list-style-type: none;
		display: flex;
		flex-direction: column;
		gap: var(--size-4-3);
		padding: 0;
		margin: var(--size-4-1) 0;
	}
</style>
