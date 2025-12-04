import { GoogleGenAI, Type } from "@google/genai";
import { fileToGenerativePart } from '../utils';
import { ExtractionResponse } from '../types';

class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async extractDataFromImage(file: File): Promise<ExtractionResponse> {
    const imagePart = await fileToGenerativePart(file);

    const prompt = `
      このゲームのスクリーンショットを解析してください。
      
      【重要】
      画像にはランキング、スコア履歴、メンバーリストなど、**複数のデータ行**が含まれている可能性があります。
      リストや表形式で表示されているデータは、**見えているすべての行**を漏れなく抽出してください。
      1行目だけで処理を終了しないでください。
      
      以下の情報を抽出してください：
      1. アカウント名
         - 通常はプレイヤー名やIDです。
         - **重要**: テキストに「:」（半角コロン）または「：」（全角コロン）が含まれている場合（例：「招待：Taro」、「ろ:Hanako」、「Name: Jiro」など）、その**区切り文字より後ろ**にある文字列のみをアカウント名として抽出してください。
         - プレフィックス（ラベル部分）は削除してください。
      2. 日時 (画面内のタイムスタンプ。YYYY-MM-DDTHH:mm:ss 形式のISO文字列に変換してください。日付がない場合は今日の年月日を使用してください)
      3. 点数 (スコア、ポイント、ダメージ値など、メインとなる数値。数値のみを抽出してください)
      
      注意:
      - テキストが見つからない場合は "Unknown" を返してください。
      - 点数が見つからない、または読み取れない場合は 0 (数値) を返してください。
      - 出力は必ず指定されたJSONスキーマに従い、items配列の中に結果を入れてください。
    `;

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), 30000); // 30s timeout
      });

      const requestPromise = this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [imagePart, { text: prompt }]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    account: { type: Type.STRING, description: "プレイヤーのアカウント名" },
                    time: { type: Type.STRING, description: "日時 (ISO 8601形式)" },
                    score: { type: Type.NUMBER, description: "点数 (数値)" }
                  },
                  required: ["account", "time", "score"]
                }
              }
            },
            required: ["items"]
          }
        }
      });

      // Race the request against the timeout
      const response = await Promise.race([requestPromise, timeoutPromise]);

      let text = response.text;
      if (!text) throw new Error("No response from AI");
      
      // Clean up markdown code blocks if present to prevent JSON parse errors
      text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      
      const json = JSON.parse(text) as ExtractionResponse;
      
      // Ensure items is always an array
      if (!json.items || !Array.isArray(json.items)) {
        return { items: [] };
      }

      return json;

    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();