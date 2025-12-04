export interface ExtractedItem {
  account: string;
  time: string; // ISO string
  score: number;
}

export interface ExtractionResponse {
  items: ExtractedItem[];
}

export interface FileJob {
  id: string;
  fileName: string;
  file: File; // Keep reference to file for processing
  imageUrl: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  results: ExtractedItem[];
  errorMessage?: string;
}

// Helper type for the table display
export interface DisplayRow {
  uniqueId: string;
  jobId: string;
  fileName: string;
  imageUrl: string;
  account: string;
  timestamp: number;
  score: number;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  duplicateCount?: number;
}