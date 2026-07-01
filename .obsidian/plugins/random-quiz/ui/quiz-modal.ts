import { App, Modal, Setting } from "obsidian";
import { QuestionItem } from "../settings";

export class QuizModal extends Modal {
  private questions: QuestionItem[];
  private currentIndex: number;
  private answerRevealed: boolean;
  private onNext: () => void;

  constructor(
    app: App,
    questions: QuestionItem[],
    onNext: () => void
  ) {
    super(app);
    this.questions = questions;
    this.currentIndex = 0;
    this.answerRevealed = false;
    this.onNext = onNext;
  }

  onOpen(): void {
    this.displayQuestion();
  }

  private displayQuestion(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("random-quiz-modal");

    if (this.questions.length === 0) {
      contentEl.createEl("p", { text: "题库为空，请先扫描题库。" });
      return;
    }

    const item = this.questions[this.currentIndex];
    const progress = `${this.currentIndex + 1} / ${this.questions.length}`;

    // 进度
    contentEl.createEl("div", { cls: "quiz-progress", text: progress });

    // 来源文件
    contentEl.createEl("div", {
      cls: "quiz-source",
      text: `来源: ${item.sourceFile}`,
    });

    // 题目
    const questionEl = contentEl.createEl("div", { cls: "quiz-question" });
    questionEl.createEl("strong", { text: "题目：" });
    questionEl.createEl("p", { text: item.question });

    // 答案区域
    const answerContainer = contentEl.createEl("div", { cls: "quiz-answer-container" });

    if (!this.answerRevealed) {
      const revealBtn = answerContainer.createEl("button", {
        cls: "quiz-reveal-btn",
        text: "显示答案",
      });
      revealBtn.addEventListener("click", () => {
        this.answerRevealed = true;
        this.displayQuestion();
      });
    } else {
      answerContainer.createEl("div", { cls: "quiz-answer-label" }).createEl("strong", {
        text: "答案：",
      });
      answerContainer.createEl("div", { cls: "quiz-answer", text: item.answer });
    }

    // 按钮区
    const buttonRow = contentEl.createEl("div", { cls: "quiz-buttons" });

    if (this.currentIndex < this.questions.length - 1) {
      const nextBtn = buttonRow.createEl("button", { cls: "quiz-next-btn", text: "下一题" });
      nextBtn.addEventListener("click", () => {
        this.currentIndex++;
        this.answerRevealed = false;
        this.displayQuestion();
      });
    } else {
      const finishBtn = buttonRow.createEl("button", {
        cls: "quiz-finish-btn",
        text: "完成",
      });
      finishBtn.addEventListener("click", () => {
        this.close();
        this.onNext();
      });
    }

    const closeBtn = buttonRow.createEl("button", { text: "关闭" });
    closeBtn.addEventListener("click", () => this.close());
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
