<script lang="ts">
	import { requestUrl } from "obsidian";
	import type { ModelInfo } from "../services/models";
	import { getPluginContext } from "src/services/context";
	import {
		MODELS_ENDPOINT,
		serverRefreshRequest,
		type LMStudioServer,
		type PluginSettings,
	} from "src/settings.svelte";
	import type LMStudioConnectPlugin from "src/main";
	import { tooltip } from "./Tooltip.svelte";
	import { icon } from "./Icon.svelte";
	import { t } from "src/i18n";

	const plugin: LMStudioConnectPlugin = getPluginContext();
	const settings: PluginSettings = plugin.settings;

	let select: HTMLSelectElement | undefined = $state();

	async function listModels(baseURL: String) {
		try {
			const response = await requestUrl(`${baseURL + MODELS_ENDPOINT}`);
			const { data } = response.json as { data: ModelInfo[] };
			return data;
		} catch (error) {
			console.error(
				`Error calling GET ${MODELS_ENDPOINT} at ${baseURL}: `,
				error,
			);
			throw error;
		}
	}

	let listModelsFromAllServers = $derived(async () => {
		serverRefreshRequest.watch;
		const listModelsPromises = settings.servers.map((s) =>
			listModels(s.url),
		);
		return Promise.allSettled(listModelsPromises).then((results) => {
			return results.map((r, i) => ({
				server: settings.servers[i],
				connected: r.status === "fulfilled",
				models: r.status === "fulfilled" ? r.value : [],
			}));
		});
	});

	// Model names are usually formatted like 'company/model' so truncate company if it exists.
	function formatModelName(name: string) {
		const parts = name.split("/");
		return parts.length > 1
			? name.substring(parts[0].length + 1)
			: parts[0];
	}

	function toKey(settings: PluginSettings) {
		const lastUsedServer = settings.servers.find(
			(s) => s.name === settings.lastUsedServer,
		);
		return lastUsedServer
			? JSON.stringify({
					server: lastUsedServer.name,
					model: lastUsedServer.lastUsedModel,
				})
			: undefined;
	}

	function getCurrentModelName(settings: PluginSettings) {
		const lastUsedServer = settings.servers.find(
			(s) => s.name === settings.lastUsedServer,
		);
		return lastUsedServer?.lastUsedModel
			? formatModelName(lastUsedServer.lastUsedModel)
			: t('modelPicker.chooseModel');
	}

	let value: string | undefined = $state(toKey(settings));

	function onchange() {
		if (value) {
			const key = JSON.parse(value) as { server: string; model: string };

			const server = settings.servers.find((s) => s.name === key.server);
			if (server) {
				server.lastUsedModel = key.model;
				settings.lastUsedServer = server.name;
			}
		}
	}
</script>

{#snippet error()}
	<div
		class="error"
		{@attach tooltip(t('modelPicker.verifySettings'))}
	>
		<span {@attach icon("circle-off")}></span>
		{t('modelPicker.noModelsFound')}
	</div>
{/snippet}

{#snippet modelOptions(server: LMStudioServer, models: ModelInfo[])}
	{#each models as model}
		<option value={JSON.stringify({ server: server.name, model: model.id })}>
			{model.id}
		</option>
	{/each}
{/snippet}

{#await listModelsFromAllServers()}
	<div class="connecting" {@attach tooltip(t('modelPicker.lookingForServer'))}>
		<span {@attach icon("loader")}></span>
		{t('modelPicker.connecting')}
	</div>
{:then modelsByServer}
	{#if modelsByServer.every((s) => s.models.length === 0)}
		{@render error()}
	{:else}
		{@const multiserver = modelsByServer.length > 1}
		<div class="custom-dropdown">
			<select bind:this={select} bind:value {onchange}>
				{#each modelsByServer as { server, connected, models }}
				{@const name = server.name === 'default' ? t('serverModal.default') : server.name}
					{#if multiserver}
						<optgroup label={name + (!connected ? ` (${t('serverModal.disconnected')})` : "")}
							disabled={!connected}>
							{@render modelOptions(server, models)}
						</optgroup>
					{:else}
						{@render modelOptions(server, models)}
					{/if}
				{/each}
			</select>
			<button onclick={() => {
				if (select?.showPicker) {
					select.showPicker();
				} else {
					select?.focus();
				}
			}}>
				<div class="text">
					<span>{getCurrentModelName(settings)}</span>
				</div>
				<span class="icon" {@attach icon("chevrons-up-down")}></span>
			</button>
		</div>
	{/if}
{:catch}
	{@render error()}
{/await}

<style>
	.custom-dropdown {
		display: flex;
		flex: 1;
		min-width: 0;
	}

	.custom-dropdown button {
		display: flex;
		gap: var(--size-4-1);
		max-width: 100%;
		box-shadow: none;
		color: var(--text-muted);
		background-color: var(--dropdown-background);
	}

	.custom-dropdown button:hover {
		background-color: var(--dropdown-background-hover);
	}

	.custom-dropdown div.text {
		max-width: 130px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.custom-dropdown span.icon {
		display: flex;
		align-items: center;
		height: var(--icon-s);
		width: var(--icon-s);
	}

	select {
		appearance: none;
		padding: unset;
		height:  1px;
		background: var(--interactive-normal);
		box-shadow: none;
		border: var(--border-width) solid var(--color-black);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width:1px;
	}

	select:hover {
		background: var(--interactive-hover);
	}

	.connecting,
	.error {
		display: flex;
		align-items: center;
		align-self: flex-end;
	}

	.connecting span,
	.error span {
		display: flex;
		align-items: center;
	}

	.connecting,
	.error {
		gap: var(--size-4-1);
		color: var(--text-faint);
		font-size: var(--font-smaller);
	}

	.error {
		color: var(--text-error);
		opacity: 0.8;
	}

	.connecting :global(svg) {
		animation: spin 2s linear infinite;
	}
</style>
