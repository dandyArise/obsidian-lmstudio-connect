<script lang="ts">
	import { TFile } from "obsidian";
	import { computePosition, flip, shift, offset } from "@floating-ui/dom";
	import { getPluginContext } from "src/services/context";
	import { onMount, tick } from "svelte";
	import { bodyMount } from "./BodyMount.svelte";

	let plugin = getPluginContext();
	let { positionEl, onFileSelected } = $props();

	let isOpen: boolean = $state(false);
	let suggestions: TFile[] = $state([]);
	let selectedIndex = $state(0);
	let q: string | undefined = $state();
	let showInput = $state(false);
	let value: string = $state("");
	let sessionWidth: number | undefined = $state();

	let popover: HTMLDivElement;
	let scrollDiv: HTMLDivElement;
	let inputBox: HTMLInputElement | undefined = $state();
	let files: TFile[] = [];

	function onkeydown(event: KeyboardEvent) {
		if (event.key !== "]") {
			dispatch(event);
		}
	}

	function oninput() {
		update(value, false);
	}

	function update(query: string, adjustXPosition: boolean) {
		selectedIndex = 0;
		suggestions = getSuggestions(query);

		adjustPosition(adjustXPosition);
	}

	function adjustPosition(adjustX: boolean) {
		//NOTE: this doesn't adjust itself if user changes obsidian window size.
		//shouldn't matter since user wont be doing that while using popover and hopefully
		//a native obsidian popover can be used eventually.
		tick().then(() => {
			computePosition(positionEl, popover, {
				placement: 'top',
				middleware: [offset(6), flip(), shift({ padding: 5 })],
			}).then(({ x, y }) => {
				if (adjustX) {
					Object.assign(popover.style, {
						left: `${x}px`,
					});
					sessionWidth = scrollDiv.clientWidth;
				}
				Object.assign(popover.style, {
					top: `${y}px`,
				});
			});
		});
	}

	export function open(query: string, input: boolean = false) {
		q = query;
		showInput = input;
		let adjustXPosition = false;

		if (showInput) {
			tick().then(() => inputBox?.focus());
		}

		if (!isOpen) {
			isOpen = true;
			adjustXPosition = true;
			//TODO: check if this hangs UI in large vaults
			files = plugin.app.vault.getMarkdownFiles();
		}

		update(query, adjustXPosition);
	}

	function getSuggestions(query: string) {
		const q = query.toLowerCase();
		return files
			.filter((file) => file.name.toLowerCase().includes(q))
			.slice(0, 10)
			.sort((a, b) => {
				const aMatch = a.name.toLowerCase().indexOf(q);
				const bMatch = b.name.toLowerCase().indexOf(q);
				return aMatch - bMatch;
			});
	}

	export function dispatch(e: KeyboardEvent) {
		if (!isOpen) return;

		switch (e.key) {
			case "Tab":
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
				if (
					q &&
					suggestions.length &&
					suggestions[selectedIndex].basename === q
				) {
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
				selectedIndex =
					selectedIndex - 1 < 0
						? suggestions.length - 1
						: selectedIndex - 1;
				tick().then(scrollToItem);
				break;
			case "ArrowDown":
				e.preventDefault();
				selectedIndex =
					selectedIndex + 1 >= suggestions.length
						? 0
						: selectedIndex + 1;
				tick().then(scrollToItem);
				break;
		}
	}

	function scrollToItem() {
		const selectedItem = popover.querySelector("li.selected");
		if (selectedItem) {
			selectedItem.scrollIntoView({ block: 'nearest' });
		}
	}

	export function close() {
		isOpen = false;
		q = undefined;
		value = "";
		showInput = false;
		suggestions = [];
		sessionWidth = undefined;
		scrollDiv.scrollTop = 0;
	}

	function onclick(file: TFile) {
		onFileSelected(file);
		close();
	}

	onMount(() => {
		const adjustOnResize = () => { 
			if (isOpen) {
				console.log("resize");
				adjustPosition(true);
			}
		}

		console.log("visual viewport? ", window.visualViewport === null);

		window.visualViewport?.addEventListener('resize', adjustOnResize);

		return () => { window.visualViewport?.removeEventListener('resize', adjustOnResize) };
	})
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={popover}
	onmousedown={(e) => e.preventDefault()}
	{@attach bodyMount()}
	class={["popover", isOpen && "visible"]}
>
	<div bind:this={scrollDiv} style:width={sessionWidth && `${sessionWidth}px`}>
		{#if showInput}
			<input
				bind:this={inputBox}
				bind:value
				{onkeydown}
				{oninput}
				onblur={close}
				type="text"
				placeholder="Enter a note name..."
			/>
		{/if}
		<ul>
			{#each suggestions as file, i}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<li class:selected={i === selectedIndex} onclick={() => onclick(file)}>
					{file.basename}
				</li>
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
		max-width: 500px;
		max-height: 300px;
		z-index: var(--layer-popover);
		top: 0;
		left: 0;
	}

	/* needs to use full obsidian body so it can stretch outside leaf */
	.popover > div {
		max-width: var(--popover-width);
		max-height: var(--popover-max-height);
		font-size: var(--popover-font-size);
		min-width: 200px;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--size-2-3);
		gap: var(--size-2-3);
		overflow-y: auto;
	}

	.popover.visible {
		display: flex;
	}

	input {
		width: 100%;
	}

	ul {
		margin: 0;
		padding: 0;
		width: 100%;
	}

	li {
		width: 100%;
		align-items: baseline;
		display: flex;
		justify-content: space-between;
		overflow-y: auto;
		padding: var(--size-2-3) var(--size-4-3);
		white-space: pre-wrap;
	}
	li.selected,
	li:hover {
		background-color: var(--background-modifier-hover);
	}
	li.selected,
	li:hover {
		cursor: var(--cursor);
		padding: var(--size-2-3) var(--size-4-3);
		white-space: pre-wrap;
		border-radius: var(--radius-s);
	}
</style>
