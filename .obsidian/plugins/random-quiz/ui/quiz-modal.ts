import { App, Modal } from "obsidian";
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
      contentEl.createEl("p", { text: "题库为空，请先扫描题库或导入题目。" });
      return;
    }

    const item = this.questions[this.currentIndex];
    const progress = `${this.currentIndex + 1} / ${this.questions.length}`;

    // 进度
    contentEl.createEl("div", { cls: "quiz-progress", text: progress });

    // 来源信息
    const sourceText = item.sourceFile !== "imported-text"
      ? `来源: ${item.sourceFile}`
      : "来源: 导入的文本";

    const sourceDiv = contentEl.createEl("div", { cls: "quiz-source" });
    sourceDiv.createEl("span", { text: sourceText });

    // 答案来源标识
    if (item.answerSource === "ai-generated") {
      sourceDiv.createEl("span", {
        cls: "quiz-ai-badge",
        text: "AI 生成",
      });
    }

    if (item.relatedFiles && item.relatedFiles.length > 0) {
      sourceDiv.createEl("div", {
        cls: "quiz-related",
        text: `参考: ${item.relatedFiles.join(", ")}`,
      });
    }

    // 题目
    const questionEl = contentEl.createEl("div", { cls: "quiz-question" });
    questionEl.createEl("strong", { text: "题目：" });
    questionEl.createEl("p", { text: item.question });

    // 选项列表（在题目下方始终显示，不依赖答案揭示）
    if (item.options && item.options.length > 0) {
      const optionsContainer = contentEl.createEl("div", { cls: "quiz-options-container" });
      const labels = ["A", "B", "C", "D", "E", "F"];
      for (let i = 0; i < item.options.length; i++) {
        const row = optionsContainer.createEl("div", { cls: "quiz-option-row" });
        const isCorrect = this.answerRevealed && i === (item.correctIndex ?? 0);
        row.createEl("span", {
          cls: `quiz-option-label${isCorrect ? " quiz-option-correct" : ""}`,
          text: labels[i] || String(i),
        });
        row.createEl("span", {
          cls: `quiz-option-text${isCorrect ? " quiz-option-correct" : ""}`,
          text: item.options[i],
        });
        if (isCorrect) {
          row.createEl("span", { cls: "quiz-option-check", text: " ✓" });
        }
      }
    }

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
    } else if (item.options && item.options.length > 0) {
      // 结构化选项：只显示正确答案
      const correctIdx = item.correctIndex ?? 0;
      const label = ["A", "B", "C", "D", "E", "F"][correctIdx] || "?";
      answerContainer.createEl("div", { cls: "quiz-answer-label" }).createEl("strong", {
        text: "答案：",
      });
      answerContainer.createEl("div", {
        cls: "quiz-answer",
        text: `${label}. ${item.options[correctIdx] || item.answer}`,
      });
    } else {
      answerContainer.createEl("div", { cls: "quiz-answer-label" }).createEl("strong", {
        text: "答案：",
      });
      // 选择题选项渲染
      if (isChoiceAnswer(item.answer)) {
        answerContainer.createEl("div", { cls: "quiz-answer" }).appendChild(
          renderChoiceAnswer(item.answer)
        );
      } else {
        answerContainer.createEl("div", { cls: "quiz-answer", text: item.answer });
      }
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

/** 判断答案是否包含选择题选项 */
function isChoiceAnswer(answer: string): boolean {
  return /[A-D]([).、．]\s*|\s+)/.test(answer);
}

/** 渲染选择题选项，高亮正确答案 */
function renderChoiceAnswer(answer: string): HTMLElement {
  const container = document.createElement("div");
  const lines = answer.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const optionMatch = trimmed.match(/^([A-D])([).、．]\s*|\s+)(.+)/);
    if (optionMatch) {
      const row = container.createEl("div", { cls: "quiz-option-row" });
      const isCorrect = /\*\*\[✓\]\*\*/.test(trimmed);

      row.createEl("span", {
        cls: `quiz-option-label${isCorrect ? " quiz-option-correct" : ""}`,
        text: optionMatch[1],
      });

      const text = optionMatch[3].replace(/\*\*\[✓\]\*\*/, "").trim();
      const textEl = row.createEl("span", {
        cls: `quiz-option-text${isCorrect ? " quiz-option-correct" : ""}`,
        text,
      });

      if (isCorrect) {
        textEl.createEl("span", { cls: "quiz-option-check", text: " ✓" });
      }
    } else {
      container.createEl("div", { text: trimmed, cls: "quiz-answer-note" });
    }
  }

  return container;
}
