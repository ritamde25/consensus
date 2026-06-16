import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateMarketAnalysis(
  marketId: string
): Promise<string> {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    select: {
      title: true,
      description: true,
    },
  });

  if (!market) {
    throw new Error("Market not found");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = `
    You are an analyst for a prediction market.

    Market:
    Title: ${market.title}

    Description:
    ${market.description ?? "No description provided"}

    Generate:
    1. Bull case
    2. Bear case
    3. Key factors to watch
    4. Important risks

    Keep the analysis under 300 words.
    `;

  const result = await model.generateContent(prompt);

  return result.response.text();
}