import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { RandomQuizSettings } from "../settings";

export class RandomQuizSettingTab extends PluginSettingTab {
  private settings: RandomQuizSettings;
  private saveFn: () => Promise<void>;

  constructor(app: App, plugin: Plugin, settings: RandomQuizSettings, saveFn: () => Promise<void>) {
    super(app, plugin);
    this.settings = settings;
    this.saveFn = saveFn;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "随机题目抽取 - 设置" });

    // === 基本设置 ===
    containerEl.createEl("h3", { text: "基本设置" });

    new Setting(containerEl)
      .setName("目标文件夹")
      .setDesc("扫描此文件夹内的 Markdown 文件提取题目")
      .addText((text) =>
        text
          .setPlaceholder("learning学习/备考/")
          .setValue(this.settings.targetFolder)
          .onChange(async (value) => {
            this.settings.targetFolder = value;
            await this.saveFn();
          })
      );

    new Setting(containerEl)
      .setName("排除文件")
      .setDesc("文件名包含这些关键词的文件将被跳过（逗号分隔）")
      .addText((text) =>
        text
          .setPlaceholder("README,模板")
          .setValue(this.settings.excludePatterns)
          .onChange(async (value) => {
            this.settings.excludePatterns = value;
            await this.saveFn();
          })
      );

    new Setting(containerEl)
      .setName("每轮题目数")
      .setDesc("每次随机抽取的题目数量")
      .addSlider((slider) =>
        slider
          .setLimits(1, 10, 1)
          .setValue(this.settings.questionsPerRound)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.settings.questionsPerRound = value;
            await this.saveFn();
          })
      );

    // === AI 设置 ===
    containerEl.createEl("h3", { text: "AI 增强设置" });

    new Setting(containerEl)
      .setName("AI API Key")
      .setDesc("用于 AI 功能的 API 密钥（支持 OpenAI 兼容接口）")
      .addText((text) =>
        text
          .setPlaceholder("sk-...")
          .setValue(this.settings.aiApiKey)
          .onChange(async (value) => {
            this.settings.aiApiKey = value;
            await this.saveFn();
          })
      );

    new Setting(containerEl)
      .setName("AI Endpoint")
      .setDesc("兼容 OpenAI 格式的 API 地址")
      .addText((text) =>
        text
          .setPlaceholder("https://api.deepseek.com/v1/chat/completions")
          .setValue(this.settings.aiEndpoint)
          .onChange(async (value) => {
            this.settings.aiEndpoint = value;
            await this.saveFn();
          })
      );

    new Setting(containerEl)
      .setName("AI Model")
      .setDesc("使用的模型名称")
      .addText((text) =>
        text
          .setPlaceholder("deepseek-chat")
          .setValue(this.settings.aiModel)
          .onChange(async (value) => {
            this.settings.aiModel = value;
            await this.saveFn();
          })
      );

    new Setting(containerEl)
      .setName("自动搜索答案")
      .setDesc("扫描时自动在 Vault 中搜索答案并补全")
      .addToggle((toggle) =>
        toggle.setValue(this.settings.aiAutoSearch).onChange(async (value) => {
          this.settings.aiAutoSearch = value;
          await this.saveFn();
        })
      );

    new Setting(containerEl)
      .setName("答案搜索范围")
      .setDesc("AI 搜索答案的范围")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("document", "仅当前文档")
          .addOption("folder", "当前文件夹")
          .addOption("vault", "整个 Vault")
          .setValue(this.settings.aiSearchScope)
          .onChange(async (value: "document" | "folder" | "vault") => {
            this.settings.aiSearchScope = value;
            await this.saveFn();
          })
      );

    new Setting(containerEl)
      .setName("AI 识别题目")
      .setDesc("用 AI 识别规则无法处理的纯文本段落")
      .addToggle((toggle) =>
        toggle.setValue(this.settings.aiDetectQuestions).onChange(async (value) => {
          this.settings.aiDetectQuestions = value;
          await this.saveFn();
        })
      );

    new Setting(containerEl)
      .setName("格式规范化")
      .setDesc("AI 将题目和答案统一为规范格式（问句 + 清晰答案）")
      .addToggle((toggle) =>
        toggle.setValue(this.settings.normalizeFormat).onChange(async (value) => {
          this.settings.normalizeFormat = value;
          await this.saveFn();
        })
      );
  }
}
