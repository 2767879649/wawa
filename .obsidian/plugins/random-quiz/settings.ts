export interface RandomQuizSettings {
  targetFolder: string;
  excludePatterns: string;
  aiApiKey: string;
  aiEndpoint: string;
  aiModel: string;
  questionsPerRound: number;
  aiAutoSearch: boolean;
  aiSearchScope: "document" | "folder" | "vault";
  aiDetectQuestions: boolean;
  normalizeFormat: boolean;
  outputFile: string;
}

export const DEFAULT_SETTINGS: RandomQuizSettings = {
  targetFolder: "learning学习/备考/",
  excludePatterns: "",
  aiApiKey: "",
  aiEndpoint: "https://api.deepseek.com/v1/chat/completions",
  aiModel: "deepseek-chat",
  questionsPerRound: 1,
  aiAutoSearch: true,
  aiSearchScope: "folder",
  aiDetectQuestions: true,
  normalizeFormat: true,
  outputFile: "learning学习/备考/题库.md",
};

export interface QuestionItem {
  id: string;
  question: string;
  answer: string;
  options?: string[];
  correctIndex?: number;
  sourceFile: string;
  sectionIndex: number;
  createdAt: number;
  answerSource: "extracted" | "ai-generated";
  relatedFiles?: string[];
}
