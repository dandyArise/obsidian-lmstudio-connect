<script lang="ts">
	import { EditorView } from "codemirror";
	import { placeholder, drawSelection, ViewUpdate } from "@codemirror/view";
	import { closeBrackets } from "@codemirror/autocomplete";
	import { icon } from "./Icon.svelte";
	import ModelPicker from "./ModelPicker.svelte";
	import { onDestroy, onMount } from "svelte";
	import FileSuggest from "./FileSuggest.svelte";
	import { fileRefHighlighter } from "./codemirror/filerefhighlighter";
	import { cursorWithinFileRef } from "./codemirror/cursorwithinfileref";

	let { onsend } = $props();

	export const text = () => editor.state.doc.toString();

	export function set(value: string) {
		const length = editor.state.doc.length;
		editor.dispatch({
			changes: [
				{ from: 0, to: length },
				{ from: 0, insert: value },
			],
		});
	}

	export function clear() {
		const length = editor.state.doc.length;
		editor.dispatch({ changes: [{ from: 0, to: length }] });
	}

	let chatbox: HTMLDivElement;
	let editorDiv: HTMLDivElement;
	let editor: EditorView;
	// svelte-ignore non_reactive_update
	let popoverRef: HTMLDivElement;
	let popoverRefOffset: { x: number; y: number } = $state({ x: 0, y: 0 });
	let fileSuggest: FileSuggest;
	let canSend = $state(false);

	function onkeydown(e: KeyboardEvent) {
		if (e.key == "Enter" && !e.shiftKey) {
			e.preventDefault();
			onsend();
		}
	}

	onMount(() => {
		editor = new EditorView({
			doc: "",
			extensions: [
				drawSelection(),
				placeholder("Send a message to the model..."),
				closeBrackets(),
				fileRefHighlighter,
				cursorWithinFileRef,
				EditorView.lineWrapping,
				EditorView.updateListener.of((v: ViewUpdate) => {
					if (v.docChanged) {
						canSend = v.state.doc.length > 0;

						// //trigger popup if cursor within markdown ref brackets
						const cursorInRef = v.state.field(cursorWithinFileRef);
						if (cursorInRef) {
							popoverRef.innerText = cursorInRef.fileRefName; //simulate same size box as match text
							const pos = v.view.coordsAtPos(cursorInRef.position) || { left: 0, top: 0 };
							const chatboxRect = chatbox.getBoundingClientRect();
							popoverRefOffset = { x: pos.left - chatboxRect.x, y: pos.top - chatboxRect.y }
							fileSuggest.open(cursorInRef.fileRefName);
						} else {
							fileSuggest.close();
						}
					}
				}),
				EditorView.domEventHandlers({
					keydown: (event) => onkeydown(event),
				}),
			],
			parent: editorDiv,
		});
	});

	onDestroy(() => editor?.destroy());
</script>

<div bind:this={chatbox} class="chatbox">
	<div bind:this={editorDiv} class="editor"></div>

	<div class="toolbar">
		<ModelPicker />
		<button
			onclick={onsend}
			disabled={!canSend}
			{@attach icon("arrow-up")}
			title="send"
		></button>
	</div>

	<!-- dynamically position over the search term so file suggest pops up nearby. -->
	<div
		bind:this={popoverRef}
		style:left={popoverRefOffset.x + "px"}
		style:top={popoverRefOffset.y + "px"}
		class="popover-ref"
		aria-hidden="true"
	></div>
	<FileSuggest bind:this={fileSuggest} positionEl={popoverRef} />
</div>

<style>
	.chatbox {
		position: relative;
		display: flex;
		flex-direction: column;
		border: var(--border-width) solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		padding: 0 var(--size-4-2) var(--size-4-2) var(--size-4-2);
	}

	.popover-ref {
		position: absolute;
		top: 0;
		left: 0;
		visibility: hidden;
		font-size: var(--font-ui-small);
		font-family: var(--font-interface);
		pointer-events: none;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		gap: var(--size-4-2);
		align-items: center;
	}

	.editor {
		field-sizing: content;
		max-height: 10lh;
		overflow: auto;
		resize: none;
		border: none;
		background: transparent;
		padding: var(--size-2-2) 0;
	}
	.editor:focus,
	.editor:active {
		border: none;
		outline: none;
		box-shadow: none;
	}

	.editor :global(.cm-editor .cm-cursor) {
		border-left-color: var(--caret-color);
	}
	.editor :global(.cm-editor .cm-content) {
		font-size: var(--font-ui-small);
		font-family: var(--font-interface);
		color: var(--text-normal);
		field-sizing: content;
	}
	.editor :global(.cm-editor .cm-placeholder) {
		color: var(--text-faint);
	}
	.editor :global(.cm-editor .cm-line) {
		padding-left: 0;
	}
	.editor :global(.cm-editor.cm-focused .cm-selectionBackground),
	.editor :global(.cm-editor.cm-focused ::selection) {
		background-color: var(--text-selection);
	}

	.editor :global(.cm-editor .cm-note-ref-highlight) {
		color: var(--link-unresolved-color);
	}

	button {
		color: var(--text-on-accent);
		border-radius: 50%;
		box-shadow: none;
		padding: var(--size-2-2) var(--size-2-3);
	}
	button:enabled {
		background-color: var(--interactive-accent);
		transition: all var(--anim-duration-fast) ease-in-out;
	}
	button:hover {
		background-color: var(--interactive-accent-hover);
	}
	button:disabled,
	button:disabled:hover {
		background-color: var(--background-primary);
		color: var(--text-muted);
		opacity: 0.6;
	}
</style>
