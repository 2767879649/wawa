import { Notice, TFile } from "obsidian";
import { Plugin } from "obsidian";
import { RandomQuizSettings, QuestionItem } from "../settings";
import { extractQuestions } from "./rule-extractor";
import { normalizeQAPairs, searchAndAnswer, generateQuestionsFromText } from "./ai-extractor";

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

  /** 完整流水线：规则提取 → AI 检测 → 规范化 → AI 搜索答案 */
  async processDocument(file: TFile): Promise<QuestionItem[]> {
    const content = await this.plugin.app.vault.read(file);

    // 第一步：规则提取
    let items = extractQuestions(content, file.path);

    // 第二步：AI 检测遗漏的纯文本段落
    if (this.settings.aiDetectQuestions && this.settings.aiApiKey) {
      const missedBlocks = this.findUnprocessedBlocks(content, items);
      if (missedBlocks.length > 0) {
        const prompt = `请从以下段落中提取可以作为复习题目的知识点。每个知识点生成一个问题和答案。
输出 JSON 数组：[{"question": "...", "answer": "..."}]

段落内容：
${missedBlocks.join("\n\n---\n\n")}

只输出 JSON 数组。如果没有可提取的题目，输出空数组 []。`;

        const aiItems = await generateQuestionsFromText(
          missedBlocks.join("\n\n---\n\n"),
          file.path,
          this.settings
        );
        items.push(...aiItems);
      }
    }

    // 第三步：格式规范化
    if (this.settings.normalizeFormat && this.settings.aiApiKey && items.length > 0) {
      items = await normalizeQAPairs(items, this.settings);
      // 恢复 sourceFile 和 sectionIndex
      for (const item of items) {
        item.sourceFile = file.path;
      }
    }

    // 第四步：AI 搜索答案（补全不完整的答案）
    if (this.settings.aiAutoSearch && this.settings.aiApiKey) {
      items = await this.enrichAnswersWithSearch(items);
    }

    return items;
  }

  /** 处理粘贴文本 */
  async processText(text: string): Promise<QuestionItem[]> {
    // 先用规则提取
    let items = extractQuestions(text, "imported-text");

    // AI 检测
    if (this.settings.aiDetectQuestions && this.settings.aiApiKey) {
      const aiItems = await generateQuestionsFromText(text, "imported-text", this.settings);
      items.push(...aiItems);
    }

    // 规范化
    if (this.settings.normalizeFormat && this.settings.aiApiKey && items.length > 0) {
      items = await normalizeQAPairs(items, this.settings);
    }

    return items;
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
      // 跳过已有完整答案的题目（答案超过 50 字视为完整）
      if (item.answer.length > 50) continue;

      const contexts: { file: string; content: string }[] = [];
      const scope = this.settings.aiSearchScope;

      // 从题目中提取关键词
      const keywords = item.question
        .replace(/[？?。，,！!、\s]+/g, " ")
        .split(" ")
        .filter((w) => w.length > 1)
        .slice(0, 5);

      for (const file of vaultFiles) {
        // 根据搜索范围过滤
        if (scope === "document" && file.path !== item.sourceFile) continue;
        if (
          scope === "folder" &&
          file.path.split("/").slice(0, -1).join("/") !==
            item.sourceFile.split("/").slice(0, -1).join("/")
        )
          continue;

        if (contexts.length >= 3) break; // 最多3个参考文件

        try {
          const content = await this.plugin.app.vault.read(file);
          // 检查是否包含关键词
          const matchCount = keywords.filter((kw) => content.includes(kw)).length;
          if (matchCount >= 2) {
            // 提取相关段落
            const relevantParagraphs = this.extractRelevantParagraphs(content, keywords);
            if (relevantParagraphs) {
              contexts.push({ file: file.path, content: relevantParagraphs });
            }
          }
        } catch (e) {
          // skip unreadable files
        }
      }

      if (contexts.length > 0) {
        const result = await searchAndAnswer(
          item.question,
          item.answer,
          contexts,
          this.settings
        );
        if (result) {
          item.answer = result.answer;
          item.answerSource = "ai-generated";
          item.relatedFiles = result.relatedFiles;
        }
      }
    }

    return items;
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
