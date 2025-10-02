
import { GoogleGenAI } from "@google/genai";
import { PanelData } from "../types";

const API_KEY = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const summarizeDifferences = async (panels: PanelData[]): Promise<string> => {
  if (panels.length < 2) {
    return "At least two text panels are needed for a summary.";
  }
  if (!API_KEY) {
      return "Gemini API Key is not configured. Cannot summarize differences.";
  }

  const baseText = panels[0].text;
  const otherPanelsContent = panels.slice(1).map((panel) => {
    return `--- ${panel.title} ---\n${panel.text}`;
  }).join('\n\n');

  const prompt = `
    You are an expert code and text diff analyzer.
    Your task is to provide a concise, high-level summary of the differences between the following texts.
    The first text is the original base version. The subsequent texts are modifications of the base.
    Focus on the nature of the changes (e.g., "function X was refactored", "a new paragraph about Y was added", "spelling corrections were made").
    Do not repeat the text verbatim. Provide a bulleted list of key changes.

    --- ${panels[0].title} ---\n
    ${baseText}

    ${otherPanelsContent}

    --- Summary of Differences ---
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error summarizing differences with Gemini API:", error);
    if (error instanceof Error) {
        return `An error occurred while generating the summary: ${error.message}`;
    }
    return "An unknown error occurred while generating the summary.";
  }
};
