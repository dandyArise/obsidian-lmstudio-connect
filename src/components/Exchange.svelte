<script lang="ts">
	import { MarkdownRenderer } from "obsidian";
	import { icon } from "./Icon.svelte";
	import { fade } from "svelte/transition";
	import type { Exchange } from "src/services/models";
	import { getPluginContext } from "src/services/context";
	import type { Attachment } from "svelte/attachments";
	import { t } from "src/i18n";
	import ErrorMessage from "./ErrorMessage.svelte";

	let plugin = getPluginContext();
	let { exchange, onretry }: { exchange: Exchange, onretry: () => void } = $props();
	let { userMessage, response } = $derived(exchange);

	function markdown(content: string): Attachment {
		return (element) => {
			element.innerHTML = "";
			MarkdownRenderer.render( plugin.app, content, element as HTMLElement, "", plugin);
		};
	}

	const scroll = (node: HTMLElement) => node.scrollIntoView({ behavior: "smooth" });
</script>

<li {@attach scroll}>
	<div class="user">
		{@html userMessage.displayHTML}
	</div>
	<div class={["response", response.status]}>
		<span class="spinner" {@attach icon("loader")}></span>
		{#each response.messages as message}
			{#if message.type === "text"}
				{#key message.parts}
					<div in:fade {@attach markdown(message.parts.join(""))}></div>
				{/key}
			{/if}
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
		align-self: flex-start;
		padding: var(--size-4-2);
		border-radius: var(--radius-s);
		transition: background-color var(--anim-duration-fast) ease-in-out;
	}
	
	.response.completed {
		background-color: color-mix(
		in srgb,
		var(--background-primary),
		transparent 80%
		);
	}

	.response.response.completed:hover {
		background-color: var(--background-primary);
	}
	
	.response > div :global(p:first-child) {
		margin-top: 0;
		padding-top: 0;
	}

	.response > div :global(p:last-of-type) {
		margin-top: 0;
		margin-bottom: 0;
	}

	.response:not(.in-progress) .spinner {
		display: none;
	}

	.spinner :global(svg) {
		animation: spin 2s linear infinite;
	}
</style>
