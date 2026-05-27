interface GenerateContentCandidate {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
}

export interface GeniaGenerateContentSuccess {
  candidates?: GenerateContentCandidate[];
  error?: string | { message?: string };
}
