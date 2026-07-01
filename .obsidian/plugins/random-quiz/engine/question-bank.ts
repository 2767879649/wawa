import { Plugin, TFile } from "obsidian";
import { QuestionItem, RandomQuizSettings } from "../settings";
import { extractQuestions } from "./rule-extractor";

export class QuestionBank {
  private plugin: Plugin;
  private items: QuestionItem[] = [];
  private shownIds: Set<string> = new Set();
  private fileTimestamps: Map<string, number> = new Map();

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  /** 扫描指定文件夹，提取所有题目 */
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

    await this.scanRecursive(folder, excludeList, newItems);

    this.items = newItems;
    await this.saveToDisk(newItems);
    return newItems.length;
  }

  private async scanRecursive(
    entry: any,
    excludeList: string[],
    result: QuestionItem[]
  ): Promise<void> {
    if (entry.children) {
      for (const child of entry.children) {
        await this.scanRecursive(child, excludeList, result);
      }
      return;
    }

    if (!(entry instanceof TFile)) return;
    if (!entry.extension.toLowerCase().endsWith("md")) return;

    const name = entry.name;
    if (excludeList.some((p) => name.includes(p))) return;

    const content = await this.plugin.app.vault.read(entry);
    const mtime = entry.stat.mtime;
    this.fileTimestamps.set(entry.path, mtime);

    const extracted = extractQuestions(content, entry.path);
    result.push(...extracted);
  }

  /** 获取随机题目 */
  getRandom(count: number): QuestionItem[] {
    const available = this.items.filter((q) => !this.shownIds.has(q.id));
    if (available.length === 0) {
      // 全部轮完，重置
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

  /** 标记为已显示 */
  markShown(id: string): void {
    this.shownIds.add(id);
  }

  /** 重置会话进度 */
  resetProgress(): void {
    this.shownIds.clear();
  }

  /** 获取题库总量 */
  getTotalCount(): number {
    return this.items.length;
  }

  /** 获取剩余未显示数量 */
  getRemainingCount(): number {
    return this.items.length - this.shownIds.size;
  }

  /** 按文件获取题目数 */
  getStatsByFile(): Map<string, number> {
    const stats = new Map<string, number>();
    for (const item of this.items) {
      stats.set(item.sourceFile, (stats.get(item.sourceFile) || 0) + 1);
    }
    return stats;
  }

  /** 保存题库到磁盘 */
  private async saveToDisk(items: QuestionItem[]): Promise<void> {
    const data = JSON.stringify(
      { items, updatedAt: Date.now() },
      null,
      2
    );
    const path = this.getDataPath();
    const exists = await this.plugin.app.vault.adapter.exists(path);
    if (exists) {
      await this.plugin.app.vault.adapter.write(path, data);
    } else {
      await this.plugin.app.vault.create(path, data);
    }
  }

  /** 从磁盘加载题库 */
  async loadFromDisk(): Promise<boolean> {
    const path = this.getDataPath();
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

  private getDataPath(): string {
    return ".obsidian/plugins/random-quiz/data.json";
  }
}
