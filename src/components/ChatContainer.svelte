<script lang="ts">
	import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
	import { streamText, stepCountIs } from "ai";
	import LMStudioConnectPlugin from "src/main";
	import {
		toApiMessages,
		type Exchange,
		type InputValue,
		type ResponseMessage,
	} from "src/services/models";
	import { setPluginContext } from "src/services/context";
	import EmptyView from "./EmptyView.svelte";
	import {
		currentServer,
		requestServerRefresh,
		toV1BaseURL,
	} from "src/settings.svelte";
	import ChatInput from "./ChatInput.svelte";
	import prompts from "../llm/prompt.json";
	import { createReadFileTool } from "src/llm/tools";
	import TopToolbar from "./TopToolbar.svelte";
	import ExchangeView from "./Exchange.svelte";

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

	let exchanges: Exchange[] = $state([]);
	let currentExchange: Exchange | undefined = $state();
	let abortController: AbortController | undefined = $state();
	let onabort = $derived(abortController ? () => { abortController?.abort() } : undefined);
	let bufferHeight = $state(0);
	let errored: boolean = false;
	let input: ChatInput;
	let cachedInput: InputValue;

	async function onsend() {
		if (errored) requestServerRefresh();

		const text = await input.text();
		const display = input.contentHTML();
		cachedInput = { text, display };

		await send(cachedInput);
	}

	async function send(message: InputValue) {
		errored = false;
		exchanges.push({
			created: Date.now(),
			userMessage: {
				content: message.text,
				displayHTML: message.display,
			},
			response: {
				status: "in-progress",
				messages: [],
			},
		});
		currentExchange = exchanges[exchanges.length - 1];

		abortController = new AbortController();
		const abortSignal = abortController.signal;

		const result = streamText({
			model: provider(model),
			system: prompts.system_prompt,
			messages: toApiMessages(exchanges),
			tools: {
				readFile: createReadFileTool(plugin),
			},
			stopWhen: stepCountIs(5),
			onChunk({ chunk }) {
				// console.log("chunk: ", chunk);
			},
			onStepFinish({
				text,
				toolCalls,
				toolResults,
				finishReason,
				usage,
			}) {
				// console.log("step finished: ", text, toolCalls, toolResults);
			},
			abortSignal,
			onError({ error }) {
				errored = true;
				// if (currentExchange) {
				// 	currentExchange.response.status = "error";
				// }
				console.error(error);
				requestServerRefresh();
			},
		});
		//TODO: may be better to use onchunk and onfinished for the parts or for
		//serializing the chat.

		input.clear();

		const finalMessage: ResponseMessage = $state({ type: "text", parts: [], isFinal: true });
		currentExchange.response.messages.push(finalMessage);
		for await (const part of result.textStream) {
			finalMessage.parts.push(part);
		}

		abortController = undefined;
		currentExchange.response.status = errored ? "error" : "completed";
	}

	function clearMessages(e: Event) {
		e.preventDefault();
		exchanges = [];
	}

	function resend() {
		requestServerRefresh();
		exchanges = exchanges.slice(0, -1);
		send(cachedInput);
	}
</script>

<div class="lmsc container">
	<TopToolbar onclear={clearMessages} />

	{#if exchanges.length}
		<ul bind:clientHeight={bufferHeight} style="--buffer-height: {bufferHeight}px">
			{#each exchanges as exchange}
				<ExchangeView {exchange} onretry={resend} />
			{/each}
		</ul>
	{:else}
		<EmptyView />
	{/if}

	<ChatInput bind:this={input} {onsend} {onabort} />
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

	ul > :global(li:last-of-type) {
		min-height: var(--buffer-height);
		flex-shrink: 0;
	}
</style>
