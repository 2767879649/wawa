import { App, Modal, Notice, Setting, TextAreaComponent, TFile } from "obsidian";
import { QuestionItem, RandomQuizSettings } from "../settings";
import { AIOrganizer } from "../engine/ai-organizer";
import { Plugin } from "obsidian";

export class ImportModal extends Modal {
  private plugin: Plugin;
  private settings: RandomQuizSettings;
  private onComplete: (items: QuestionItem[]) => void;
  private previewItems: QuestionItem[] = [];
  private textArea: TextAreaComponent;

  constructor(
    app: App,
    plugin: Plugin,
    settings: RandomQuizSettings,
    onComplete: (items: QuestionItem[]) => void
  ) {
    super(app);
    this.plugin = plugin;
    this.settings = settings;
    this.onComplete = onComplete;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("random-quiz-modal");

    contentEl.createEl("h2", { text: "导入题目" });

    // 模式切换标签
    const tabRow = contentEl.createEl("div", { cls: "quiz-buttons" });
    const pasteTab = tabRow.createEl("button", { text: "粘贴文本", cls: "quiz-next-btn" });
    const fileTab = tabRow.createEl("button", { text: "选择文件" });

    // 文本输入区
    const inputArea = contentEl.createEl("div");
    new Setting(inputArea).setName("输入文本").setDesc("粘贴包含题目的文本（支持 Markdown 格式）");
    this.textArea = new TextAreaComponent(inputArea);
    this.textArea.setPlaceholder("在此粘贴学习笔记内容...");
    this.textArea.inputEl.rows = 12;
    this.textArea.inputEl.style.width = "100%";

    // 选择文件按钮
    const fileArea = contentEl.createEl("div");
    fileArea.style.display = "none";
    new Setting(fileArea).setName("文件选择").setDesc("从 Vault 中选择文件导入");
    const selectBtn = fileArea.createEl("button", { text: "浏览文件..." });
    selectBtn.addEventListener("click", async () => {
      const files = await this.pickFiles();
      if (files.length > 0) {
        this.processFiles(files);
      }
    });

    pasteTab.addEventListener("click", () => {
      inputArea.style.display = "block";
      fileArea.style.display = "none";
    });
    fileTab.addEventListener("click", () => {
      inputArea.style.display = "none";
      fileArea.style.display = "block";
    });

    // 识别按钮
    const actionRow = contentEl.createEl("div", { cls: "quiz-buttons" });
    const recognizeBtn = actionRow.createEl("button", { text: "识别并预览", cls: "quiz-reveal-btn" });
    recognizeBtn.addEventListener("click", async () => {
      const text = this.textArea.getValue();
      if (!text.trim()) {
        new Notice("请输入文本内容");
        return;
      }
      await this.recognizeText(text);
    });

    // 预览区
    const previewSection = contentEl.createEl("div");
    previewSection.createEl("h3", { text: "预览结果" });
    const previewList = previewSection.createEl("div", { cls: "quiz-preview-list" });

    const importBtn = contentEl.createEl("button", {
      text: "全部加入题库",
      cls: "quiz-next-btn",
    });
    importBtn.style.display = "none";
    importBtn.addEventListener("click", () => {
      this.onComplete(this.previewItems);
      new Notice(`已导入 ${this.previewItems.length} 道题目`);
      this.close();
    });

    // 保存引用以便更新预览
    (this as any)._previewList = previewList;
    (this as any)._importBtn = importBtn;
  }

