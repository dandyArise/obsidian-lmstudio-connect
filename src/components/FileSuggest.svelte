<script lang="ts">
	import { TFile } from "obsidian";
	import { computePosition, flip, shift, offset } from "@floating-ui/dom";
	import { getPluginContext } from "src/services/context";
	import { tick } from "svelte";

	let plugin = getPluginContext();
	let { positionEl } = $props();

	let isOpen: boolean = $state(false);
	let suggestions: TFile[] = $state([]);

	let popover: HTMLDivElement;
	let files: TFile[] = [];
	
	//TODO: is this slow with many files? could block editor..
	export function open(query: string) {
		if (!isOpen) {
			isOpen = true;
			files = plugin.app.vault.getMarkdownFiles();
		}

		suggestions = getSuggestions(query);
		//tick to ensure popover is measurable with stable contents
		tick().then(() => {
			computePosition(positionEl, popover, {
				middleware: [offset(6), flip(), shift({ padding: 5 })],
			}).then(({ x, y }) => {
				Object.assign(popover.style, {
					left: `${x}px`,
					top: `${y}px`,
				});
			});
		});
	}

	export function close() {
		isOpen = false;
		suggestions = [];
	}

	function getSuggestions(query: string) {
		const q = query.toLowerCase();
		return files
			.filter((file) => file.name.toLowerCase().includes(q))
			.sort((a, b) => {
				const aMatch = a.name.toLowerCase().indexOf(q);
				const bMatch = b.name.toLowerCase().indexOf(q);
				return aMatch - bMatch;
			});
	}
</script>

<div bind:this={popover} class={["popover", isOpen && "visible"]}>
	<div>
		<ul>
			{#each suggestions as file}
				<li>{file.basename}</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	/* class popover actually gets some obsidian styles fyi */
	.popover {
		display: none;
		position: absolute;
		width: max-content;
		top: 0;
		left: 0;
	}

	.popover.visible {
		display: flex;
	}
</style>
