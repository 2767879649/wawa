import { QuestionItem } from "../settings";

/**
 * 从 Markdown 文本中提取 Q&A 对
 * 规则优先级：标题 > 列表项 > 加粗文本 > 分隔符 > 段落切分
 */
export function extractQuestions(
  content: string,
  sourceFile: string
): QuestionItem[] {
  const questions: QuestionItem[] = [];
  const lines = content.split("\n");

  // 移除 YAML frontmatter
  let startIdx = 0;
  if (lines[0]?.trim() === "---") {
    const end = lines.indexOf("---", 1);
    if (end !== -1) startIdx = end + 1;
  }

  // 按分隔符拆分为节
  const sections = splitSections(lines, startIdx);

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    const extracted = extractFromSection(section, sourceFile, si);
    questions.push(...extracted);
  }

  return questions;
}

interface Section {
  heading: string;
  headingLevel: number;
  body: string[];
}

function splitSections(lines: string[], startIdx: number): Section[] {
  const sections: Section[] = [];
  let currentHeading = "";
  let currentLevel = 0;
  let currentBody: string[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);

    if (headingMatch) {
      if (currentBody.length > 0 || currentHeading) {
        sections.push({
          heading: currentHeading,
          headingLevel: currentLevel,
          body: currentBody,
        });
      }
      currentHeading = headingMatch[2].trim();
      currentLevel = headingMatch[1].length;
      currentBody = [];
    } else if (line.trim() === "---") {
      // 分隔符作为节边界
      if (currentBody.length > 0 || currentHeading) {
        sections.push({
          heading: currentHeading,
          headingLevel: currentLevel,
          body: currentBody,
        });
      }
      currentHeading = "";
      currentLevel = 0;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  // 最后一节
  if (currentBody.length > 0 || currentHeading) {
    sections.push({
      heading: currentHeading,
      headingLevel: currentLevel,
      body: currentBody,
    });
  }

  return sections;
}

function extractFromSection(
  section: Section,
  sourceFile: string,
  sectionIndex: number
): QuestionItem[] {
  const questions: QuestionItem[] = [];

  // 规则1: 从标题生成题面
  if (section.heading) {
    const listItems = extractListItems(section.body);
    const boldItems = extractBoldSegments(section.body);

    if (listItems.length > 0) {
      // 标题为题面，列表项为答案内容
      const question = generateQuestionFromHeading(section.heading);
      const answer = listItems.join("\n");
      if (answer.trim()) {
        questions.push(createItem(question, answer, sourceFile, sectionIndex));
      }
    } else if (boldItems.length > 0) {
      const question = generateQuestionFromHeading(section.heading);
      const answer = boldItems.join("\n");
      if (answer.trim()) {
        questions.push(createItem(question, answer, sourceFile, sectionIndex));
      }
    } else {
      const bodyText = cleanBody(section.body);
      if (bodyText.trim().length > 10) {
        const question = generateQuestionFromHeading(section.heading);
        questions.push(
          createItem(question, bodyText, sourceFile, sectionIndex)
        );
      }
    }
    return questions;
  }

  // 无标题节：检查列表项和加粗内容
  const listItems = extractListItems(section.body);
  const boldItems = extractBoldSegments(section.body);

  // 规则2: 列表项独立拆分
  for (const item of listItems) {
    const parts = splitListItem(item);
    if (parts.question && parts.answer) {
      questions.push(
        createItem(parts.question, parts.answer, sourceFile, sectionIndex)
      );
    }
  }

  // 规则3: 加粗文本识别
  for (const item of boldItems) {
    const parts = splitBoldItem(item);
    if (parts.question && parts.answer) {
      questions.push(
        createItem(parts.question, parts.answer, sourceFile, sectionIndex)
      );
    }
  }

  // 规则5: 兜底 — 段落切分
  if (questions.length === 0 && listItems.length === 0 && boldItems.length === 0) {
    const bodyText = cleanBody(section.body);
    if (bodyText.trim().length > 20) {
      const sentences = bodyText.split(/[。.!！?\n]+/).filter((s) => s.trim().length > 5);
      if (sentences.length >= 2) {
        const question = sentences[0].trim();
        const answer = sentences.slice(1).join("。").trim();
        if (question && answer) {
          questions.push(createItem(question, answer, sourceFile, sectionIndex));
        }
      }
    }
  }

  return questions;
}

/** 提取列表项（有序/无序） */
function extractListItems(body: string[]): string[] {
  return body
    .filter((line) => /^\s*[-*\d]+[.)]\s+/.test(line) || /^\s*\d+[、．]\s*/.test(line))
    .map((line) => line.replace(/^\s*[-*\d]+[.)]\s+/, "").replace(/^\s*\d+[、．]\s*/, "").trim())
    .filter((s) => s.length > 0);
}

/** 提取加粗文本片段 */
function extractBoldSegments(body: string[]): string[] {
  const segments: string[] = [];
  for (const line of body) {
    const matches = line.match(/\*\*(.+?)\*\*/g);
    if (matches) {
      for (const m of matches) {
        const text = m.replace(/\*\*/g, "").trim();
        if (text.length > 1) segments.push(line.trim());
      }
    }
  }
  return segments;
}

/** 分割列表项为题面和答案 */
function splitListItem(item: string): { question: string; answer: string } {
  // 匹配各种分隔符：——, --, :, ：, =
  const separators = ["——", "--", "：", ":", "==", "→"];
  for (const sep of separators) {
    const idx = item.indexOf(sep);
    if (idx > 0) {
      const q = item.substring(0, idx).trim();
      const a = item.substring(idx + sep.length).trim();
      if (q.length > 0 && a.length > 0) {
        return { question: q, answer: a };
      }
    }
  }
  // 无法分割，整行作为答案，生成题面
  if (item.length > 5) {
    return { question: "", answer: item };
  }
  return { question: "", answer: "" };
}

/** 分割加粗项 */
function splitBoldItem(line: string): { question: string; answer: string } {
  const boldMatch = line.match(/\*\*(.+?)\*\*/);
  if (!boldMatch) return { question: "", answer: "" };

  const boldText = boldMatch[1].trim();
  const remaining = line.replace(/\*\*(.+?)\*\*/g, "").trim();

  if (remaining.length > 0) {
    return { question: boldText, answer: remaining };
  }
  return { question: "", answer: boldText };
}

/** 根据标题生成自然问句 */
function generateQuestionFromHeading(heading: string): string {
  const clean = heading.replace(/^[\d.、\s]+/, "").trim();
  if (clean.endsWith("？") || clean.endsWith("?")) return clean;
  if (clean.length < 3) return `请解释：${clean}`;
  return `请简述 ${clean}`;
}

/** 清理正文 */
function cleanBody(body: string[]): string {
  return body
    .filter((line) => !line.startsWith("!") && line.trim().length > 0)
    .join("\n")
    .replace(/[#*>]/g, "")
    .trim();
}

function createItem(
  question: string,
  answer: string,
  sourceFile: string,
  sectionIndex: number
): QuestionItem {
  return {
    id: `${sourceFile}::${sectionIndex}::${Date.now()}`,
    question,
    answer,
    sourceFile,
    sectionIndex,
    createdAt: Date.now(),
  };
}
