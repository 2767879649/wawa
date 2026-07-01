import { Plugin, TFile } from "obsidian";
import { QuestionItem, RandomQuizSettings } from "../settings";
import { extractQuestions } from "./rule-extractor";
import { AIOrganizer } from "./ai-organizer";

export class QuestionBank {
  private plugin: Plugin;
  private items: QuestionItem[] = [];
  private shownIds: Set<string> = new Set();
  private fileTimestamps: Map<string, number> = new Map();

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  /** 基本扫描：仅规则提取 */
  async scanFolder(settings: RandomQuizSettings): Promise<number> {
    if (!settings.targetFolder) return 0;

    const folder = this.plugin.app.vault.getAbstractFileByPath(
      settings.targetFolder.replace(/\/$/, "")
    );

    if (!folder) {
      console.warn(`[RandomQuiz] 文件夹不存在: ${settings.targetFolder}`);
      return 0;
    }

    const newItems: QuestionItem[] = [];
    const excludeList = settings.excludePatterns
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    await this.scanRecursive(folder, excludeList, newItems, false, settings);

    this.items = newItems;
    await this.saveToDisk(newItems);
    return newItems.length;
  }

  /** 增强扫描：规则提取 + AI 检测 + AI 搜索答案 + 规范化 */
  async scanFolderEnhanced(settings: RandomQuizSettings): Promise<number> {
    if (!settings.targetFolder) return 0;

    const folder = this.plugin.app.vault.getAbstractFileByPath(
      settings.targetFolder.replace(/\/$/, "")
    );

    if (!folder) {
      console.warn(`[RandomQuiz] 文件夹不存在: ${settings.targetFolder}`);
      return 0;
    }

    const newItems: QuestionItem[] = [];
    const excludeList = settings.excludePatterns
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    await this.scanRecursive(folder, excludeList, newItems, true, settings);

    this.items = newItems;
    await this.saveToDisk(newItems);
    return newItems.length;
  }

  private async scanRecursive(
    entry: any,
    excludeList: string[],
    result: QuestionItem[],
    enhanced: boolean,
    settings: RandomQuizSettings
  ): Promise<void> {
    if (entry.children) {
      for (const child of entry.children) {
        await this.scanRecursive(child, excludeList, result, enhanced, settings);
      }
      return;
    }

    if (!(entry instanceof TFile)) return;
    if (!entry.extension.toLowerCase().endsWith("md")) return;

    const name = entry.name;
    if (excludeList.some((p) => name.includes(p))) return;

    const mtime = entry.stat.mtime;
    this.fileTimestamps.set(entry.path, mtime);

    if (enhanced && settings.aiApiKey) {
      const organizer = new AIOrganizer(this.plugin, settings);
      const items = await organizer.processDocument(entry);
      result.push(...items);
    } else {
      const content = await this.plugin.app.vault.read(entry);
      const extracted = extractQuestions(content, entry.path);
      result.push(...extracted);
    }
  }

  /** 添加题目到题库，并写入指定文件 */
  async addItems(newItems: QuestionItem[], settings: RandomQuizSettings): Promise<void> {
    this.items.push(...newItems);
    await this.saveToDisk(this.items);
    if (settings.outputFile && newItems.length > 0) {
      await this.appendToFile(newItems, settings.outputFile);
    }
  }

  /** 将题目追加写入 vault 中的 Markdown 文件 */
  async appendToFile(items: QuestionItem[], filePath: string): Promise<void> {
    const timestamp = new Date().toISOString().split("T")[0];
    let newContent = `\n## ${timestamp} 导入 (${items.length} 题)\n\n`;

    for (const item of items) {
      newContent += `### Q: ${item.question}\n`;
      newContent += `A: ${item.answer}\n`;
      if (item.answerSource === "ai-generated") {
        newContent += `> AI 生成`;
        if (item.relatedFiles && item.relatedFiles.length > 0) {
          newContent += ` | 参考: ${item.relatedFiles.join(", ")}`;
        }
        newContent += `\n`;
      }
      newContent += `\n---\n\n`;
    }

    const exists = await this.plugin.app.vault.adapter.exists(filePath);
    if (exists) {
      const existing = await this.plugin.app.vault.adapter.read(filePath);
      await this.plugin.app.vault.adapter.write(filePath, existing + newContent);
    } else {
      const header = `# 题库\n\n> 自动生成的复习题库 | 来源: ${new Date().toLocaleDateString("zh-CN")}\n\n---\n`;
      await this.plugin.app.vault.create(filePath, header + newContent);
    }
  }

  /** 获取随机题目 */
  getRandom(count: number): QuestionItem[] {
    const available = this.items.filter((q) => !this.shownIds.has(q.id));
    if (available.length === 0) {
      this.shownIds.clear();
      return this.getRandom(count);
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    for (const item of selected) {
      this.shownIds.add(item.id);
    }

    return selected;
  }

  markShown(id: string): void {
    this.shownIds.add(id);
  }

  resetProgress(): void {
    this.shownIds.clear();
  }

  getTotalCount(): number {
    return this.items.length;
  }

  getRemainingCount(): number {
    return this.items.length - this.shownIds.size;
  }

  getStatsByFile(): Map<string, number> {
    const stats = new Map<string, number>();
    for (const item of this.items) {
      stats.set(item.sourceFile, (stats.get(item.sourceFile) || 0) + 1);
    }
    return stats;
  }

  private async saveToDisk(items: QuestionItem[]): Promise<void> {
    const data = JSON.stringify({ items, updatedAt: Date.now() }, null, 2);
    const path = ".obsidian/plugins/random-quiz/data.json";
    const exists = await this.plugin.app.vault.adapter.exists(path);
    if (exists) {
      await this.plugin.app.vault.adapter.write(path, data);
    } else {
      await this.plugin.app.vault.create(path, data);
    }
  }

  async loadFromDisk(): Promise<boolean> {
    const path = ".obsidian/plugins/random-quiz/data.json";
    const exists = await this.plugin.app.vault.adapter.exists(path);
    if (!exists) return false;

    try {
      const raw = await this.plugin.app.vault.adapter.read(path);
      const data = JSON.parse(raw);
      if (data.items && Array.isArray(data.items)) {
        this.items = data.items;
        return true;
      }
    } catch (e) {
      console.warn("[RandomQuiz] 题库加载失败:", e);
    }
    return false;
  }
}
