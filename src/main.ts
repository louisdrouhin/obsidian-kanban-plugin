import {App, ItemView, Notice, Plugin, TFile, TFolder, WorkspaceLeaf} from 'obsidian';
import {DEFAULT_SETTINGS, DailyKanbanSettings, DailyKanbanSettingTab} from "./settings";

const KANBAN_VIEW_TYPE = 'daily-kanban';

interface KanbanTask {
	text: string;
	status: 'backlog' | 'todo' | 'in-progress' | 'done';
	sourceFile: string;
	sourceFileName: string;
	originalLine: number;
	tag?: 'MIT' | 'I' | 'NI';
}

export default class DailyKanbanPlugin extends Plugin {
	settings: DailyKanbanSettings;
	kanbanView: KanbanView | null = null;

	async onload() {
		await this.loadSettings();

		// Register the Kanban view
		this.registerView(KANBAN_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
			this.kanbanView = new KanbanView(leaf, this);
			return this.kanbanView;
		});

		// Add ribbon icon to open Kanban view
		this.addRibbonIcon('layout-grid', 'Daily Kanban', () => {
			this.openKanban();
		});

		// Add command to open Kanban
		this.addCommand({
			id: 'open-daily-kanban',
			name: 'Open Daily Kanban',
			callback: () => {
				this.openKanban();
			}
		});

		// Add settings tab
		this.addSettingTab(new DailyKanbanSettingTab(this.app, this));

		// Listen for file changes and refresh the Kanban view
		this.registerEvent(this.app.vault.on('modify', (file: TFile) => {
			if (file instanceof TFile && file.extension === 'md') {
				// Check if the modified file is in our watched folder
				const folderPath = this.settings.folderPath;
				if (file.path.startsWith(folderPath)) {
					this.refreshKanban();
				}
			}
		}));

