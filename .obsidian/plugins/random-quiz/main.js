var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => RandomQuizPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian6 = require("obsidian");

// settings.ts
var DEFAULT_SETTINGS = {
  targetFolder: "learning\u5B66\u4E60/\u5907\u8003/",
  excludePatterns: "",
  aiApiKey: "",
  aiEndpoint: "https://api.deepseek.com/v1/chat/completions",
  aiModel: "deepseek-chat",
  questionsPerRound: 1,
  aiAutoSearch: true,
  aiSearchScope: "folder",
  aiDetectQuestions: true,
  normalizeFormat: true,
  outputFile: "learning\u5B66\u4E60/\u5907\u8003/\u9898\u5E93.md"
};

// engine/question-bank.ts
var import_obsidian2 = require("obsidian");

// engine/rule-extractor.ts
function extractQuestions(content, sourceFile) {
  const questions = [];
  const lines = content.split("\n");
  let startIdx = 0;
  if (lines[0]?.trim() === "---") {
    const end = lines.indexOf("---", 1);
    if (end !== -1)
      startIdx = end + 1;
  }
  const sections = splitSections(lines, startIdx);
  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    const extracted = extractFromSection(section, sourceFile, si);
    questions.push(...extracted);
  }
  return questions;
}
function splitSections(lines, startIdx) {
  const sections = [];
  let currentHeading = "";
  let currentLevel = 0;
  let currentBody = [];
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
function extractFromSection(section, sourceFile, sectionIndex) {
  const questions = [];
  if (section.heading) {
    const listItems2 = extractListItems(section.body);
    const boldItems2 = extractBoldSegments(section.body);
    const rawOptionItems2 = extractRawOptionLines(section.body);
    const allOptionItems2 = listItems2.length > 0 ? listItems2 : rawOptionItems2;
    if (isMultipleChoice(allOptionItems2)) {
      const question = generateQuestionFromHeading(section.heading);
      const mc = formatMultipleChoiceAnswer(allOptionItems2);
      questions.push(createItem(question, mc.formatted, sourceFile, sectionIndex, "extracted", mc.options, mc.correctIndex));
    } else if (listItems2.length > 0) {
      const question = generateQuestionFromHeading(section.heading);
      const answer = listItems2.join("\n");
      if (answer.trim()) {
        questions.push(createItem(question, answer, sourceFile, sectionIndex, "extracted"));
      }
    } else if (boldItems2.length > 0) {
      const question = generateQuestionFromHeading(section.heading);
      const answer = boldItems2.join("\n");
      if (answer.trim()) {
        questions.push(createItem(question, answer, sourceFile, sectionIndex, "extracted"));
      }
    } else {
      const bodyText = cleanBody(section.body);
      const inlineMc2 = extractInlineMultipleChoice(section.body);
      if (inlineMc2) {
        const question = generateQuestionFromHeading(section.heading);
        questions.push(createItem(question, inlineMc2.formatted, sourceFile, sectionIndex, "extracted", inlineMc2.options, inlineMc2.correctIndex));
      } else if (bodyText.trim().length > 10) {
        const question = generateQuestionFromHeading(section.heading);
        questions.push(createItem(question, bodyText, sourceFile, sectionIndex, "extracted"));
      }
    }
    return questions;
  }
  const listItems = extractListItems(section.body);
  const boldItems = extractBoldSegments(section.body);
  const rawOptionItems = extractRawOptionLines(section.body);
  const allOptionItems = listItems.length > 0 ? listItems : rawOptionItems;
  if (isMultipleChoice(allOptionItems)) {
    const question = generateQuestionFromHeading(section.heading || extractContextBeforeOptions(section.body, allOptionItems[0]));
    const mc = formatMultipleChoiceAnswer(allOptionItems);
    questions.push(createItem(question, mc.formatted, sourceFile, sectionIndex, "extracted", mc.options, mc.correctIndex));
    return questions;
  }
  const inlineMc = extractInlineMultipleChoice(section.body);
  if (inlineMc) {
    const question = generateQuestionFromHeading(section.heading || "\u4EE5\u4E0B\u9898\u76EE");
    questions.push(createItem(question, inlineMc.formatted, sourceFile, sectionIndex, "extracted", inlineMc.options, inlineMc.correctIndex));
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
  if (questions.length === 0) {
    const qaFromQuestion = extractQuestionSentences(section.body);
    if (qaFromQuestion) {
      questions.push(createItem(qaFromQuestion.question, qaFromQuestion.answer, sourceFile, sectionIndex, "extracted"));
    }
  }
  if (questions.length === 0) {
    const qaFromDef = extractDefinitionPattern(section.body);
    if (qaFromDef) {
      questions.push(createItem(qaFromDef.question, qaFromDef.answer, sourceFile, sectionIndex, "extracted"));
    }
  }
  if (questions.length === 0) {
    const bodyText = cleanBody(section.body);
    if (bodyText.trim().length > 20) {
      const sentences = bodyText.split(/[。.!！?\n]+/).filter((s) => s.trim().length > 5);
      if (sentences.length >= 2) {
        const question = sentences[0].trim();
        const answer = sentences.slice(1).join("\u3002").trim();
        if (question && answer) {
          questions.push(createItem(question, answer, sourceFile, sectionIndex, "extracted"));
        }
      }
    }
  }
  return questions;
}
function extractListItems(body) {
  return body.filter((line) => /^\s*[-*\d]+[.)]\s+/.test(line) || /^\s*\d+[、．]\s*/.test(line)).map((line) => line.replace(/^\s*[-*\d]+[.)]\s+/, "").replace(/^\s*\d+[、．]\s*/, "").trim()).filter((s) => s.length > 0);
}
function extractBoldSegments(body) {
  const segments = [];
  for (const line of body) {
    const matches = line.match(/\*\*(.+?)\*\*/g);
    if (matches) {
      for (const m of matches) {
        const text = m.replace(/\*\*/g, "").trim();
        if (text.length > 1)
          segments.push(line.trim());
      }
    }
  }
  return segments;
}
function extractQuestionSentences(body) {
  const fullText = body.join(" ");
  const match = fullText.match(/([^。！？?!\n]{5,80}[？?])\s*(.*)/);
  if (match) {
    const question = match[1].trim();
    const answer = match[2].trim();
    if (answer.length > 0) {
      return { question, answer };
    }
    const qIdx = fullText.indexOf(match[1]);
    const beforeQ = fullText.substring(0, qIdx).trim();
    const afterQ = fullText.substring(qIdx + match[1].length).trim();
    if (afterQ.length > 5) {
      return { question, answer: afterQ };
    }
    return { question, answer: "\u8BF7\u53C2\u8003\u539F\u6587" };
  }
  const altMatch = fullText.match(/([^。！？?!\n]{5,80}[吗呢][？?])\s*(.*)/);
  if (altMatch) {
    const question = altMatch[1].trim();
    const answer = altMatch[2].trim() || "\u8BF7\u53C2\u8003\u539F\u6587";
    return { question, answer };
  }
  return null;
}
function extractDefinitionPattern(body) {
  const fullText = body.join("");
  const patterns = [
    /(.{2,40})(?:是|是指|指的是|即|称为|叫做|定义为)\s*(.{2,200})/,
    /(.{2,40})(?:指|就是指)\s*(.{2,200})/
  ];
  for (const pattern of patterns) {
    const match = fullText.match(pattern);
    if (match) {
      const term = match[1].trim();
      const def = match[2].trim();
      return { question: `\u4EC0\u4E48\u662F${term}\uFF1F`, answer: `${term}\u662F${def}` };
    }
  }
  return null;
}
function splitListItem(item) {
  const separators = ["\u2014\u2014", "--", "\uFF1A", ":", "==", "\u2192"];
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
    if (/^[A-D]([).、．]\s*|\s+)/.test(item)) {
      return { question: "\u4EE5\u4E0B\u54EA\u4E2A\u9009\u9879\u662F\u6B63\u786E\u7684\uFF1F", answer: item };
    }
    return { question: "", answer: item };
  }
  return { question: "", answer: "" };
}
function splitBoldItem(line) {
  const boldMatch = line.match(/\*\*(.+?)\*\*/);
  if (!boldMatch)
    return { question: "", answer: "" };
  const boldText = boldMatch[1].trim();
  const remaining = line.replace(/\*\*(.+?)\*\*/g, "").trim();
  if (remaining.length > 0) {
    return { question: boldText, answer: remaining };
  }
  return { question: "", answer: boldText };
}
function generateQuestionFromHeading(heading) {
  const clean = heading.replace(/^[\d.、\s]+/, "").trim();
  if (clean.endsWith("\uFF1F") || clean.endsWith("?"))
    return clean;
  if (clean.length < 3)
    return `\u8BF7\u89E3\u91CA\uFF1A${clean}`;
  return `\u8BF7\u7B80\u8FF0 ${clean}`;
}
function cleanBody(body) {
  return body.filter((line) => !line.startsWith("!") && line.trim().length > 0).join("\n").replace(/[#*>]/g, "").trim();
}
function extractRawOptionLines(body) {
  return body.map((line) => line.trim()).filter((line) => /^[A-D]([).、．]\s*|\s+)/.test(line));
}
function extractContextBeforeOptions(body, firstOption) {
  const optIdx = body.findIndex((line) => line.trim() === firstOption);
  if (optIdx > 0) {
    const prevLine = body[optIdx - 1].trim();
    if (prevLine && !/^[A-D]([).、．]\s*|\s+)/.test(prevLine)) {
      return prevLine;
    }
  }
  return "\u4EE5\u4E0B\u9898\u76EE";
}
function isMultipleChoice(items) {
  if (items.length < 2)
    return false;
  const optionPattern = /^[A-D]([).、．]\s*|\s+)/;
  const matchCount = items.filter((item) => optionPattern.test(item)).length;
  return matchCount >= 2 && matchCount >= items.length * 0.5;
}
function formatMultipleChoiceAnswer(items) {
  const options = items.map((item) => {
    const cleaned = item.replace(/^[A-D]([).、．]\s*|\s+)/, "").trim();
    const label = item.match(/^([A-D])/)?.[1] || "";
    return { label, text: cleaned };
  });
  const correctIdx = options.findIndex(
    (o) => /\*$|✓$|（正确）|（答案）/.test(o.text)
  );
  const correctIndex = correctIdx >= 0 ? correctIdx : 0;
  const cleanOptions = options.map((o) => o.text.replace(/[*✓]|\（正确）|\（答案）/g, "").trim());
  const lines = ["\u7B54\u6848\uFF1A\u5168\u90E8\u9009\u9879\u5982\u4E0B"];
  for (let i = 0; i < options.length; i++) {
    const marker = i === correctIndex ? " **[\u2713]**" : "";
    lines.push(`${options[i].label}. ${cleanOptions[i]}${marker}`);
  }
  return { formatted: lines.join("\n"), options: cleanOptions, correctIndex };
}
function extractInlineMultipleChoice(body) {
  const fullText = body.join(" ");
  const match = fullText.match(/([A-D]([).、．]\s*|\s+)[^\s]+(?:\s+[A-D]([).、．]\s*|\s+)[^\s]+){1,})/);
  if (match) {
    const rawOptions = match[1].split(/\s+(?=[A-D]([).、．]\s*|\s+))/);
    const options = rawOptions.map((opt) => opt.replace(/^[A-D]([).、．]\s*|\s+)/, "").trim());
    const formatted = "\u7B54\u6848\uFF1A\u5168\u90E8\u9009\u9879\u5982\u4E0B\n" + rawOptions.map((opt) => opt.trim()).join("\n");
    return { formatted, options, correctIndex: 0 };
  }
  return null;
}
function cleanQuestionText(text) {
  return text.replace(/^[\d.、\s]+/, "").replace(/[#*>`_~]/g, "").replace(/\s+/g, " ").trim();
}
function createItem(question, answer, sourceFile, sectionIndex, answerSource, options, correctIndex) {
  const item = {
    id: `${sourceFile}::${sectionIndex}::${Date.now()}`,
    question: cleanQuestionText(question),
    answer: answer.trim(),
    sourceFile,
    sectionIndex,
    createdAt: Date.now(),
    answerSource
  };
  if (options && options.length > 0) {
    item.options = options;
    item.correctIndex = correctIndex ?? 0;
  }
  return item;
}

// engine/ai-extractor.ts
var import_obsidian = require("obsidian");
function hasChoiceOptions(answer) {
  const lines = answer.split("\n");
  const optionCount = lines.filter((l) => /^[A-D]([).、．]\s*|\s+)/.test(l.trim())).length;
  return optionCount >= 2;
}
async function generateQuestionsFromText(text, sourceFile, settings) {
  if (!settings.aiApiKey) {
    new import_obsidian.Notice("\u8BF7\u5148\u5728\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u914D\u7F6E AI API Key");
    return [];
  }
  if (text.trim().length < 20) {
    new import_obsidian.Notice("\u9009\u4E2D\u6587\u672C\u592A\u77ED\uFF0C\u8BF7\u81F3\u5C11\u9009\u4E2D\u4E00\u6BB5\u5B8C\u6574\u7684\u77E5\u8BC6\u5185\u5BB9");
    return [];
  }
  const prompt = `\u4F60\u662F\u4E00\u4E2A\u5907\u8003\u9898\u76EE\u751F\u6210\u5668\u3002\u8BF7\u4ECE\u4EE5\u4E0B\u5B66\u4E60\u7B14\u8BB0\u4E2D\u63D0\u53D6\u6216\u751F\u6210\u590D\u4E60\u9898\u76EE\uFF08Q&A \u683C\u5F0F\uFF09\u3002

\u8981\u6C42\uFF1A
1. \u8BC6\u522B\u6587\u4E2D\u7684\u5173\u952E\u77E5\u8BC6\u70B9
2. \u4E3A\u6BCF\u4E2A\u77E5\u8BC6\u70B9\u751F\u6210\u4E00\u4E2A\u95EE\u9898\u548C\u5BF9\u5E94\u7684\u7B54\u6848
3. \u95EE\u9898\u5E94\u8BE5\u8003\u5BDF\u7406\u89E3\u548C\u8BB0\u5FC6\uFF0C\u4E0D\u8981\u8FC7\u4E8E\u7B80\u5355
4. \u7B54\u6848\u5E94\u51C6\u786E\u3001\u7B80\u6D01
5. \u5982\u679C\u662F\u9009\u62E9\u9898\uFF0C\u7B54\u6848\u4E2D\u5FC5\u987B\u5305\u542B\u5168\u90E8\u9009\u9879\uFF08A. B. C. D.\uFF09\uFF0C\u5E76\u7528 **[\u2713]** \u6807\u8BB0\u6B63\u786E\u7B54\u6848
6. \u8F93\u51FA JSON \u6570\u7EC4\u683C\u5F0F\uFF1A[{"question": "...", "answer": "..."}]

\u5B66\u4E60\u7B14\u8BB0\u5185\u5BB9\uFF1A
---
${text}
---

\u53EA\u8F93\u51FA JSON \u6570\u7EC4\uFF0C\u4E0D\u8981\u8F93\u51FA\u5176\u4ED6\u5185\u5BB9\u3002`;
  return await callLLM(settings, prompt);
}
async function normalizeQAPairs(items, settings) {
  if (!settings.aiApiKey || items.length === 0)
    return items;
  const choiceIndices = [];
  const nonChoiceItems = [];
  for (let i = 0; i < items.length; i++) {
    if (hasChoiceOptions(items[i].answer)) {
      choiceIndices.push(i);
    } else {
      nonChoiceItems.push(items[i]);
    }
  }
  if (nonChoiceItems.length === 0)
    return items;
  const itemsJson = JSON.stringify(
    nonChoiceItems.map((i) => ({ question: i.question, answer: i.answer }))
  );
  const prompt = `\u8BF7\u5C06\u4EE5\u4E0B\u9898\u76EE\u548C\u7B54\u6848\u6574\u7406\u4E3A\u7EDF\u4E00\u683C\u5F0F\u3002

\u89C4\u8303\u5316\u8981\u6C42\uFF1A
1. \u9898\u76EE\uFF1A\u6539\u4E3A\u5B8C\u6574\u7684\u95EE\u53E5\u5F62\u5F0F\uFF08\u5982"Git init" \u2192 "git init \u547D\u4EE4\u7684\u4F5C\u7528\u662F\u4EC0\u4E48\uFF1F"\uFF09
2. \u7B54\u6848\uFF1A\u4FDD\u6301\u539F\u610F\u4F46\u683C\u5F0F\u6E05\u6670\uFF0C\u4E2D\u6587\u4F7F\u7528\u5168\u89D2\u6807\u70B9\uFF0C\u82F1\u6587\u4F7F\u7528\u534A\u89D2\u6807\u70B9
3. \u53BB\u9664\u566A\u58F0\u548C\u65E0\u610F\u4E49\u7684\u7A7A\u767D
4. \u5982\u679C\u539F\u59CB\u7B54\u6848\u4E0D\u5B8C\u6574\uFF0C\u5C3D\u91CF\u6839\u636E\u4E0A\u4E0B\u6587\u8865\u5168
5. \u8F93\u51FA JSON \u6570\u7EC4\u683C\u5F0F\uFF1A\u8F93\u51FA\u683C\u5F0F\u4E0E\u8F93\u5165\u683C\u5F0F\u76F8\u540C

\u539F\u59CB\u9898\u76EE\u5217\u8868\uFF1A
${itemsJson}

\u53EA\u8F93\u51FA\u89C4\u8303\u5316\u540E\u7684 JSON \u6570\u7EC4\uFF0C\u4E0D\u8981\u8F93\u51FA\u5176\u4ED6\u5185\u5BB9\u3002`;
  const result = await callLLM(settings, prompt);
  if (result.length === 0)
    return items;
  for (let i = 0; i < Math.min(nonChoiceItems.length, result.length); i++) {
    if (result[i].question)
      nonChoiceItems[i].question = result[i].question;
    if (result[i].answer)
      nonChoiceItems[i].answer = result[i].answer;
  }
  const merged = [];
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
async function searchAndAnswer(question, originalAnswer, contexts, settings) {
  if (!settings.aiApiKey)
    return null;
  const contextText = contexts.map((c) => `\u3010\u6765\u6E90\uFF1A${c.file}\u3011
${c.content.substring(0, 1500)}`).join("\n\n---\n\n");
  const prompt = `\u4F60\u662F\u5B66\u4E60\u52A9\u624B\uFF0C\u6839\u636E\u53C2\u8003\u8D44\u6599\u751F\u6210\u51C6\u786E\u7B54\u6848\u3002

\u9898\u76EE\uFF1A${question}

\u53C2\u8003\u8D44\u6599\uFF08\u6309\u76F8\u5173\u5EA6\u6392\u5E8F\uFF09\uFF1A
${contextText || "\uFF08\u65E0\u989D\u5916\u53C2\u8003\u8D44\u6599\uFF09"}

\u8981\u6C42\uFF1A
1. \u4E25\u683C\u57FA\u4E8E\u53C2\u8003\u8D44\u6599\u56DE\u7B54\uFF0C\u4E0D\u8981\u7F16\u9020\u4FE1\u606F
2. \u5982\u679C\u53C2\u8003\u8D44\u6599\u5145\u5206\uFF0C\u76F4\u63A5\u5F15\u7528\u6216\u6982\u62EC\u539F\u6587
3. \u5982\u679C\u53C2\u8003\u8D44\u6599\u4E0D\u5145\u5206\uFF0C\u56DE\u7B54"\u53C2\u8003\u8D44\u6599\u4E2D\u672A\u627E\u5230\u76F8\u5173\u5185\u5BB9"\u5E76\u5C1D\u8BD5\u7B80\u8981\u56DE\u7B54
4. \u7B54\u6848\u7B80\u6D01\u3001\u51C6\u786E\uFF0C\u4E0D\u8D85\u8FC7200\u5B57
5. \u53EA\u8F93\u51FA\u7B54\u6848\u6587\u672C`;
  try {
    const response = await fetch(settings.aiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.aiApiKey}`
      },
      body: JSON.stringify({
        model: settings.aiModel,
        messages: [
          { role: "system", content: "\u4F60\u662F\u5B66\u4E60\u52A9\u624B\uFF0C\u4E25\u683C\u57FA\u4E8E\u53C2\u8003\u8D44\u6599\u751F\u6210\u51C6\u786E\u7B54\u6848\uFF0C\u4E0D\u7F16\u9020\u4FE1\u606F\u3002" },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1024
      })
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
function tryParseOptions(answer) {
  const lines = answer.split("\n");
  const optionLines = [];
  for (const line of lines) {
    const match = line.trim().match(/^([A-D])([).、．]\s*|\s+)(.+)/);
    if (match) {
      const text = match[3].trim();
      const isCorrect = /\*\*\[✓\]\*\*/.test(text);
      optionLines.push({
        label: match[1],
        text: text.replace(/\*\*\[✓\]\*\*/, "").trim(),
        isCorrect
      });
    }
  }
  if (optionLines.length < 2)
    return null;
  const correctIdx = optionLines.findIndex((o) => o.isCorrect);
  return {
    options: optionLines.map((o) => o.text),
    correctIndex: correctIdx >= 0 ? correctIdx : 0
  };
}
async function callLLM(settings, prompt) {
  try {
    const response = await fetch(settings.aiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.aiApiKey}`
      },
      body: JSON.stringify({
        model: settings.aiModel,
        messages: [
          { role: "system", content: "\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684\u5907\u8003\u9898\u76EE\u5904\u7406\u5668\uFF0C\u53EA\u8F93\u51FA JSON \u683C\u5F0F\u3002" },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("[RandomQuiz] AI API error:", errText);
      new import_obsidian.Notice(`AI API \u8C03\u7528\u5931\u8D25: ${response.status}`);
      return [];
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      new import_obsidian.Notice("AI \u8FD4\u56DE\u5185\u5BB9\u683C\u5F0F\u5F02\u5E38\uFF0C\u8BF7\u91CD\u8BD5");
      return [];
    }
    const pairs = JSON.parse(jsonMatch[0]);
    return pairs.map((pair, idx) => {
      const answer = pair.answer || "";
      const parsed = tryParseOptions(answer);
      const item = {
        id: `ai::${Date.now()}::${idx}`,
        question: pair.question || "",
        answer,
        sourceFile: "",
        sectionIndex: -1,
        createdAt: Date.now(),
        answerSource: "ai-generated"
      };
      if (parsed) {
        item.options = parsed.options;
        item.correctIndex = parsed.correctIndex;
      }
      return item;
    });
  } catch (e) {
    console.error("[RandomQuiz] AI call error:", e);
    new import_obsidian.Notice("AI \u8C03\u7528\u51FA\u9519\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u548C API \u914D\u7F6E");
    return [];
  }
}

// engine/ai-organizer.ts
var AIOrganizer = class {
  constructor(plugin, settings) {
    this.plugin = plugin;
    this.settings = settings;
  }
  /** 完整流水线：规则提取 → AI 检测 → 去重 → 规范化 → AI 搜索答案 */
  async processDocument(file) {
    const content = await this.plugin.app.vault.read(file);
    let items = extractQuestions(content, file.path);
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
    if (this.settings.normalizeFormat && this.settings.aiApiKey && items.length > 0) {
      items = await normalizeQAPairs(items, this.settings);
      for (let i = 0; i < items.length; i++) {
        items[i].sourceFile = file.path;
      }
    }
    if (this.settings.aiAutoSearch && this.settings.aiApiKey) {
      items = await this.enrichAnswersWithSearch(items);
    }
    return items.filter((item) => item.answer && item.answer.trim().length > 0);
  }
  /** 处理粘贴文本 */
  async processText(text) {
    let items = extractQuestions(text, "imported-text");
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
    if (this.settings.normalizeFormat && this.settings.aiApiKey && items.length > 0) {
      items = await normalizeQAPairs(items, this.settings);
    }
    return items.filter((item) => item.answer && item.answer.trim().length > 0);
  }
  /** 去重：按题目文本相似度合并 */
  deduplicate(items) {
    const seen = /* @__PURE__ */ new Map();
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
  normalizeForDedup(text) {
    return text.replace(/[？?。，,！!、\s"'""''「」『』【】《》（）()]+/g, "").replace(/^(请简述|请解释|什么是|简述|解释|什么叫做|什么叫)/, "").toLowerCase().substring(0, 40);
  }
  /** 找到粘贴文本中规则未处理的块 */
  findUnprocessedBlocksInText(text, items) {
    const lines = text.split("\n");
    const blocks = [];
    let currentBlock = [];
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
  findUnprocessedBlocks(content, items) {
    const blocks = [];
    const lines = content.split("\n");
    let startIdx = 0;
    if (lines[0]?.trim() === "---") {
      const end = lines.indexOf("---", 1);
      if (end !== -1)
        startIdx = end + 1;
    }
    let currentBlock = [];
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
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
    if (currentBlock.length > 0) {
      const block = currentBlock.join("\n").trim();
      if (block.length > 40 && !this.isAlreadyExtracted(block, items)) {
        blocks.push(block);
      }
    }
    return blocks;
  }
  /** 检查文本内容是否已被提取 */
  isAlreadyExtracted(block, items) {
    const blockLower = block.substring(0, 100).toLowerCase();
    for (const item of items) {
      if (item.answer.toLowerCase().includes(blockLower))
        return true;
    }
    return false;
  }
  /** 搜索 vault 中的答案并补全 */
  async enrichAnswersWithSearch(items) {
    const vaultFiles = this.plugin.app.vault.getMarkdownFiles();
    for (const item of items) {
      if (item.answer.length > 80)
        continue;
      const contexts = [];
      const scope = this.settings.aiSearchScope;
      const searchTerms = this.extractSearchTerms(item.question);
      for (const file of vaultFiles) {
        if (scope === "document" && file.path !== item.sourceFile)
          continue;
        const fileFolder = file.path.split("/").slice(0, -1).join("/");
        const sourceFolder = item.sourceFile.split("/").slice(0, -1).join("/");
        if (scope === "folder" && fileFolder !== sourceFolder)
          continue;
        if (contexts.length >= 5)
          break;
        try {
          const content = await this.plugin.app.vault.read(file);
          const matchCount = searchTerms.filter((kw) => content.includes(kw)).length;
          if (matchCount >= 1) {
            const relevant = this.extractRelevantParagraphs(content, searchTerms);
            if (relevant.length > 20) {
              contexts.push({ file: file.path, content: relevant, relevance: matchCount });
            }
          }
        } catch (e) {
        }
      }
      contexts.sort((a, b) => b.relevance - a.relevance);
      const topContexts = contexts.slice(0, 3);
      if (topContexts.length > 0) {
        const result = await searchAndAnswer(
          item.question,
          item.answer,
          topContexts.map((c) => ({ file: c.file, content: c.content })),
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
  extractSearchTerms(question) {
    const cleaned = question.replace(/[？?。，,！!、\s"'""''「」『』【】《》（）()请简述解释什么是叫做什么叫]+/g, "");
    const terms = [];
    const chineseChars = cleaned.match(/[一-鿿]+/g);
    if (chineseChars) {
      for (const chunk of chineseChars) {
        if (chunk.length >= 2) {
          terms.push(chunk);
          for (let i = 0; i < chunk.length - 1; i++) {
            terms.push(chunk.substring(i, i + 2));
          }
          for (let i = 0; i < chunk.length - 2; i++) {
            terms.push(chunk.substring(i, i + 3));
          }
        } else {
          terms.push(chunk);
        }
      }
    }
    const englishWords = cleaned.match(/[a-zA-Z0-9]+/g);
    if (englishWords) {
      terms.push(...englishWords.filter((w) => w.length > 1));
    }
    return [...new Set(terms)].slice(0, 12);
  }
  /** 从文件内容中提取与关键词相关的段落 */
  extractRelevantParagraphs(content, keywords) {
    const lines = content.split("\n");
    const relevant = [];
    for (let i = 0; i < lines.length; i++) {
      const matchCount = keywords.filter((kw) => lines[i].includes(kw)).length;
      if (matchCount >= 1) {
        const start = Math.max(0, i - 1);
        const end = Math.min(lines.length, i + 2);
        relevant.push(lines.slice(start, end).join("\n"));
        if (relevant.join("\n").length > 2e3)
          break;
      }
    }
    return relevant.join("\n\n");
  }
};

// engine/question-bank.ts
var QuestionBank = class {
  constructor(plugin) {
    this.items = [];
    this.shownIds = /* @__PURE__ */ new Set();
    this.fileTimestamps = /* @__PURE__ */ new Map();
    this.plugin = plugin;
  }
  /** 基本扫描：仅规则提取 */
  async scanFolder(settings) {
    if (!settings.targetFolder)
      return 0;
    const folder = this.plugin.app.vault.getAbstractFileByPath(
      settings.targetFolder.replace(/\/$/, "")
    );
    if (!folder) {
      console.warn(`[RandomQuiz] \u6587\u4EF6\u5939\u4E0D\u5B58\u5728: ${settings.targetFolder}`);
      return 0;
    }
    const newItems = [];
    const excludeList = settings.excludePatterns.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    await this.scanRecursive(folder, excludeList, newItems, false, settings);
    this.items = newItems;
    await this.saveToDisk(newItems);
    return newItems.length;
  }
  /** 增强扫描：规则提取 + AI 检测 + AI 搜索答案 + 规范化 */
  async scanFolderEnhanced(settings) {
    if (!settings.targetFolder)
      return 0;
    const folder = this.plugin.app.vault.getAbstractFileByPath(
      settings.targetFolder.replace(/\/$/, "")
    );
    if (!folder) {
      console.warn(`[RandomQuiz] \u6587\u4EF6\u5939\u4E0D\u5B58\u5728: ${settings.targetFolder}`);
      return 0;
    }
    const newItems = [];
    const excludeList = settings.excludePatterns.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    await this.scanRecursive(folder, excludeList, newItems, true, settings);
    this.items = newItems;
    await this.saveToDisk(newItems);
    return newItems.length;
  }
  async scanRecursive(entry, excludeList, result, enhanced, settings) {
    if (entry.children) {
      for (const child of entry.children) {
        await this.scanRecursive(child, excludeList, result, enhanced, settings);
      }
      return;
    }
    if (!(entry instanceof import_obsidian2.TFile))
      return;
    if (!entry.extension.toLowerCase().endsWith("md"))
      return;
    const name = entry.name;
    if (excludeList.some((p) => name.includes(p)))
      return;
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
  async addItems(newItems, settings) {
    this.items.push(...newItems);
    await this.saveToDisk(this.items);
    if (settings.outputFile && newItems.length > 0) {
      await this.appendToFile(newItems, settings.outputFile);
    }
  }
  /** 将题目追加写入 vault 中的 Markdown 文件 */
  async appendToFile(items, filePath) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let newContent = `
## ${timestamp} \u5BFC\u5165 (${items.length} \u9898)

`;
    for (const item of items) {
      newContent += `### Q: ${item.question}
`;
      if (item.options && item.options.length > 0) {
        const labels = ["A", "B", "C", "D", "E", "F"];
        for (let i = 0; i < item.options.length; i++) {
          newContent += `${labels[i] || i}. ${item.options[i]}
`;
        }
      }
      newContent += `A: ${item.answer}
`;
      if (item.answerSource === "ai-generated") {
        newContent += `> AI \u751F\u6210`;
        if (item.relatedFiles && item.relatedFiles.length > 0) {
          newContent += ` | \u53C2\u8003: ${item.relatedFiles.join(", ")}`;
        }
        newContent += `
`;
      }
      newContent += `
---

`;
    }
    const exists = await this.plugin.app.vault.adapter.exists(filePath);
    if (exists) {
      const existing = await this.plugin.app.vault.adapter.read(filePath);
      await this.plugin.app.vault.adapter.write(filePath, existing + newContent);
    } else {
      const header = `# \u9898\u5E93

> \u81EA\u52A8\u751F\u6210\u7684\u590D\u4E60\u9898\u5E93 | \u6765\u6E90: ${(/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN")}

---
`;
      await this.plugin.app.vault.create(filePath, header + newContent);
    }
  }
  /** 获取随机题目 */
  getRandom(count) {
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
  markShown(id) {
    this.shownIds.add(id);
  }
  resetProgress() {
    this.shownIds.clear();
  }
  getTotalCount() {
    return this.items.length;
  }
  getRemainingCount() {
    return this.items.length - this.shownIds.size;
  }
  getStatsByFile() {
    const stats = /* @__PURE__ */ new Map();
    for (const item of this.items) {
      stats.set(item.sourceFile, (stats.get(item.sourceFile) || 0) + 1);
    }
    return stats;
  }
  async saveToDisk(items) {
    const data = JSON.stringify({ items, updatedAt: Date.now() }, null, 2);
    const path = ".obsidian/plugins/random-quiz/data.json";
    const exists = await this.plugin.app.vault.adapter.exists(path);
    if (exists) {
      await this.plugin.app.vault.adapter.write(path, data);
    } else {
      await this.plugin.app.vault.create(path, data);
    }
  }
  async loadFromDisk() {
    const path = ".obsidian/plugins/random-quiz/data.json";
    const exists = await this.plugin.app.vault.adapter.exists(path);
    if (!exists)
      return false;
    try {
      const raw = await this.plugin.app.vault.adapter.read(path);
      const data = JSON.parse(raw);
      if (data.items && Array.isArray(data.items)) {
        this.items = data.items;
        return true;
      }
    } catch (e) {
      console.warn("[RandomQuiz] \u9898\u5E93\u52A0\u8F7D\u5931\u8D25:", e);
    }
    return false;
  }
};

// ui/quiz-modal.ts
var import_obsidian3 = require("obsidian");
var QuizModal = class extends import_obsidian3.Modal {
  constructor(app, questions, onNext) {
    super(app);
    this.questions = questions;
    this.currentIndex = 0;
    this.answerRevealed = false;
    this.onNext = onNext;
  }
  onOpen() {
    this.displayQuestion();
  }
  displayQuestion() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("random-quiz-modal");
    if (this.questions.length === 0) {
      contentEl.createEl("p", { text: "\u9898\u5E93\u4E3A\u7A7A\uFF0C\u8BF7\u5148\u626B\u63CF\u9898\u5E93\u6216\u5BFC\u5165\u9898\u76EE\u3002" });
      return;
    }
    const item = this.questions[this.currentIndex];
    const progress = `${this.currentIndex + 1} / ${this.questions.length}`;
    contentEl.createEl("div", { cls: "quiz-progress", text: progress });
    const sourceText = item.sourceFile !== "imported-text" ? `\u6765\u6E90: ${item.sourceFile}` : "\u6765\u6E90: \u5BFC\u5165\u7684\u6587\u672C";
    const sourceDiv = contentEl.createEl("div", { cls: "quiz-source" });
    sourceDiv.createEl("span", { text: sourceText });
    if (item.answerSource === "ai-generated") {
      sourceDiv.createEl("span", {
        cls: "quiz-ai-badge",
        text: "AI \u751F\u6210"
      });
    }
    if (item.relatedFiles && item.relatedFiles.length > 0) {
      sourceDiv.createEl("div", {
        cls: "quiz-related",
        text: `\u53C2\u8003: ${item.relatedFiles.join(", ")}`
      });
    }
    const questionEl = contentEl.createEl("div", { cls: "quiz-question" });
    questionEl.createEl("strong", { text: "\u9898\u76EE\uFF1A" });
    questionEl.createEl("p", { text: item.question });
    if (item.options && item.options.length > 0) {
      const optionsContainer = contentEl.createEl("div", { cls: "quiz-options-container" });
      const labels = ["A", "B", "C", "D", "E", "F"];
      for (let i = 0; i < item.options.length; i++) {
        const row = optionsContainer.createEl("div", { cls: "quiz-option-row" });
        const isCorrect = this.answerRevealed && i === (item.correctIndex ?? 0);
        row.createEl("span", {
          cls: `quiz-option-label${isCorrect ? " quiz-option-correct" : ""}`,
          text: labels[i] || String(i)
        });
        row.createEl("span", {
          cls: `quiz-option-text${isCorrect ? " quiz-option-correct" : ""}`,
          text: item.options[i]
        });
        if (isCorrect) {
          row.createEl("span", { cls: "quiz-option-check", text: " \u2713" });
        }
      }
    }
    const answerContainer = contentEl.createEl("div", { cls: "quiz-answer-container" });
    if (!this.answerRevealed) {
      const revealBtn = answerContainer.createEl("button", {
        cls: "quiz-reveal-btn",
        text: "\u663E\u793A\u7B54\u6848"
      });
      revealBtn.addEventListener("click", () => {
        this.answerRevealed = true;
        this.displayQuestion();
      });
    } else if (item.options && item.options.length > 0) {
      const correctIdx = item.correctIndex ?? 0;
      const label = ["A", "B", "C", "D", "E", "F"][correctIdx] || "?";
      answerContainer.createEl("div", { cls: "quiz-answer-label" }).createEl("strong", {
        text: "\u7B54\u6848\uFF1A"
      });
      answerContainer.createEl("div", {
        cls: "quiz-answer",
        text: `${label}. ${item.options[correctIdx] || item.answer}`
      });
    } else {
      answerContainer.createEl("div", { cls: "quiz-answer-label" }).createEl("strong", {
        text: "\u7B54\u6848\uFF1A"
      });
      if (isChoiceAnswer(item.answer)) {
        answerContainer.createEl("div", { cls: "quiz-answer" }).appendChild(
          renderChoiceAnswer(item.answer)
        );
      } else {
        answerContainer.createEl("div", { cls: "quiz-answer", text: item.answer });
      }
    }
    const buttonRow = contentEl.createEl("div", { cls: "quiz-buttons" });
    if (this.currentIndex < this.questions.length - 1) {
      const nextBtn = buttonRow.createEl("button", { cls: "quiz-next-btn", text: "\u4E0B\u4E00\u9898" });
      nextBtn.addEventListener("click", () => {
        this.currentIndex++;
        this.answerRevealed = false;
        this.displayQuestion();
      });
    } else {
      const finishBtn = buttonRow.createEl("button", {
        cls: "quiz-finish-btn",
        text: "\u5B8C\u6210"
      });
      finishBtn.addEventListener("click", () => {
        this.close();
        this.onNext();
      });
    }
    const closeBtn = buttonRow.createEl("button", { text: "\u5173\u95ED" });
    closeBtn.addEventListener("click", () => this.close());
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
function isChoiceAnswer(answer) {
  return /[A-D]([).、．]\s*|\s+)/.test(answer);
}
function renderChoiceAnswer(answer) {
  const container = document.createElement("div");
  const lines = answer.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed)
      continue;
    const optionMatch = trimmed.match(/^([A-D])([).、．]\s*|\s+)(.+)/);
    if (optionMatch) {
      const row = container.createEl("div", { cls: "quiz-option-row" });
      const isCorrect = /\*\*\[✓\]\*\*/.test(trimmed);
      row.createEl("span", {
        cls: `quiz-option-label${isCorrect ? " quiz-option-correct" : ""}`,
        text: optionMatch[1]
      });
      const text = optionMatch[3].replace(/\*\*\[✓\]\*\*/, "").trim();
      const textEl = row.createEl("span", {
        cls: `quiz-option-text${isCorrect ? " quiz-option-correct" : ""}`,
        text
      });
      if (isCorrect) {
        textEl.createEl("span", { cls: "quiz-option-check", text: " \u2713" });
      }
    } else {
      container.createEl("div", { text: trimmed, cls: "quiz-answer-note" });
    }
  }
  return container;
}

// ui/settings-tab.ts
var import_obsidian4 = require("obsidian");
var RandomQuizSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin, settings, saveFn) {
    super(app, plugin);
    this.settings = settings;
    this.saveFn = saveFn;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "\u968F\u673A\u9898\u76EE\u62BD\u53D6 - \u8BBE\u7F6E" });
    containerEl.createEl("h3", { text: "\u57FA\u672C\u8BBE\u7F6E" });
    new import_obsidian4.Setting(containerEl).setName("\u76EE\u6807\u6587\u4EF6\u5939").setDesc("\u626B\u63CF\u6B64\u6587\u4EF6\u5939\u5185\u7684 Markdown \u6587\u4EF6\u63D0\u53D6\u9898\u76EE").addText(
      (text) => text.setPlaceholder("learning\u5B66\u4E60/\u5907\u8003/").setValue(this.settings.targetFolder).onChange(async (value) => {
        this.settings.targetFolder = value;
        await this.saveFn();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u6392\u9664\u6587\u4EF6").setDesc("\u6587\u4EF6\u540D\u5305\u542B\u8FD9\u4E9B\u5173\u952E\u8BCD\u7684\u6587\u4EF6\u5C06\u88AB\u8DF3\u8FC7\uFF08\u9017\u53F7\u5206\u9694\uFF09").addText(
      (text) => text.setPlaceholder("README,\u6A21\u677F").setValue(this.settings.excludePatterns).onChange(async (value) => {
        this.settings.excludePatterns = value;
        await this.saveFn();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u9898\u5E93\u8F93\u51FA\u6587\u4EF6").setDesc("\u5BFC\u5165\u9898\u76EE\u65F6\u540C\u6B65\u5199\u5165\u7684 Markdown \u6587\u4EF6\u8DEF\u5F84").addText(
      (text) => text.setPlaceholder("learning\u5B66\u4E60/\u5907\u8003/\u9898\u5E93.md").setValue(this.settings.outputFile).onChange(async (value) => {
        this.settings.outputFile = value;
        await this.saveFn();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u6BCF\u8F6E\u9898\u76EE\u6570").setDesc("\u6BCF\u6B21\u968F\u673A\u62BD\u53D6\u7684\u9898\u76EE\u6570\u91CF").addSlider(
      (slider) => slider.setLimits(1, 10, 1).setValue(this.settings.questionsPerRound).setDynamicTooltip().onChange(async (value) => {
        this.settings.questionsPerRound = value;
        await this.saveFn();
      })
    );
    containerEl.createEl("h3", { text: "AI \u589E\u5F3A\u8BBE\u7F6E" });
    new import_obsidian4.Setting(containerEl).setName("AI API Key").setDesc("\u7528\u4E8E AI \u529F\u80FD\u7684 API \u5BC6\u94A5\uFF08\u652F\u6301 OpenAI \u517C\u5BB9\u63A5\u53E3\uFF09").addText(
      (text) => text.setPlaceholder("sk-...").setValue(this.settings.aiApiKey).onChange(async (value) => {
        this.settings.aiApiKey = value;
        await this.saveFn();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("AI Endpoint").setDesc("\u517C\u5BB9 OpenAI \u683C\u5F0F\u7684 API \u5730\u5740").addText(
      (text) => text.setPlaceholder("https://api.deepseek.com/v1/chat/completions").setValue(this.settings.aiEndpoint).onChange(async (value) => {
        this.settings.aiEndpoint = value;
        await this.saveFn();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("AI Model").setDesc("\u4F7F\u7528\u7684\u6A21\u578B\u540D\u79F0").addText(
      (text) => text.setPlaceholder("deepseek-chat").setValue(this.settings.aiModel).onChange(async (value) => {
        this.settings.aiModel = value;
        await this.saveFn();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u81EA\u52A8\u641C\u7D22\u7B54\u6848").setDesc("\u626B\u63CF\u65F6\u81EA\u52A8\u5728 Vault \u4E2D\u641C\u7D22\u7B54\u6848\u5E76\u8865\u5168").addToggle(
      (toggle) => toggle.setValue(this.settings.aiAutoSearch).onChange(async (value) => {
        this.settings.aiAutoSearch = value;
        await this.saveFn();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u7B54\u6848\u641C\u7D22\u8303\u56F4").setDesc("AI \u641C\u7D22\u7B54\u6848\u7684\u8303\u56F4").addDropdown(
      (dropdown) => dropdown.addOption("document", "\u4EC5\u5F53\u524D\u6587\u6863").addOption("folder", "\u5F53\u524D\u6587\u4EF6\u5939").addOption("vault", "\u6574\u4E2A Vault").setValue(this.settings.aiSearchScope).onChange(async (value) => {
        this.settings.aiSearchScope = value;
        await this.saveFn();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("AI \u8BC6\u522B\u9898\u76EE").setDesc("\u7528 AI \u8BC6\u522B\u89C4\u5219\u65E0\u6CD5\u5904\u7406\u7684\u7EAF\u6587\u672C\u6BB5\u843D").addToggle(
      (toggle) => toggle.setValue(this.settings.aiDetectQuestions).onChange(async (value) => {
        this.settings.aiDetectQuestions = value;
        await this.saveFn();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("\u683C\u5F0F\u89C4\u8303\u5316").setDesc("AI \u5C06\u9898\u76EE\u548C\u7B54\u6848\u7EDF\u4E00\u4E3A\u89C4\u8303\u683C\u5F0F\uFF08\u95EE\u53E5 + \u6E05\u6670\u7B54\u6848\uFF09").addToggle(
      (toggle) => toggle.setValue(this.settings.normalizeFormat).onChange(async (value) => {
        this.settings.normalizeFormat = value;
        await this.saveFn();
      })
    );
  }
};

// ui/import-modal.ts
var import_obsidian5 = require("obsidian");
var ImportModal = class extends import_obsidian5.Modal {
  constructor(app, plugin, settings, onComplete) {
    super(app);
    this.previewItems = [];
    this.plugin = plugin;
    this.settings = settings;
    this.onComplete = onComplete;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("random-quiz-modal");
    contentEl.createEl("h2", { text: "\u5BFC\u5165\u9898\u76EE" });
    const tabRow = contentEl.createEl("div", { cls: "quiz-buttons" });
    const pasteTab = tabRow.createEl("button", { text: "\u7C98\u8D34\u6587\u672C", cls: "quiz-next-btn" });
    const fileTab = tabRow.createEl("button", { text: "\u9009\u62E9\u6587\u4EF6" });
    const inputArea = contentEl.createEl("div");
    new import_obsidian5.Setting(inputArea).setName("\u8F93\u5165\u6587\u672C").setDesc("\u7C98\u8D34\u5305\u542B\u9898\u76EE\u7684\u6587\u672C\uFF08\u652F\u6301 Markdown \u683C\u5F0F\uFF09");
    this.textArea = new import_obsidian5.TextAreaComponent(inputArea);
    this.textArea.setPlaceholder("\u5728\u6B64\u7C98\u8D34\u5B66\u4E60\u7B14\u8BB0\u5185\u5BB9...");
    this.textArea.inputEl.rows = 12;
    this.textArea.inputEl.style.width = "100%";
    const fileArea = contentEl.createEl("div");
    fileArea.style.display = "none";
    new import_obsidian5.Setting(fileArea).setName("\u6587\u4EF6\u9009\u62E9").setDesc("\u4ECE Vault \u4E2D\u9009\u62E9\u6587\u4EF6\u5BFC\u5165");
    const selectBtn = fileArea.createEl("button", { text: "\u6D4F\u89C8\u6587\u4EF6..." });
    selectBtn.addEventListener("click", async () => {
      const files = await this.pickFiles();
      if (files.length > 0) {
        this.processFiles(files);
      }
    });
    pasteTab.addEventListener("click", () => {
      inputArea.style.display = "block";
      fileArea.style.display = "none";
    });
    fileTab.addEventListener("click", () => {
      inputArea.style.display = "none";
      fileArea.style.display = "block";
    });
    const actionRow = contentEl.createEl("div", { cls: "quiz-buttons" });
    const recognizeBtn = actionRow.createEl("button", { text: "\u8BC6\u522B\u5E76\u9884\u89C8", cls: "quiz-reveal-btn" });
    recognizeBtn.addEventListener("click", async () => {
      const text = this.textArea.getValue();
      if (!text.trim()) {
        new import_obsidian5.Notice("\u8BF7\u8F93\u5165\u6587\u672C\u5185\u5BB9");
        return;
      }
      await this.recognizeText(text);
    });
    const previewSection = contentEl.createEl("div");
    previewSection.createEl("h3", { text: "\u9884\u89C8\u7ED3\u679C" });
    const previewList = previewSection.createEl("div", { cls: "quiz-preview-list" });
    const importBtn = contentEl.createEl("button", {
      text: "\u5168\u90E8\u52A0\u5165\u9898\u5E93",
      cls: "quiz-next-btn"
    });
    importBtn.style.display = "none";
    importBtn.addEventListener("click", () => {
      this.onComplete(this.previewItems);
      new import_obsidian5.Notice(`\u5DF2\u5BFC\u5165 ${this.previewItems.length} \u9053\u9898\u76EE`);
      this.close();
    });
    this._previewList = previewList;
    this._importBtn = importBtn;
  }
  async recognizeText(text) {
    const previewList = this._previewList;
    const importBtn = this._importBtn;
    new import_obsidian5.Notice("\u6B63\u5728\u8BC6\u522B\u9898\u76EE...");
    const organizer = new AIOrganizer(this.plugin, this.settings);
    const items = await organizer.processText(text);
    this.previewItems = items;
    previewList.empty();
    if (items.length === 0) {
      previewList.createEl("p", { text: "\u672A\u8BC6\u522B\u5230\u53EF\u7528\u7684\u9898\u76EE\uFF0C\u8BF7\u5C1D\u8BD5\u66F4\u6E05\u6670\u7684\u5185\u5BB9\u683C\u5F0F\u3002" });
      return;
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const card = previewList.createEl("div", { cls: "quiz-preview-card" });
      const qRow = card.createEl("div");
      qRow.createEl("strong", { text: `Q${i + 1}: ` });
      const qInput = qRow.createEl("input", { type: "text", value: item.question });
      qInput.style.width = "100%";
      qInput.addEventListener("change", () => {
        item.question = qInput.value;
      });
      const aRow = card.createEl("div");
      aRow.createEl("strong", { text: "A: " });
      const aInput = aRow.createEl("textarea", { text: item.answer });
      aInput.rows = 3;
      aInput.style.width = "100%";
      aInput.addEventListener("change", () => {
        item.answer = aInput.value;
      });
      const delBtn = card.createEl("button", { text: "\u79FB\u9664" });
      delBtn.addEventListener("click", () => {
        this.previewItems = this.previewItems.filter((_, idx) => idx !== i);
        this.renderPreview();
      });
    }
    importBtn.style.display = "block";
  }
  renderPreview() {
    const previewList = this._previewList;
    const importBtn = this._importBtn;
    previewList.empty();
    if (this.previewItems.length === 0) {
      previewList.createEl("p", { text: "\u672A\u8BC6\u522B\u5230\u53EF\u7528\u7684\u9898\u76EE\u3002" });
      importBtn.style.display = "none";
      return;
    }
    for (let i = 0; i < this.previewItems.length; i++) {
      const item = this.previewItems[i];
      const card = previewList.createEl("div", { cls: "quiz-preview-card" });
      card.createEl("strong", { text: `Q${i + 1}: ${item.question}` });
      card.createEl("p", { text: `A: ${item.answer.substring(0, 200)}...` });
      const delBtn = card.createEl("button", { text: "\u79FB\u9664" });
      delBtn.addEventListener("click", () => {
        this.previewItems = this.previewItems.filter((_, idx) => idx !== i);
        this.renderPreview();
      });
    }
  }
  async processFiles(files) {
    new import_obsidian5.Notice(`\u6B63\u5728\u5904\u7406 ${files.length} \u4E2A\u6587\u4EF6...`);
    const organizer = new AIOrganizer(this.plugin, this.settings);
    const allItems = [];
    for (const path of files) {
      const file = this.plugin.app.vault.getAbstractFileByPath(path);
      if (file instanceof import_obsidian5.TFile) {
        const items = await organizer.processDocument(file);
        allItems.push(...items);
      }
    }
    this.previewItems = allItems;
    const previewList = this._previewList;
    const importBtn = this._importBtn;
    previewList.empty();
    if (allItems.length === 0) {
      previewList.createEl("p", { text: "\u672A\u8BC6\u522B\u5230\u53EF\u7528\u7684\u9898\u76EE\u3002" });
      return;
    }
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      const card = previewList.createEl("div", { cls: "quiz-preview-card" });
      card.createEl("strong", { text: `Q${i + 1}: ${item.question}` });
      card.createEl("p", { text: `A: ${item.answer.substring(0, 150)}...` });
    }
    importBtn.style.display = "block";
  }
  async pickFiles() {
    return new Promise((resolve) => {
      const files = this.plugin.app.vault.getMarkdownFiles();
      const modal = new FilePickerModal(this.app, files, resolve);
      modal.open();
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
var FilePickerModal = class extends import_obsidian5.Modal {
  constructor(app, files, resolve) {
    super(app);
    this.selected = /* @__PURE__ */ new Set();
    this.files = files;
    this.resolve = resolve;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "\u9009\u62E9\u6587\u4EF6" });
    const list = contentEl.createEl("div");
    list.style.maxHeight = "300px";
    list.style.overflowY = "auto";
    for (const file of this.files) {
      const row = list.createEl("div");
      const cb = row.createEl("input", { type: "checkbox" });
      row.createEl("span", { text: file.path });
      cb.addEventListener("change", () => {
        if (cb.checked) {
          this.selected.add(file.path);
        } else {
          this.selected.delete(file.path);
        }
      });
    }
    const btnRow = contentEl.createEl("div", { cls: "quiz-buttons" });
    btnRow.createEl("button", { text: "\u786E\u8BA4" }).addEventListener("click", () => {
      this.resolve([...this.selected]);
      this.close();
    });
    btnRow.createEl("button", { text: "\u53D6\u6D88" }).addEventListener("click", () => {
      this.resolve([]);
      this.close();
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};

// main.ts
var RandomQuizPlugin = class extends import_obsidian6.Plugin {
  async onload() {
    await this.loadSettings();
    this.questionBank = new QuestionBank(this);
    await this.questionBank.loadFromDisk();
    this.addSettingTab(
      new RandomQuizSettingTab(this.app, this, this.settings, this.saveSettings.bind(this))
    );
    this.addCommand({
      id: "import-questions",
      name: "\u5BFC\u5165\u9898\u76EE",
      callback: () => {
        new ImportModal(this.app, this, this.settings, async (items) => {
          await this.questionBank.addItems(items, this.settings);
        }).open();
      }
    });
    this.addCommand({
      id: "scan-question-bank",
      name: "\u626B\u63CF\u9898\u5E93",
      callback: async () => {
        new import_obsidian6.Notice("\u6B63\u5728\u626B\u63CF\u9898\u5E93...");
        const count = await this.questionBank.scanFolder(this.settings);
        new import_obsidian6.Notice(`\u9898\u5E93\u626B\u63CF\u5B8C\u6210\uFF0C\u5171\u63D0\u53D6 ${count} \u9053\u9898\u76EE`);
      }
    });
    this.addCommand({
      id: "ai-scan",
      name: "AI \u667A\u80FD\u626B\u63CF",
      callback: async () => {
        if (!this.settings.aiApiKey) {
          new import_obsidian6.Notice("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E AI API Key");
          return;
        }
        new import_obsidian6.Notice("\u6B63\u5728 AI \u667A\u80FD\u626B\u63CF\uFF08\u89C4\u5219\u63D0\u53D6 + AI \u68C0\u6D4B + \u641C\u7D22\u7B54\u6848 + \u89C4\u8303\u5316\uFF09...");
        const count = await this.questionBank.scanFolderEnhanced(this.settings);
        new import_obsidian6.Notice(`AI \u667A\u80FD\u626B\u63CF\u5B8C\u6210\uFF0C\u5171\u63D0\u53D6 ${count} \u9053\u9898\u76EE`);
      }
    });
    this.addCommand({
      id: "ai-enrich-answers",
      name: "AI \u8865\u5168\u7B54\u6848",
      editorCallback: async () => {
        if (!this.settings.aiApiKey) {
          new import_obsidian6.Notice("\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E AI API Key");
          return;
        }
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new import_obsidian6.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u6587\u6863");
          return;
        }
        new import_obsidian6.Notice("\u6B63\u5728\u641C\u7D22\u5E76\u8865\u5168\u7B54\u6848...");
        const organizer = new AIOrganizer(this, this.settings);
        const items = await organizer.processDocument(file);
        await this.questionBank.addItems(items, this.settings);
        new import_obsidian6.Notice(`AI \u8865\u5168\u5B8C\u6210\uFF0C\u5171\u5904\u7406 ${items.length} \u9053\u9898\u76EE`);
      }
    });
    this.addCommand({
      id: "random-quiz",
      name: "\u968F\u673A\u62BD\u9898",
      callback: () => this.startQuiz()
    });
    this.addCommand({
      id: "ai-generate-questions",
      name: "AI \u751F\u6210\u9898\u76EE\uFF08\u4ECE\u9009\u4E2D\u6587\u672C\uFF09",
      editorCallback: async (editor) => {
        const selection = editor.getSelection();
        if (!selection) {
          new import_obsidian6.Notice("\u8BF7\u5148\u9009\u4E2D\u4E00\u6BB5\u6587\u672C");
          return;
        }
        const file = this.app.workspace.getActiveFile();
        const sourcePath = file?.path || "unknown";
        new import_obsidian6.Notice("\u6B63\u5728\u8C03\u7528 AI \u751F\u6210\u9898\u76EE...");
        const items = await generateQuestionsFromText(selection, sourcePath, this.settings);
        if (items.length > 0) {
          await this.questionBank.addItems(items, this.settings);
          new import_obsidian6.Notice(`\u5DF2\u6DFB\u52A0 ${items.length} \u9053\u9898\u76EE\u5230\u9898\u5E93`);
        }
      }
    });
    this.addCommand({
      id: "quiz-stats",
      name: "\u67E5\u770B\u9898\u5E93\u7EDF\u8BA1",
      callback: () => {
        const total = this.questionBank.getTotalCount();
        const remaining = this.questionBank.getRemainingCount();
        const stats = this.questionBank.getStatsByFile();
        let msg = `\u9898\u5E93\u603B\u91CF: ${total}\uFF0C\u5F85\u590D\u4E60: ${remaining}
`;
        stats.forEach((count, file) => {
          msg += `  ${file}: ${count} \u9898
`;
        });
        new import_obsidian6.Notice(msg, 8e3);
      }
    });
    this.addCommand({
      id: "reset-progress",
      name: "\u91CD\u7F6E\u7B54\u9898\u8FDB\u5EA6",
      callback: () => {
        this.questionBank.resetProgress();
        new import_obsidian6.Notice("\u7B54\u9898\u8FDB\u5EA6\u5DF2\u91CD\u7F6E");
      }
    });
    this.addRibbonIcon("dice", "\u968F\u673A\u62BD\u9898", () => this.startQuiz());
  }
  startQuiz() {
    if (this.questionBank.getTotalCount() === 0) {
      new import_obsidian6.Notice('\u9898\u5E93\u4E3A\u7A7A\uFF0C\u8BF7\u5148\u8FD0\u884C"AI \u667A\u80FD\u626B\u63CF"\u6216"\u5BFC\u5165\u9898\u76EE"');
      return;
    }
    const questions = this.questionBank.getRandom(this.settings.questionsPerRound);
    if (questions.length === 0) {
      new import_obsidian6.Notice("\u6CA1\u6709\u53EF\u7528\u7684\u9898\u76EE");
      return;
    }
    new QuizModal(this.app, questions, () => {
    }).open();
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
