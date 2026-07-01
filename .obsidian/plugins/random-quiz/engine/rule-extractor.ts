import { QuestionItem } from "../settings";

/**
 * 从 Markdown 文本中提取 Q&A 对
 * 规则优先级：标题 > 列表项 > 加粗文本 > 问句 > 定义型 > 分隔符 > 段落切分
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

  // 按空行和分隔符拆分为段落块
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
        sections.push({ heading: currentHeading, headingLevel: currentLevel, body: [...currentBody] });
      }
      currentHeading = headingMatch[2].trim();
      currentLevel = headingMatch[1].length;
      currentBody = [];
    } else if (line.trim() === "---" || line.trim() === "") {
      // 分隔符或空行作为节边界
      if (currentBody.length > 0 || currentHeading) {
        sections.push({ heading: currentHeading, headingLevel: currentLevel, body: [...currentBody] });
      }
      if (line.trim() === "---") {
        currentHeading = "";
        currentLevel = 0;
      }
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  if (currentBody.length > 0 || currentHeading) {
    sections.push({ heading: currentHeading, headingLevel: currentLevel, body: currentBody });
  }

  return sections;
}

function extractFromSection(
  section: Section,
  sourceFile: string,
  sectionIndex: number
): QuestionItem[] {
  const questions: QuestionItem[] = [];

  if (section.heading) {
    const listItems = extractListItems(section.body);
    const boldItems = extractBoldSegments(section.body);
    const rawOptionItems = extractRawOptionLines(section.body);

    // 选择题优先检测
    const allOptionItems = listItems.length > 0 ? listItems : rawOptionItems;
    if (isMultipleChoice(allOptionItems)) {
      const question = generateQuestionFromHeading(section.heading);
      const answer = formatMultipleChoiceAnswer(allOptionItems);
      questions.push(createItem(question, answer, sourceFile, sectionIndex, "extracted"));
    } else if (listItems.length > 0) {
      const question = generateQuestionFromHeading(section.heading);
      const answer = listItems.join("\n");
      if (answer.trim()) {
        questions.push(createItem(question, answer, sourceFile, sectionIndex, "extracted"));
      }
    } else if (boldItems.length > 0) {
      const question = generateQuestionFromHeading(section.heading);
      const answer = boldItems.join("\n");
      if (answer.trim()) {
        questions.push(createItem(question, answer, sourceFile, sectionIndex, "extracted"));
      }
    } else {
      const bodyText = cleanBody(section.body);
      // 检查正文中是否嵌入了选择题选项
      const inlineMc = extractInlineMultipleChoice(section.body);
      if (inlineMc) {
        const question = generateQuestionFromHeading(section.heading);
        questions.push(createItem(question, inlineMc, sourceFile, sectionIndex, "extracted"));
      } else if (bodyText.trim().length > 10) {
        const question = generateQuestionFromHeading(section.heading);
        questions.push(createItem(question, bodyText, sourceFile, sectionIndex, "extracted"));
      }
    }
    return questions;
  }

  // 无标题节
  const listItems = extractListItems(section.body);
  const boldItems = extractBoldSegments(section.body);
  const rawOptionItems = extractRawOptionLines(section.body);

  // 检查列表项或原始选项行是否为选择题格式
  const allOptionItems = listItems.length > 0 ? listItems : rawOptionItems;
  if (isMultipleChoice(allOptionItems)) {
    const question = generateQuestionFromHeading(section.heading || extractContextBeforeOptions(section.body, allOptionItems[0]));
    const answer = formatMultipleChoiceAnswer(allOptionItems);
    questions.push(createItem(question, answer, sourceFile, sectionIndex, "extracted"));
    return questions;
  }

  // 检查正文内嵌选择题
  const inlineMc = extractInlineMultipleChoice(section.body);
  if (inlineMc) {
    const question = generateQuestionFromHeading(section.heading || "以下题目");
    questions.push(createItem(question, inlineMc, sourceFile, sectionIndex, "extracted"));
    return questions;
  }

  for (const item of listItems) {
    const parts = splitListItem(item);
    if (parts.question && parts.answer) {
      questions.push(createItem(parts.question, parts.answer, sourceFile, sectionIndex, "extracted"));
    }
  }

  for (const item of boldItems) {
    const parts = splitBoldItem(item);
    if (parts.question && parts.answer) {
      questions.push(createItem(parts.question, parts.answer, sourceFile, sectionIndex, "extracted"));
    }
  }

  // 新增：识别问句
  if (questions.length === 0) {
    const qaFromQuestion = extractQuestionSentences(section.body);
    if (qaFromQuestion) {
      questions.push(createItem(qaFromQuestion.question, qaFromQuestion.answer, sourceFile, sectionIndex, "extracted"));
    }
  }

  // 新增：识别定义型段落
  if (questions.length === 0) {
    const qaFromDef = extractDefinitionPattern(section.body);
    if (qaFromDef) {
      questions.push(createItem(qaFromDef.question, qaFromDef.answer, sourceFile, sectionIndex, "extracted"));
    }
  }

  // 兜底：段落切分
  if (questions.length === 0) {
    const bodyText = cleanBody(section.body);
    if (bodyText.trim().length > 20) {
      const sentences = bodyText.split(/[。.!！?\n]+/).filter((s) => s.trim().length > 5);
      if (sentences.length >= 2) {
        const question = sentences[0].trim();
        const answer = sentences.slice(1).join("。").trim();
        if (question && answer) {
          questions.push(createItem(question, answer, sourceFile, sectionIndex, "extracted"));
        }
      }
    }
  }

  return questions;
}

/** 提取列表项 */
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

