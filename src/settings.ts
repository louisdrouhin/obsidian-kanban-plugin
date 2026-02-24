import {App, PluginSettingTab, Setting} from "obsidian";
import DailyKanbanPlugin from "./main";

export interface DailyKanbanSettings {
	folderPath: string;
	heading: string;
}

export const DEFAULT_SETTINGS: DailyKanbanSettings = {
	folderPath: 'Daily Notes',
	heading: '🎯 To-Do du jour'
}

export class DailyKanbanSettingTab extends PluginSettingTab {
	plugin: DailyKanbanPlugin;

	constructor(app: App, plugin: DailyKanbanPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Daily Kanban Settings' });

		new Setting(containerEl)
			.setName('Daily Notes Folder')
			.setDesc('Path to the folder containing your daily notes')
			.addText(text => text
				.setPlaceholder('Daily Notes')
				.setValue(this.plugin.settings.folderPath)
				.onChange(async (value) => {
					this.plugin.settings.folderPath = value || 'Daily Notes';
					await this.plugin.saveSettings();
					this.plugin.refreshKanban();
				}));

		new Setting(containerEl)
			.setName('Task Heading')
			.setDesc('Heading under which tasks are listed (e.g., "🎯 To-Do du jour")')
			.addText(text => text
				.setPlaceholder('🎯 To-Do du jour')
				.setValue(this.plugin.settings.heading)
				.onChange(async (value) => {
					this.plugin.settings.heading = value || '🎯 To-Do du jour';
					await this.plugin.saveSettings();
					this.plugin.refreshKanban();
				}));
	}
}
