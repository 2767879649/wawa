import { Notice, Plugin } from "obsidian";
import { RandomQuizSettings, DEFAULT_SETTINGS } from "./settings";
import { QuestionBank } from "./engine/question-bank";
import { QuizModal } from "./ui/quiz-modal";
import { RandomQuizSettingTab } from "./ui/settings-tab";
import { generateQuestionsFromText } from "./engine/ai-extractor";

export default class RandomQuizPlugin extends Plugin {
  settings: RandomQuizSettings;
  questionBank: QuestionBank;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.questionBank = new QuestionBank(this);

    // 启动时尝试加载已有题库
    await this.questionBank.loadFromDisk();

    // 添加设置面板
    this.addSettingTab(new RandomQuizSettingTab(this.app, this, this.settings, this.saveSettings.bind(this)));

    // 命令：扫描题库
    this.addCommand({
      id: "scan-question-bank",
      name: "扫描题库",
      callback: async () => {
        new Notice("正在扫描题库...");
        const count = await this.questionBank.scanFolder(this.settings);
        new Notice(`题库扫描完成，共提取 ${count} 道题目`);
      },
    });

    // 命令：随机抽题
    this.addCommand({
      id: "random-quiz",
      name: "随机抽题",
      callback: () => this.startQuiz(),
    });

    // 命令：AI 生成题目（从选中文本）
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
        const items = await generateQuestionsFromText(
          selection,
          sourcePath,
          this.settings
        );

        if (items.length > 0) {
          // 将生成的题目加入题库并保存
          const dataPath = ".obsidian/plugins/random-quiz/data.json";
          try {
            const raw = await this.app.vault.adapter.read(dataPath);
            const data = JSON.parse(raw);
            data.items.push(...items);
            data.updatedAt = Date.now();
            await this.app.vault.adapter.write(dataPath, JSON.stringify(data, null, 2));
            await this.questionBank.loadFromDisk();
            new Notice(`已添加 ${items.length} 道题目到题库`);
          } catch (e) {
            console.error("[RandomQuiz] 保存题目失败:", e);
          }
        }
      },
    });

    // 命令：查看题库统计
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

    // 命令：重置进度
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
      new Notice('题库为空，请先运行"扫描题库"命令');
      return;
    }

    const questions = this.questionBank.getRandom(
      this.settings.questionsPerRound
    );

    if (questions.length === 0) {
      new Notice("没有可用的题目");
      return;
    }

    new QuizModal(this.app, questions, () => {
      // 本轮结束，用户可以再次抽题
    }).open();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
