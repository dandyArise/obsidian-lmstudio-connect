<script lang="ts">
	import { MarkdownRenderer } from "obsidian";
	import { icon } from "./Icon.svelte";
	import { fade } from "svelte/transition";
	import {
		orderOf,
		type Exchange,
		type ResponseMessage,
	} from "src/services/models";
	import { getPluginContext } from "src/services/context";
	import type { Attachment } from "svelte/attachments";
	import { t } from "src/i18n";
	import ErrorMessage from "./ErrorMessage.svelte";

	let plugin = getPluginContext();
	let { exchange, onretry, hideUserMessage = false, hideToolUse = false }
	: { exchange: Exchange; onretry: () => void, hideUserMessage?: boolean, hideToolUse?: boolean } 
	= $props();

	let { userMessage, response } = $derived(exchange);
	const messages = $derived(sort(response.messages));

	function markdown(content: string): Attachment {
		return (element) => {
			element.innerHTML = "";
			MarkdownRenderer.render(
				plugin.app,
				content,
				element as HTMLElement,
				"",
				plugin,
			);
		};
	}

	function sort(messages: ResponseMessage[]) {
		return messages.slice().sort((a, b) => {
			return orderOf(a.type) - orderOf(b.type);
		});
	}

	const scroll = (node: HTMLElement) =>
		node.scrollIntoView({ behavior: "smooth" });
</script>

<li in:fade {@attach scroll}>
	{#if !hideUserMessage}
		<div class="user">
			{@html userMessage.displayHTML}
		</div>
	{/if}
	<div class={["response", response.status]}>
		<span class="spinner" {@attach icon("loader")}></span>
		{#each messages as message}
			<div in:fade class={["lmsc-message", message.type]}>
				{#if message.type === "reasoning"}
					{#key message.parts}
						<div {@attach markdown(message.parts.join(""))}></div>
					{/key}
				{:else if message.type === "text"}
					{#key message.parts}
						<div {@attach markdown(message.parts.join(""))}></div>
					{/key}
				{:else if !hideToolUse && message.type === "tool-call"}
					<span {@attach icon("arrow-right")}></span>
					{t(`messages.tool-call.${message.name}`, message.input)}
				{/if}
			</div>
		{/each}
		{#if response.status === "error"}
			<ErrorMessage message={t("errors.somethingWentWrong")} {onretry} />
		{/if}
	</div>
</li>

<style>
	li {
		display: flex;
		flex-direction: column;
		font-size: var(--font-small);
		color: var(--text-normal);
		gap: var(--size-4-2);
	}

	.user {
		align-self: flex-end;
		background: var(--background-primary);
		padding: var(--size-4-2);
		border-radius: var(--radius-l);
	}

	.response {
		display: flex;
		flex-direction: column;
		gap: var(--size-2-2);
		align-self: flex-start;
	}

	.lmsc-message.text {
		padding: var(--size-4-2);
		border-radius: var(--radius-s);
	}

	.response.completed .lmsc-message.text {
		background-color: color-mix(
			in srgb,
			var(--background-primary),
			transparent 80%
		);
	}

	.lmsc-message {
		transition: background-color var(--anim-duration-fast) ease-in-out;
	}

	.response.response.completed .lmsc-message.text:hover {
		background-color: var(--background-primary);
	}

	.lmsc-message > div :global(p:first-child) {
		margin-top: 0;
		padding-top: 0;
	}

	.lmsc-message > div :global(p:last-of-type) {
		margin-top: 0;
		margin-bottom: 0;
	}

	.lmsc-message.reasoning {
		color: blue;
	}

	.lmsc-message.tool-call {
		color: var(--text-faint);
		display: flex;
		align-items: center;
		gap: var(--size-4-2);
	}

	.response:not(.in-progress) .spinner {
		display: none;
	}

	.spinner :global(svg) {
		animation: spin 2s linear infinite;
	}
</style>
