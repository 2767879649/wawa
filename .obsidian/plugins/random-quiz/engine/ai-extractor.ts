import { Notice } from "obsidian";
import { RandomQuizSettings, QuestionItem } from "../settings";

/** 检查答案是否包含选择题选项 */
function hasChoiceOptions(answer: string): boolean {
  const lines = answer.split("\n");
  const optionCount = lines.filter((l) => /^[A-D]([).、．]\s*|\s+)/.test(l.trim())).length;
  return optionCount >= 2;
}

/**
 * 调用 LLM API 从选中文本生成 Q&A 对
 */
export async function generateQuestionsFromText(
  text: string,
  sourceFile: string,
  settings: RandomQuizSettings
): Promise<QuestionItem[]> {
  if (!settings.aiApiKey) {
    new Notice("请先在插件设置中配置 AI API Key");
    return [];
  }

  if (text.trim().length < 20) {
    new Notice("选中文本太短，请至少选中一段完整的知识内容");
    return [];
  }

  const prompt = `你是一个备考题目生成器。请从以下学习笔记中提取或生成复习题目（Q&A 格式）。

要求：
1. 识别文中的关键知识点
2. 为每个知识点生成一个问题和对应的答案
3. 问题应该考察理解和记忆，不要过于简单
4. 答案应准确、简洁
5. 如果是选择题，答案中必须包含全部选项（A. B. C. D.），并用 **[✓]** 标记正确答案
6. 输出 JSON 数组格式：[{"question": "...", "answer": "..."}]

学习笔记内容：
---
${text}
---

只输出 JSON 数组，不要输出其他内容。`;

  return await callLLM(settings, prompt);
}

/**
 * 规范化 Q&A 对格式
 */
export async function normalizeQAPairs(
  items: QuestionItem[],
  settings: RandomQuizSettings
): Promise<QuestionItem[]> {
  if (!settings.aiApiKey || items.length === 0) return items;

  // 分离选择题和非选择题：选择题跳过 AI 规范化，防止选项被丢失
  const choiceIndices: number[] = [];
  const nonChoiceItems: QuestionItem[] = [];
  for (let i = 0; i < items.length; i++) {
    if (hasChoiceOptions(items[i].answer)) {
      choiceIndices.push(i);
    } else {
      nonChoiceItems.push(items[i]);
    }
  }

  if (nonChoiceItems.length === 0) return items;

  const itemsJson = JSON.stringify(
    nonChoiceItems.map((i) => ({ question: i.question, answer: i.answer }))
  );

  const prompt = `请将以下题目和答案整理为统一格式。

规范化要求：
1. 题目：改为完整的问句形式（如"Git init" → "git init 命令的作用是什么？"）
2. 答案：保持原意但格式清晰，中文使用全角标点，英文使用半角标点
3. 去除噪声和无意义的空白
4. 如果原始答案不完整，尽量根据上下文补全
5. 输出 JSON 数组格式：输出格式与输入格式相同

原始题目列表：
${itemsJson}

只输出规范化后的 JSON 数组，不要输出其他内容。`;

  const result = await callLLM(settings, prompt);
  if (result.length === 0) return items;

  // 将 AI 结果合并回非选择题
  for (let i = 0; i < Math.min(nonChoiceItems.length, result.length); i++) {
    if (result[i].question) nonChoiceItems[i].question = result[i].question;
    if (result[i].answer) nonChoiceItems[i].answer = result[i].answer;
  }

  // 按原始顺序重建完整数组：选择题保持原样
  const merged: QuestionItem[] = [];
  let nonChoiceIdx = 0;
  for (let i = 0; i < items.length; i++) {
    if (choiceIndices.includes(i)) {
      merged.push(items[i]);
    } else {
      merged.push(nonChoiceItems[nonChoiceIdx++]);
    }
  }

  return merged;
}

/**
 * 根据题目和参考上下文，用 AI 生成答案
 */
export async function searchAndAnswer(
  question: string,
  originalAnswer: string,
  contexts: { file: string; content: string }[],
  settings: RandomQuizSettings
): Promise<{ answer: string; relatedFiles: string[] } | null> {
  if (!settings.aiApiKey) return null;

  const contextText = contexts
    .map((c) => `【来源：${c.file}】\n${c.content.substring(0, 1500)}`)
    .join("\n\n---\n\n");

  const prompt = `你是学习助手，根据参考资料生成准确答案。

题目：${question}

参考资料（按相关度排序）：
${contextText || "（无额外参考资料）"}

要求：
1. 严格基于参考资料回答，不要编造信息
2. 如果参考资料充分，直接引用或概括原文
3. 如果参考资料不充分，回答"参考资料中未找到相关内容"并尝试简要回答
4. 答案简洁、准确，不超过200字
5. 只输出答案文本`;

  try {
    const response = await fetch(settings.aiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.aiApiKey}`,
      },
      body: JSON.stringify({
        model: settings.aiModel,
        messages: [
          { role: "system", content: "你是学习助手，严格基于参考资料生成准确答案，不编造信息。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      console.error("[RandomQuiz] AI API error:", await response.text());
      return null;
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "";
    const relatedFiles = [...new Set(contexts.map((c) => c.file))];

    return { answer: answer.trim(), relatedFiles };
  } catch (e) {
    console.error("[RandomQuiz] searchAndAnswer error:", e);
    return null;
  }
}

/** 从 AI 返回的 answer 字符串中解析选择题选项 */
function tryParseOptions(answer: string): { options: string[]; correctIndex: number } | null {
  const lines = answer.split("\n");
  const optionLines: { label: string; text: string; isCorrect: boolean }[] = [];

  for (const line of lines) {
    const match = line.trim().match(/^([A-D])([).、．]\s*|\s+)(.+)/);
    if (match) {
      const text = match[3].trim();
      const isCorrect = /\*\*\[✓\]\*\*/.test(text);
      optionLines.push({
        label: match[1],
        text: text.replace(/\*\*\[✓\]\*\*/, "").trim(),
        isCorrect,
      });
    }
  }

  if (optionLines.length < 2) return null;

  const correctIdx = optionLines.findIndex((o) => o.isCorrect);
  return {
    options: optionLines.map((o) => o.text),
    correctIndex: correctIdx >= 0 ? correctIdx : 0,
  };
}

/** 通用 LLM 调用，返回 JSON 数组 */
async function callLLM(
  settings: RandomQuizSettings,
  prompt: string
): Promise<QuestionItem[]> {
  try {
    const response = await fetch(settings.aiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.aiApiKey}`,
      },
      body: JSON.stringify({
        model: settings.aiModel,
        messages: [
          { role: "system", content: "你是一个专业的备考题目处理器，只输出 JSON 格式。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[RandomQuiz] AI API error:", errText);
      new Notice(`AI API 调用失败: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      new Notice("AI 返回内容格式异常，请重试");
      return [];
    }

    const pairs = JSON.parse(jsonMatch[0]);
    return pairs.map((pair: any, idx: number) => {
      const answer: string = pair.answer || "";
      const parsed = tryParseOptions(answer);
      const item: QuestionItem = {
        id: `ai::${Date.now()}::${idx}`,
        question: pair.question || "",
        answer,
        sourceFile: "",
        sectionIndex: -1,
        createdAt: Date.now(),
        answerSource: "ai-generated" as const,
      };
      if (parsed) {
        item.options = parsed.options;
        item.correctIndex = parsed.correctIndex;
      }
      return item;
    });
  } catch (e) {
    console.error("[RandomQuiz] AI call error:", e);
    new Notice("AI 调用出错，请检查网络和 API 配置");
    return [];
  }
}