/** 新增：提取问句（以 ? ？结尾的句子） */
function extractQuestionSentences(body: string[]): { question: string; answer: string } | null {
  const fullText = body.join(" ");
  // 匹配以 ？或 ? 结尾的句子，后面跟的内容作为答案
  const match = fullText.match(/([^。！？?!\n]{5,80}[？?])\s*(.*)/);
  if (match) {
    const question = match[1].trim();
    const answer = match[2].trim();
    if (answer.length > 0) {
      return { question, answer };
    }
    // 如果答案太短，整个作为题目，body其余部分为答案
    const qIdx = fullText.indexOf(match[1]);
    const beforeQ = fullText.substring(0, qIdx).trim();
    const afterQ = fullText.substring(qIdx + match[1].length).trim();
    if (afterQ.length > 5) {
      return { question, answer: afterQ };
    }
    return { question, answer: "请参考原文" };
  }

  // 匹配 "X 吗？" "X 呢？" 结尾
  const altMatch = fullText.match(/([^。！？?!\n]{5,80}[吗呢][？?])\s*(.*)/);
  if (altMatch) {
    const question = altMatch[1].trim();
    const answer = altMatch[2].trim() || "请参考原文";
    return { question, answer };
  }

  return null;
}

/** 新增：提取定义型段落（X是Y, X指Y, X称为Y） */
function extractDefinitionPattern(body: string[]): { question: string; answer: string } | null {
  const fullText = body.join("");
  const patterns = [
    /(.{2,40})(?:是|是指|指的是|即|称为|叫做|定义为)\s*(.{2,200})/,
    /(.{2,40})(?:指|就是指)\s*(.{2,200})/,
  ];

  for (const pattern of patterns) {
    const match = fullText.match(pattern);
    if (match) {
      const term = match[1].trim();
      const def = match[2].trim();
      return { question: `什么是${term}？`, answer: `${term}是${def}` };
    }
  }

  return null;
}

/** 分割列表项为题面和答案 */
function splitListItem(item: string): { question: string; answer: string } {
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
  if (item.length > 5) {
    // 如果是选项格式，生成选择题题面
    if (/^[A-D]([).、．]\s*|\s+)/.test(item)) {
      return { question: "以下哪个选项是正确的？", answer: item };
    }
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

/** 从原始行中提取以 A-D 开头的选项行（不依赖列表标记） */
function extractRawOptionLines(body: string[]): string[] {
  return body
    .map((line) => line.trim())
    .filter((line) => /^[A-D]([).、．]\s*|\s+)/.test(line));
}

/** 从选项中提取题干上下文（选项之前的问句行） */
function extractContextBeforeOptions(body: string[], firstOption: string): string {
  const optIdx = body.findIndex((line) => line.trim() === firstOption);
  if (optIdx > 0) {
    const prevLine = body[optIdx - 1].trim();
    if (prevLine && !/^[A-D]([).、．]\s*|\s+)/.test(prevLine)) {
      return prevLine;
    }
  }
  return "以下题目";
}

/** 判断列表项是否为选择题选项（A. B. C. D. 格式） */
function isMultipleChoice(items: string[]): boolean {
  if (items.length < 2) return false;
  const optionPattern = /^[A-D]([).、．]\s*|\s+)/;
  const matchCount = items.filter((item) => optionPattern.test(item)).length;
  return matchCount >= 2 && matchCount >= items.length * 0.5;
}

/** 格式化选择题答案：保留全部选项，首个匹配的为正确答案 */
function formatMultipleChoiceAnswer(items: string[]): string {
  const options = items.map((item) => {
    const cleaned = item.replace(/^[A-D]([).、．]\s*|\s+)/, "").trim();
    const label = item.match(/^([A-D])/)?.[1] || "";
    return { label, text: cleaned };
  });

  // 假设第一个选项为正确答案（常见模式，或按约定标记 * 或 ✓ 识别）
  const correctIdx = options.findIndex((o) =>
    /\*$|✓$|（正确）|（答案）/.test(o.text)
  );
  const answerLabel = correctIdx >= 0 ? options[correctIdx].label : options[0]?.label || "?";

  const lines = ["答案：全部选项如下"];
  for (const opt of options) {
    const marker = opt.label === answerLabel ? " **[✓]**" : "";
    lines.push(`${opt.label}. ${opt.text}${marker}`);
  }
  return lines.join("\n");
}

/** 从正文中提取内嵌选择题选项（如 "A.xxx B.xxx C.xxx"） */
function extractInlineMultipleChoice(body: string[]): string | null {
  const fullText = body.join(" ");
  // 匹配 A.xxx B.xxx C.xxx D.xxx 内联格式
  const match = fullText.match(/([A-D]([).、．]\s*|\s+)[^\s]+(?:\s+[A-D]([).、．]\s*|\s+)[^\s]+){1,})/);
  if (match) {
    const options = match[1].split(/\s+(?=[A-D]([).、．]\s*|\s+))/);
    const formatted = options.map((opt) => opt.trim()).join("\n");
    return "答案：全部选项如下\n" + formatted;
  }
  return null;
}

/** 公开的基础清理函数，供 AI 模块调用 */
export function cleanQuestionText(text: string): string {
  return text
    .replace(/^[\d.、\s]+/, "")
    .replace(/[#*>`_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function createItem(
  question: string,
  answer: string,
  sourceFile: string,
  sectionIndex: number,
  answerSource: "extracted" | "ai-generated"
): QuestionItem {
  return {
    id: `${sourceFile}::${sectionIndex}::${Date.now()}`,
    question: cleanQuestionText(question),
    answer: answer.trim(),
    sourceFile,
    sectionIndex,
    createdAt: Date.now(),
    answerSource,
  };
}
