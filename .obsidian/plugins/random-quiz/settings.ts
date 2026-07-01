export interface RandomQuizSettings {
  targetFolder: string;
  excludePatterns: string;
  aiApiKey: string;
  aiEndpoint: string;
  aiModel: string;
  questionsPerRound: number;
}

export const DEFAULT_SETTINGS: RandomQuizSettings = {
  targetFolder: "learning学习/备考/",
  excludePatterns: "",
  aiApiKey: "",
  aiEndpoint: "https://api.deepseek.com/v1/chat/completions",
  aiModel: "deepseek-chat",
  questionsPerRound: 1,
};

export interface QuestionItem {
  id: string;
  question: string;
  answer: string;
  sourceFile: string;
  sectionIndex: number;
  createdAt: number;
}
