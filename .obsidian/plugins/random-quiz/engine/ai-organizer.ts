import { Notice, TFile } from "obsidian";
import { Plugin } from "obsidian";
import { RandomQuizSettings, QuestionItem } from "../settings";
import { extractQuestions } from "./rule-extractor";
import { normalizeQAPairs, searchAndAnswer, generateQuestionsFromText } from "./ai-extractor";

/** 检查答案是否包含选择题选项 */
function hasChoiceOptions(answer: string): boolean {
  const lines = answer.split("\n");
  const optionCount = lines.filter((l) => /^[A-D]([).、．]\s*|\s+)/.test(l.trim())).length;
  return optionCount >= 2;
}

/**
 * AI 智能整理器：自动识别题目段落 + 搜索答案 + 格式规范化
 */
export class AIOrganizer {
  private plugin: Plugin;
  private settings: RandomQuizSettings;

  constructor(plugin: Plugin, settings: RandomQuizSettings) {
    this.plugin = plugin;
    this.settings = settings;
  }

  /** 完整流水线：规则提取 → AI 检测 → 去重 → 规范化 → AI 搜索答案 */
  async processDocument(file: TFile): Promise<QuestionItem[]> {
    const content = await this.plugin.app.vault.read(file);

    // 第一步：规则提取
    let items = extractQuestions(content, file.path);

    // 第二步：AI 检测遗漏的纯文本段落
    if (this.settings.aiDetectQuestions && this.settings.aiApiKey) {
      const missedBlocks = this.findUnprocessedBlocks(content, items);
      if (missedBlocks.length > 0) {
        const aiItems = await generateQuestionsFromText(
          missedBlocks.join("\n\n---\n\n"),
          file.path,
          this.settings
        );
        items = this.deduplicate([...items, ...aiItems]);
      }
    }

    // 第三步：格式规范化（保护选择题选项不被 AI 丢弃）
    if (this.settings.normalizeFormat && this.settings.aiApiKey && items.length > 0) {
      const before = items.map((i) => ({ question: i.question, answer: i.answer, hasOptions: hasChoiceOptions(i.answer) }));
      items = await normalizeQAPairs(items, this.settings);
      for (let i = 0; i < items.length; i++) {
        if (before[i]?.hasOptions && !hasChoiceOptions(items[i].answer)) {
          items[i].answer = before[i].answer;
        }
        items[i].sourceFile = file.path;
      }
    }

    // 第四步：AI 搜索答案（补全不完整的答案）
    if (this.settings.aiAutoSearch && this.settings.aiApiKey) {
      items = await this.enrichAnswersWithSearch(items);
    }

    // 过滤掉没有答案的题目
    return items.filter((item) => item.answer && item.answer.trim().length > 0);
  }

  /** 处理粘贴文本 */
  async processText(text: string): Promise<QuestionItem[]> {
    // 先用规则提取
    let items = extractQuestions(text, "imported-text");

    // AI 检测遗漏段落（而非全文重复提取）
    if (this.settings.aiDetectQuestions && this.settings.aiApiKey) {
      const missedBlocks = this.findUnprocessedBlocksInText(text, items);
      if (missedBlocks.length > 0) {
        const aiItems = await generateQuestionsFromText(
          missedBlocks.join("\n\n---\n\n"),
          "imported-text",
          this.settings
        );
        items = this.deduplicate([...items, ...aiItems]);
      }
    }

    // 规范化（保护选项）
    if (this.settings.normalizeFormat && this.settings.aiApiKey && items.length > 0) {
      const before = items.map((i) => ({ answer: i.answer, hasOptions: hasChoiceOptions(i.answer) }));
      items = await normalizeQAPairs(items, this.settings);
      for (let i = 0; i < items.length; i++) {
        if (before[i]?.hasOptions && !hasChoiceOptions(items[i].answer)) {
          items[i].answer = before[i].answer;
        }
      }
    }

    return items.filter((item) => item.answer && item.answer.trim().length > 0);
  }

  /** 去重：按题目文本相似度合并 */
  private deduplicate(items: QuestionItem[]): QuestionItem[] {
    const seen = new Map<string, QuestionItem>();
    for (const item of items) {
      const key = this.normalizeForDedup(item.question);
      const existing = seen.get(key);
      if (!existing || item.answer.length > existing.answer.length) {
        seen.set(key, item);
      }
    }
    return [...seen.values()];
  }

