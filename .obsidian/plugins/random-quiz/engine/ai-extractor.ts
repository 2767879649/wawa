import { Notice } from "obsidian";
import { RandomQuizSettings, QuestionItem } from "../settings";

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
5. 输出 JSON 数组格式：[{"question": "...", "answer": "..."}]

学习笔记内容：
---
${text}
---

只输出 JSON 数组，不要输出其他内容。`;

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
          { role: "system", content: "你是一个专业的备考题目生成器，只输出 JSON 格式。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
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
    const items: QuestionItem[] = pairs.map((pair: any, idx: number) => ({
      id: `${sourceFile}::ai::${Date.now()}::${idx}`,
      question: pair.question,
      answer: pair.answer,
      sourceFile: sourceFile,
      sectionIndex: -1,
      createdAt: Date.now(),
    }));

    new Notice(`AI 生成了 ${items.length} 道题目`);
    return items;
  } catch (e) {
    console.error("[RandomQuiz] AI extraction error:", e);
    new Notice("AI 调用出错，请检查网络和 API 配置");
    return [];
  }
}
