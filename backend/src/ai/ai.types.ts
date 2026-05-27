interface GenerateContentCandidate {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
}

export interface GenaiGenerateContentSuccess {
  candidates?: GenerateContentCandidate[];
  error?: string | { message?: string };
}
