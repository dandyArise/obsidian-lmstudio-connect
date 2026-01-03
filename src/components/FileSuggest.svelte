<script lang="ts">
	import { TFile } from "obsidian";
	import { computePosition, flip, shift, offset } from "@floating-ui/dom";
	import { getPluginContext } from "src/services/context";
	import { tick } from "svelte";

	let plugin = getPluginContext();
	let { positionEl, onFileSelected } = $props();

	let isOpen: boolean = $state(false);
	let suggestions: TFile[] = $state([]);
	let selectedIndex = $state(0);
	let q: string | undefined = $state();
	let showInput = $state(false);
	let value: string = $state('');

	let popover: HTMLDivElement;
	let inputBox: HTMLInputElement | undefined = $state();
	let files: TFile[] = [];

	function onkeydown(event: KeyboardEvent) {
		if (event.key !== ']') {
			dispatch(event);
		}
	}

	function oninput() {
		update(value);
	}

	function update(query: string) {
		selectedIndex = 0;
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
	
	//TODO: is this slow with many files? could block editor..
	export function open(query: string, input: boolean = false) {
		q = query;
		showInput = input;
		if (showInput) {
			tick().then(() => inputBox?.focus());
		}

		if (!isOpen) {
			isOpen = true;
			files = plugin.app.vault.getMarkdownFiles();
		}
		
		update(query);
	}

	function getSuggestions(query: string) {
		const q = query.toLowerCase();
		return files
			.filter((file) => file.name.toLowerCase().includes(q))
			.slice(0,10)
			.sort((a, b) => {
				const aMatch = a.name.toLowerCase().indexOf(q);
				const bMatch = b.name.toLowerCase().indexOf(q);
				return aMatch - bMatch;
			});
	}

	export function dispatch(e: KeyboardEvent) {
		if (!isOpen) return;

		switch (e.key) {
			case "Enter":
				if (!e.shiftKey) {
					e.preventDefault();
					if (!suggestions.length) {
						close();
						return;
					}
					onFileSelected(suggestions[selectedIndex]);
					close();
				}
				break;
			case "]":
				if (q && suggestions.length && suggestions[selectedIndex].basename === q) {
					 //closing exact match also selects
					e.preventDefault();
					onFileSelected(suggestions[selectedIndex]);
					close();
				}
				break;
			case "Escape":
				e.preventDefault();
				close();
				break;
			case "ArrowUp":
				e.preventDefault();
				selectedIndex = selectedIndex-1 < 0 ? suggestions.length-1 : selectedIndex-1;
				break;
			case "ArrowDown":
				e.preventDefault();
				selectedIndex = selectedIndex+1 >= suggestions.length ? 0 : selectedIndex+1;
				break;
		}
	}

	export function close() {
		isOpen = false;
		q = undefined;
		value = '';
		showInput = false;
		suggestions = [];
	}
	
	function onclick(file: TFile) {
		onFileSelected(file);
		close();
	}
</script>

<div bind:this={popover} class={["popover", isOpen && "visible"]}>
	<div>
		{#if showInput}
			<input bind:this={inputBox} bind:value {onkeydown} {oninput} type="text" placeholder="Enter a note name...">
		{/if}
		<ul>
			{#each suggestions as file, i}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<li class:selected={i === selectedIndex} onclick={() => onclick(file)}>{file.basename}</li>
			{:else}
				<li class="selected">No match found</li>
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

	/* needs to use full obsidian body so it can stretch outside leaf */
	.popover > div {
		max-width: var(--popover-width);
		max-height: var(--popover-max-height);
		font-size: var(--popover-font-size);
	}

	.popover.visible {
		display: flex;
	}

	ul {
		margin: 0;
		padding: var(--size-2-3);
	}

	li {
		align-items: baseline;
		display: flex;
		justify-content: space-between;
		overflow-y: auto;
		padding: var(--size-2-3) var(--size-4-3);
		white-space: pre-wrap;
	}
	li.selected, li:hover {
		background-color: var(--background-modifier-hover);
	}
	li.selected, li:hover {
		cursor: var(--cursor);
		padding: var(--size-2-3) var(--size-4-3);
		white-space: pre-wrap;
		border-radius: var(--radius-s);
	}
	
</style>
