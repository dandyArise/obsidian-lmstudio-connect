import { MarkdownRenderChild } from 'obsidian';
import { Config } from './services/models';
import CodeBlockChat from './components/CodeBlockChat.svelte';
import { mount, unmount } from 'svelte';
import type LMStudioConnectPlugin from './main';

export class CodeBlockChatHost extends MarkdownRenderChild {
	codeBlockChat: ReturnType<typeof CodeBlockChat> | undefined;
	_plugin: LMStudioConnectPlugin;
	_config: Config;

	constructor(containerEl: HTMLElement, plugin: LMStudioConnectPlugin, config: Config) {
		super(containerEl);
		this._plugin = plugin
		this._config = config;
	}

	onload(): void {
		this.codeBlockChat = mount(CodeBlockChat, {
			target: this.containerEl,
			props: { plugin: this._plugin, config: this._config }
		});
	}

	onunload(): void {
		if (this.codeBlockChat) {
			unmount(this.codeBlockChat);
		}
	}
}