		// Also listen for file deletions
		this.registerEvent(this.app.vault.on('delete', (file) => {
			if (file instanceof TFile && file.extension === 'md') {
				const folderPath = this.settings.folderPath;
				if (file.path.startsWith(folderPath)) {
					this.refreshKanban();
				}
			}
		}));
	}

	async openKanban() {
		const { workspace } = this.app;

		// Check if view already exists
		const leaves = workspace.getLeavesOfType(KANBAN_VIEW_TYPE);
		let leaf: WorkspaceLeaf | null = null;

		if (leaves.length > 0) {
			leaf = leaves[0] || null;
		} else {
			const rightLeaf = workspace.getRightLeaf(false);
			leaf = rightLeaf || null;
			if (leaf) {
				await leaf.setViewState({ type: KANBAN_VIEW_TYPE });
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<DailyKanbanSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	refreshKanban() {
		if (this.kanbanView) {
			this.kanbanView.render();
		}
	}
}

class KanbanView extends ItemView {
	plugin: DailyKanbanPlugin;
	tasks: KanbanTask[] = [];
	draggedCard: HTMLElement | null = null;
	draggedTask: KanbanTask | null = null;
	isRendering: boolean = false;
	renderTimeout: NodeJS.Timeout | null = null;
	doneColumnHidden: boolean = false;

	constructor(leaf: WorkspaceLeaf, plugin: DailyKanbanPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return KANBAN_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Daily Kanban';
	}

	getIcon(): string {
		return 'layout-grid';
	}

	async onOpen() {
		await this.render();
	}

	async render() {
		// Prevent concurrent renders that cause duplicates
		if (this.isRendering) {
			return;
		}

		// Debounce rapid refresh calls
		if (this.renderTimeout) {
			clearTimeout(this.renderTimeout);
		}

		this.renderTimeout = setTimeout(async () => {
			this.isRendering = true;
			try {
				const container = this.containerEl.children[1] as HTMLElement | undefined;
				if (!container) return;

				container.empty();

				// Load tasks
				await this.loadTasks();

				// Add header
				const headerDiv = container.createDiv('kanban-header');
				const titleEl = headerDiv.createEl('h2', { text: 'Daily Kanban' });

		// Create Kanban board
		const kanbanContainer = container.createDiv('kanban-container');
		if (this.doneColumnHidden) {
			kanbanContainer.classList.add('hide-done-column');
		}

		const columns = [
			{ id: 'backlog', label: 'Backlog', status: 'backlog' as const },
			{ id: 'todo', label: 'To Do', status: 'todo' as const },
			{ id: 'in-progress', label: 'In Progress', status: 'in-progress' as const },
			{ id: 'done', label: 'Done', status: 'done' as const }
		];

				columns.forEach(column => {
					const columnEl = kanbanContainer.createDiv(`kanban-column ${column.id}`);
					columnEl.setAttribute('data-status', column.status);

					const header = columnEl.createDiv('kanban-column-header');
					header.textContent = column.label;

					const cardsContainer = columnEl.createDiv('kanban-cards');

					// Filter tasks for this column
					const columnTasks = this.tasks.filter(t => t.status === column.status);

					columnTasks.forEach(task => {
						this.createCard(cardsContainer, task);
					});

					// Set up drop zone
					this.setupDropZone(columnEl);
				});

				new Notice('Daily Kanban loaded');
			} finally {
				this.isRendering = false;
			}
		}, 300); // Debounce for 300ms
	}

	toggleDoneColumn() {
		this.doneColumnHidden = !this.doneColumnHidden;
		const kanbanContainer = this.containerEl.querySelector('.kanban-container');
		if (kanbanContainer) {
			kanbanContainer.classList.toggle('hide-done-column', this.doneColumnHidden);
		}
	}

	private createCard(container: HTMLElement, task: KanbanTask) {
		const card = container.createDiv('kanban-card');
		card.draggable = true;
		card.setAttribute('data-source', task.sourceFile);
		card.setAttribute('data-line', task.originalLine.toString());

		const contentDiv = card.createDiv('kanban-card-content');

		const title = contentDiv.createDiv('kanban-card-title');
		title.textContent = task.text;

		if (task.tag) {
			const badge = contentDiv.createEl('span', { text: task.tag });
			badge.addClass('kanban-tag-badge', `kanban-tag-${task.tag.toLowerCase()}`);
		}

		const source = contentDiv.createDiv('kanban-card-source');
		source.textContent = task.sourceFileName;

		// Drag event listeners
		card.addEventListener('dragstart', (e) => {
			this.draggedCard = card;
			this.draggedTask = task;
			card.classList.add('dragging');
			if (e.dataTransfer) {
				e.dataTransfer.effectAllowed = 'move';
			}
		});

		card.addEventListener('dragend', () => {
			card.classList.remove('dragging');
			this.draggedCard = null;
			this.draggedTask = null;
		});

		// Click to cycle through statuses
		card.addEventListener('click', (e) => {
			if (e.button === 0 && !(e.target as HTMLElement).closest('.kanban-card-collapse-btn')) { // Left click, exclude button
				this.cycleTaskStatus(task);
			}
		});
	}

	private setupDropZone(column: HTMLElement) {
		column.addEventListener('dragover', (e) => {
			e.preventDefault();
			if (e.dataTransfer) {
				e.dataTransfer.dropEffect = 'move';
				column.classList.add('drop-target');
			}
		});

		column.addEventListener('dragleave', () => {
			column.classList.remove('drop-target');
		});

		column.addEventListener('drop', async (e) => {
			e.preventDefault();
			column.classList.remove('drop-target');

			if (this.draggedTask) {
				const statusAttr = column.getAttribute('data-status');
				if (statusAttr && (statusAttr === 'backlog' || statusAttr === 'todo' || statusAttr === 'in-progress' || statusAttr === 'done')) {
					await this.updateTaskStatus(this.draggedTask, statusAttr as KanbanTask['status']);
				}
			}
		});
	}

	private async cycleTaskStatus(task: KanbanTask) {
		const statuses: KanbanTask['status'][] = ['backlog', 'todo', 'in-progress', 'done'];
		const currentIndex = statuses.indexOf(task.status);
		const nextStatus = statuses[(currentIndex + 1) % statuses.length] || 'todo';
		await this.updateTaskStatus(task, nextStatus);
	}

	private async updateTaskStatus(task: KanbanTask, newStatus: KanbanTask['status']) {
		const file = this.plugin.app.vault.getAbstractFileByPath(task.sourceFile);

		if (!(file instanceof TFile)) {
			new Notice('Could not find file: ' + task.sourceFile);
			return;
		}

		try {
			const content = await this.plugin.app.vault.read(file);
			const lines = content.split('\n');

			// Find and update the task line
			const statusMap: Record<KanbanTask['status'], string> = {
				'backlog': '[b]',
				'todo': '[ ]',
				'in-progress': '[/]',
				'done': '[x]'
			};

			const newCheckbox = statusMap[newStatus];
			const oldLine = lines[task.originalLine];

			// Replace the checkbox in the line
			if (oldLine) {
				// Replace any checkbox pattern with the new one
				const updatedLine = oldLine.replace(/\[[^\]]*\]/, newCheckbox);

				if (updatedLine !== oldLine) {
					lines[task.originalLine] = updatedLine;
					const newContent = lines.join('\n');
					await this.plugin.app.vault.modify(file, newContent);

					console.log('Task updated:', {
						file: task.sourceFile,
						line: task.originalLine,
						oldLine: oldLine,
						newLine: updatedLine
					});

					// Update local task
					task.status = newStatus;

					// Re-render the board
					await this.render();
				} else {
					new Notice('Could not find checkbox to update');
				}
			}
		} catch (error) {
			console.error('Error updating task:', error);
			new Notice('Error updating task');
		}
	}

	private async loadTasks() {
		this.tasks = [];

		const folder = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.folderPath);

		if (!folder || !(folder instanceof TFolder)) {
			new Notice(`Folder not found: ${this.plugin.settings.folderPath}`);
			return;
		}

		const files = folder.children
			?.filter((f): f is TFile => f instanceof TFile && f.extension === 'md')
			|| [];

		for (const file of files) {
			try {
				const content = await this.plugin.app.vault.read(file);
				const tasks = this.parseTasksFromContent(content, file.path, file.name);
				this.tasks.push(...tasks);
			} catch (error) {
				console.error(`Error reading file ${file.path}:`, error);
			}
		}
	}

	private parseTasksFromContent(content: string, filePath: string, filename: string): KanbanTask[] {
		const tasks: KanbanTask[] = [];
		const lines = content.split('\n');
		let inTaskSection = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Check if we're entering the task section
			if (line && line.includes(this.plugin.settings.heading)) {
				inTaskSection = true;
				continue;
			}

			// Exit task section if we hit another heading
			if (inTaskSection && line && line.match(/^#+\s/)) {
				inTaskSection = false;
				continue;
			}

			// Parse task if we're in the section
			if (inTaskSection && line) {
				const taskMatch = line.match(/^(\s*)-\s*\[(.)\]\s*(.*)/);
				if (taskMatch) {
					const checkbox = taskMatch[2];
					let text = taskMatch[3] ? taskMatch[3].trim() : '';

					// Parse tag from text
					const tagMatch = text.match(/#(MIT|NI|I)\b/);
					const tag = tagMatch ? tagMatch[1] as KanbanTask['tag'] : undefined;
					const cleanText = text.replace(/#(MIT|NI|I)\b/, '').trim();

					let status: KanbanTask['status'] = 'todo';
					if (checkbox === 'b') status = 'backlog';
					else if (checkbox === ' ') status = 'todo';
					else if (checkbox === '/') status = 'in-progress';
					else if (checkbox === 'x') status = 'done';

					tasks.push({
						text: cleanText,
						status,
						sourceFile: filePath,
						sourceFileName: filename,
						originalLine: i,
						tag
					});
				}
			}
		}

		return tasks;
	}

	async onClose() {
		// Clean up
	}
}
