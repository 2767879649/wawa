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

    containerEl.createEl("h3", { text: "AI 增强（可选）" });

    new Setting(containerEl)
      .setName("AI API Key")
      .setDesc("用于 AI 辅助生成题目的 API 密钥")
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
  }
}
