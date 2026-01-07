<script lang="ts">
	import { icon } from "./Icon.svelte";
	import { tooltip } from "./Tooltip.svelte";
	import { t } from "src/i18n";
	let { onclear }: { onclear: (e: Event) => void } = $props();
</script>

<div class="container">
	<div
		tabindex="0"
		{@attach icon("trash")}
		{@attach tooltip(t('chat.clearChat'))}
		class="clickable-icon"
		onclick={onclear}
		onkeydown={onclear}
		aria-label={t('chat.clearChat')}
		role="button"
	></div>
</div>

<style>
	.container {
		display: flex;
	}
</style>
