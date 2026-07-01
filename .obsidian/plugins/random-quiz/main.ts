import { Notice, Plugin, TFile } from "obsidian";
import { RandomQuizSettings, DEFAULT_SETTINGS } from "./settings";
import { QuestionBank } from "./engine/question-bank";
import { QuizModal } from "./ui/quiz-modal";
import { RandomQuizSettingTab } from "./ui/settings-tab";
import { ImportModal } from "./ui/import-modal";
import { generateQuestionsFromText } from "./engine/ai-extractor";
import { AIOrganizer } from "./engine/ai-organizer";

export default class RandomQuizPlugin extends Plugin {
  settings: RandomQuizSettings;
  questionBank: QuestionBank;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.questionBank = new QuestionBank(this);
    await this.questionBank.loadFromDisk();

    // 设置面板
    this.addSettingTab(
      new RandomQuizSettingTab(this.app, this, this.settings, this.saveSettings.bind(this))
    );

    // === 命令注册 ===

    // 导入题目
    this.addCommand({
      id: "import-questions",
      name: "导入题目",
      callback: () => {
        new ImportModal(this.app, this, this.settings, async (items) => {
          await this.questionBank.addItems(items, this.settings);
        }).open();
      },
    });

    // 基础扫描
    this.addCommand({
      id: "scan-question-bank",
      name: "扫描题库",
      callback: async () => {
        new Notice("正在扫描题库...");
        const count = await this.questionBank.scanFolder(this.settings);
        new Notice(`题库扫描完成，共提取 ${count} 道题目`);
      },
    });

    // AI 智能扫描（全流程）
    this.addCommand({
      id: "ai-scan",
      name: "AI 智能扫描",
      callback: async () => {
        if (!this.settings.aiApiKey) {
          new Notice("请先在设置中配置 AI API Key");
          return;
        }
        new Notice("正在 AI 智能扫描（规则提取 + AI 检测 + 搜索答案 + 规范化）...");
        const count = await this.questionBank.scanFolderEnhanced(this.settings);
        new Notice(`AI 智能扫描完成，共提取 ${count} 道题目`);
      },
    });

    // AI 补全答案
    this.addCommand({
      id: "ai-enrich-answers",
      name: "AI 补全答案",
      editorCallback: async () => {
        if (!this.settings.aiApiKey) {
          new Notice("请先在设置中配置 AI API Key");
          return;
        }

        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice("请先打开一个文档");
          return;
        }

        new Notice("正在搜索并补全答案...");
        const organizer = new AIOrganizer(this, this.settings);
        const items = await organizer.processDocument(file);
        await this.questionBank.addItems(items, this.settings);
        new Notice(`AI 补全完成，共处理 ${items.length} 道题目`);
      },
    });

    // 随机抽题
    this.addCommand({
      id: "random-quiz",
      name: "随机抽题",
      callback: () => this.startQuiz(),
    });

    // AI 生成题目（从选中文本）
    this.addCommand({
      id: "ai-generate-questions",
      name: "AI 生成题目（从选中文本）",
      editorCallback: async (editor) => {
        const selection = editor.getSelection();
        if (!selection) {
          new Notice("请先选中一段文本");
          return;
        }

        const file = this.app.workspace.getActiveFile();
        const sourcePath = file?.path || "unknown";

        new Notice("正在调用 AI 生成题目...");
        const items = await generateQuestionsFromText(selection, sourcePath, this.settings);

        if (items.length > 0) {
          await this.questionBank.addItems(items, this.settings);
          new Notice(`已添加 ${items.length} 道题目到题库`);
        }
      },
    });

    // 查看题库统计
    this.addCommand({
      id: "quiz-stats",
      name: "查看题库统计",
      callback: () => {
        const total = this.questionBank.getTotalCount();
        const remaining = this.questionBank.getRemainingCount();
        const stats = this.questionBank.getStatsByFile();
        let msg = `题库总量: ${total}，待复习: ${remaining}\n`;
        stats.forEach((count, file) => {
          msg += `  ${file}: ${count} 题\n`;
        });
        new Notice(msg, 8000);
      },
    });

    // 重置进度
    this.addCommand({
      id: "reset-progress",
      name: "重置答题进度",
      callback: () => {
        this.questionBank.resetProgress();
        new Notice("答题进度已重置");
      },
    });

    // 侧边栏图标
    this.addRibbonIcon("dice", "随机抽题", () => this.startQuiz());
  }

  private startQuiz(): void {
    if (this.questionBank.getTotalCount() === 0) {
      new Notice('题库为空，请先运行"AI 智能扫描"或"导入题目"');
      return;
    }

    const questions = this.questionBank.getRandom(this.settings.questionsPerRound);

    if (questions.length === 0) {
      new Notice("没有可用的题目");
      return;
    }

    new QuizModal(this.app, questions, () => {}).open();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