  /** 归一化题目文本用于去重比较 */
  private normalizeForDedup(text: string): string {
    return text
      .replace(/[？?。，,！!、\s"'""''「」『』【】《》（）()]+/g, "")
      .replace(/^(请简述|请解释|什么是|简述|解释|什么叫做|什么叫)/, "")
      .toLowerCase()
      .substring(0, 40);
  }

  /** 找到粘贴文本中规则未处理的块 */
  private findUnprocessedBlocksInText(text: string, items: QuestionItem[]): string[] {
    const lines = text.split("\n");
    const blocks: string[] = [];
    let currentBlock: string[] = [];

    for (const line of lines) {
      if (/^(#{1,6})\s/.test(line) || /^\s*[-*\d]+[.)]\s+/.test(line) || line.trim() === "---" || line.trim() === "") {
        if (currentBlock.length > 0) {
          const block = currentBlock.join("\n").trim();
          if (block.length > 40 && !this.isAlreadyExtracted(block, items)) {
            blocks.push(block);
          }
          currentBlock = [];
        }
      } else {
        currentBlock.push(line);
      }
    }
    if (currentBlock.length > 0) {
      const block = currentBlock.join("\n").trim();
      if (block.length > 40 && !this.isAlreadyExtracted(block, items)) {
        blocks.push(block);
      }
    }
    return blocks;
  }

  /** 找到规则提取未处理的文本块 */
  private findUnprocessedBlocks(content: string, items: QuestionItem[]): string[] {
    const blocks: string[] = [];
    const lines = content.split("\n");

    // 跳过 frontmatter
    let startIdx = 0;
    if (lines[0]?.trim() === "---") {
      const end = lines.indexOf("---", 1);
      if (end !== -1) startIdx = end + 1;
    }

    // 按空行切分段落
    let currentBlock: string[] = [];
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];

      // 跳过标题、列表、分隔符（这些已被规则引擎处理）
      if (/^(#{1,6})\s/.test(line) || /^\s*[-*\d]+[.)]\s+/.test(line) || line.trim() === "---") {
        if (currentBlock.length > 0) {
          const block = currentBlock.join("\n").trim();
          if (block.length > 40 && !this.isAlreadyExtracted(block, items)) {
            blocks.push(block);
          }
          currentBlock = [];
        }
        continue;
      }

      if (line.trim() === "") {
        if (currentBlock.length > 0) {
          const block = currentBlock.join("\n").trim();
          if (block.length > 40 && !this.isAlreadyExtracted(block, items)) {
            blocks.push(block);
          }
          currentBlock = [];
        }
      } else {
        currentBlock.push(line);
      }
    }

    // 最后一块
    if (currentBlock.length > 0) {
      const block = currentBlock.join("\n").trim();
      if (block.length > 40 && !this.isAlreadyExtracted(block, items)) {
        blocks.push(block);
      }
    }

    return blocks;
  }

  /** 检查文本内容是否已被提取 */
  private isAlreadyExtracted(block: string, items: QuestionItem[]): boolean {
    const blockLower = block.substring(0, 100).toLowerCase();
    for (const item of items) {
      if (item.answer.toLowerCase().includes(blockLower)) return true;
    }
    return false;
  }

  /** 搜索 vault 中的答案并补全 */
  private async enrichAnswersWithSearch(items: QuestionItem[]): Promise<QuestionItem[]> {
    const vaultFiles = this.plugin.app.vault.getMarkdownFiles();

    for (const item of items) {
      if (item.answer.length > 80) continue;

      const contexts: { file: string; content: string; relevance: number }[] = [];
      const scope = this.settings.aiSearchScope;

      // 提取有意义的搜索词（中文按字符切+常见词组合，英文按空格）
      const searchTerms = this.extractSearchTerms(item.question);

      for (const file of vaultFiles) {
        if (scope === "document" && file.path !== item.sourceFile) continue;
        const fileFolder = file.path.split("/").slice(0, -1).join("/");
        const sourceFolder = item.sourceFile.split("/").slice(0, -1).join("/");
        if (scope === "folder" && fileFolder !== sourceFolder) continue;

        if (contexts.length >= 5) break;

        try {
          const content = await this.plugin.app.vault.read(file);
          const matchCount = searchTerms.filter((kw) => content.includes(kw)).length;
          if (matchCount >= 1) {
            const relevant = this.extractRelevantParagraphs(content, searchTerms);
            if (relevant.length > 20) {
              contexts.push({ file: file.path, content: relevant, relevance: matchCount });
            }
          }
        } catch (e) { /* skip */ }
      }

      // 按相关度排序，取 top 3
      contexts.sort((a, b) => b.relevance - a.relevance);
      const topContexts = contexts.slice(0, 3);

      if (topContexts.length > 0) {
        const result = await searchAndAnswer(
          item.question,
          item.answer,
          topContexts.map(c => ({ file: c.file, content: c.content })),
          this.settings
        );
        if (result && result.answer.length > item.answer.length) {
          item.answer = result.answer;
          item.answerSource = "ai-generated";
          item.relatedFiles = result.relatedFiles;
        }
      }
    }

    return items.filter((item) => item.answer && item.answer.trim().length > 0);
  }

  /** 提取搜索词：中文用字符级 n-gram + 常见词组 */
  private extractSearchTerms(question: string): string[] {
    const cleaned = question.replace(/[？?。，,！!、\s"'""''「」『』【】《》（）()请简述解释什么是叫做什么叫]+/g, "");
    const terms: string[] = [];

    // 中文部分：2-3字组合
    const chineseChars = cleaned.match(/[一-鿿]+/g);
    if (chineseChars) {
      for (const chunk of chineseChars) {
        if (chunk.length >= 2) {
          terms.push(chunk); // 整个中文词
          // 2字组合
          for (let i = 0; i < chunk.length - 1; i++) {
            terms.push(chunk.substring(i, i + 2));
          }
          // 3字组合
          for (let i = 0; i < chunk.length - 2; i++) {
            terms.push(chunk.substring(i, i + 3));
          }
        } else {
          terms.push(chunk);
        }
      }
    }

    // 英文部分
    const englishWords = cleaned.match(/[a-zA-Z0-9]+/g);
    if (englishWords) {
      terms.push(...englishWords.filter(w => w.length > 1));
    }

    // 去重并限制数量
    return [...new Set(terms)].slice(0, 12);
  }

  /** 从文件内容中提取与关键词相关的段落 */
  private extractRelevantParagraphs(content: string, keywords: string[]): string {
    const lines = content.split("\n");
    const relevant: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const matchCount = keywords.filter((kw) => lines[i].includes(kw)).length;
      if (matchCount >= 1) {
        // 包含前后各 1 行
        const start = Math.max(0, i - 1);
        const end = Math.min(lines.length, i + 2);
        relevant.push(lines.slice(start, end).join("\n"));
        if (relevant.join("\n").length > 2000) break;
      }
    }

    return relevant.join("\n\n");
  }
}