  private async recognizeText(text: string): Promise<void> {
    const previewList = (this as any)._previewList;
    const importBtn = (this as any)._importBtn;

    new Notice("正在识别题目...");
    const organizer = new AIOrganizer(this.plugin, this.settings);
    const items = await organizer.processText(text);

    this.previewItems = items;
    previewList.empty();

    if (items.length === 0) {
      previewList.createEl("p", { text: "未识别到可用的题目，请尝试更清晰的内容格式。" });
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const card = previewList.createEl("div", { cls: "quiz-preview-card" });

      const qRow = card.createEl("div");
      qRow.createEl("strong", { text: `Q${i + 1}: ` });
      const qInput = qRow.createEl("input", { type: "text", value: item.question });
      qInput.style.width = "100%";
      qInput.addEventListener("change", () => { item.question = qInput.value; });

      const aRow = card.createEl("div");
      aRow.createEl("strong", { text: "A: " });
      const aInput = aRow.createEl("textarea", { text: item.answer });
      aInput.rows = 3;
      aInput.style.width = "100%";
      aInput.addEventListener("change", () => { item.answer = aInput.value; });

      const delBtn = card.createEl("button", { text: "移除" });
      delBtn.addEventListener("click", () => {
        this.previewItems = this.previewItems.filter((_, idx) => idx !== i);
        this.renderPreview();
      });
    }

    importBtn.style.display = "block";
  }

  private renderPreview(): void {
    const previewList = (this as any)._previewList;
    const importBtn = (this as any)._importBtn;
    previewList.empty();

    if (this.previewItems.length === 0) {
      previewList.createEl("p", { text: "未识别到可用的题目。" });
      importBtn.style.display = "none";
      return;
    }

    for (let i = 0; i < this.previewItems.length; i++) {
      const item = this.previewItems[i];
      const card = previewList.createEl("div", { cls: "quiz-preview-card" });
      card.createEl("strong", { text: `Q${i + 1}: ${item.question}` });
      card.createEl("p", { text: `A: ${item.answer.substring(0, 200)}...` });
      const delBtn = card.createEl("button", { text: "移除" });
      delBtn.addEventListener("click", () => {
        this.previewItems = this.previewItems.filter((_, idx) => idx !== i);
        this.renderPreview();
      });
    }
  }

  private async processFiles(files: string[]): Promise<void> {
    new Notice(`正在处理 ${files.length} 个文件...`);
    const organizer = new AIOrganizer(this.plugin, this.settings);
    const allItems: QuestionItem[] = [];

    for (const path of files) {
      const file = this.plugin.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) {
        const items = await organizer.processDocument(file);
        allItems.push(...items);
      }
    }

    this.previewItems = allItems;
    const previewList = (this as any)._previewList;
    const importBtn = (this as any)._importBtn;
    previewList.empty();

    if (allItems.length === 0) {
      previewList.createEl("p", { text: "未识别到可用的题目。" });
      return;
    }

    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      const card = previewList.createEl("div", { cls: "quiz-preview-card" });
      card.createEl("strong", { text: `Q${i + 1}: ${item.question}` });
      card.createEl("p", { text: `A: ${item.answer.substring(0, 150)}...` });
    }

    importBtn.style.display = "block";
  }

  private async pickFiles(): Promise<string[]> {
    return new Promise((resolve) => {
      const files = this.plugin.app.vault.getMarkdownFiles();
      const modal = new FilePickerModal(this.app, files, resolve);
      modal.open();
    });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

/** 简单的文件选择弹窗 */
class FilePickerModal extends Modal {
  private files: TFile[];
  private resolve: (files: string[]) => void;
  private selected: Set<string> = new Set();

  constructor(app: App, files: TFile[], resolve: (files: string[]) => void) {
    super(app);
    this.files = files;
    this.resolve = resolve;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "选择文件" });

    const list = contentEl.createEl("div");
    list.style.maxHeight = "300px";
    list.style.overflowY = "auto";

    for (const file of this.files) {
      const row = list.createEl("div");
      const cb = row.createEl("input", { type: "checkbox" });
      row.createEl("span", { text: file.path });
      cb.addEventListener("change", () => {
        if (cb.checked) {
          this.selected.add(file.path);
        } else {
          this.selected.delete(file.path);
        }
      });
    }

    const btnRow = contentEl.createEl("div", { cls: "quiz-buttons" });
    btnRow.createEl("button", { text: "确认" }).addEventListener("click", () => {
      this.resolve([...this.selected]);
      this.close();
    });
    btnRow.createEl("button", { text: "取消" }).addEventListener("click", () => {
      this.resolve([]);
      this.close();
    });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
