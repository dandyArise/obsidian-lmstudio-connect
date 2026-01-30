import { App, PluginSettingTab, Modal, Setting } from "obsidian";
import type LMStudioConnectPlugin from "./main";
import ServerSettingsComponent from "./components/ServerSettingsModal.svelte";
import { mount, unmount } from "svelte";
import type { ServerConnection } from "./services/models";
import { t } from "./i18n";
import { type PluginSettings, type LMStudioServer } from "./services/settings.svelte";

export class SettingsTab extends PluginSettingTab {
	plugin: LMStudioConnectPlugin;

	constructor(app: App, plugin: LMStudioConnectPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.icon = "bot-message-square";
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName(t('settings.serverName'))
			.setDesc(t('settings.serverDescription'))
			.addButton(button => button
				.setButtonText(t('settings.manage'))
				.onClick(() => {
					new LMStudioServerSettingsModal(
						this.app,
						this.plugin.settings,
						() => { this.plugin.modelStore.refreshAvailableModels() },
						(servers: ServerConnection[]) => {
							const current: LMStudioServer[] = this.plugin.settings.servers;

							//NOTE: To keep with current [save/cancel] modal ux in Obsidian
							//we'll save changes with a manual diff rather than editing in place. 
							servers.forEach(s => {
								const existing = current.find(c => c.name === s.name);
								if (existing) {
									existing.url = s.url;
									return;
								}

								current.push({ name: s.name, url: s.url, lastUsedModel: '' });
							});

							current.filter(c => !servers.find(s => s.name === c.name))
								.forEach(f => current.remove(f));

							this.plugin.modelStore.refreshAvailableModels();
						}
					).open();
				})
			);
	}
}

export class LMStudioServerSettingsModal extends Modal {
	settingsComponent: ReturnType<typeof ServerSettingsComponent> | undefined;

	constructor(app: App, settings: PluginSettings, refreshServers: () => void, onSubmit: (result: ServerConnection[]) => void) {
		super(app);
		this.setTitle(t('settings.serverName'));
		this.settingsComponent = mount(ServerSettingsComponent, {
			target: this.contentEl,
			props: {
				settings,
				refreshServers,
				onClose: () => this.close(),
				onSubmit: (result: ServerConnection[]) => {
					this.close();
					onSubmit(result);
				}
			}
		});
	}

	onClose() {
		if (this.settingsComponent) {
			void unmount(this.settingsComponent);
		}
	}
}
