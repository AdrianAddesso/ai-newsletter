interface GenerateContentCandidate {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
}

export interface NestleGeniaGenerateContentSuccess {
  candidates?: GenerateContentCandidate[];
  error?: string | { message?: string };
}
