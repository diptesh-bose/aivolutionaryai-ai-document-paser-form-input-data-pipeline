
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Part, ExtractedData, FormFieldDefinition } from '../types';
import { GEMINI_MODEL_TEXT, GEMINI_EXTRACTION_SYSTEM_INSTRUCTION, GEMINI_SCHEMA_GENERATION_SYSTEM_INSTRUCTION } from '../constants';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("API_KEY for Gemini is not set in environment variables. AI features will not work.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY || "NO_API_KEY_PROVIDED" });

function buildExtractionPrompt(formSchema: FormFieldDefinition[]): string {
  const fieldDescriptions = formSchema.map(field => 
    `  - "${field.id}": (${field.type}) ${field.label}${field.placeholder ? ' (e.g., ' + field.placeholder + ')' : ''}`
  ).join('\n');
  
  return `Based on the system instruction provided, extract the following fields from the document. Structure your response as a JSON object with keys corresponding to the "id" of each field:
Fields to extract:
${fieldDescriptions}

Your JSON Output:`;
}

export const extractDataFromDocument = async (
  documentContent: string, 
  documentMimeType: string,
  formSchema: FormFieldDefinition[]
): Promise<ExtractedData> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured. Please set the API_KEY environment variable.");
  }

  const parts: Part[] = [];
  if (documentMimeType.startsWith('image/') || documentMimeType === 'application/pdf') {
    parts.push({
      inlineData: {
        mimeType: documentMimeType,
        data: documentContent, 
      },
    });
  } else if (documentMimeType === 'text/plain') {
    parts.push({ text: documentContent });
  } else {
    throw new Error(`Unsupported document type for extraction: ${documentMimeType}`);
  }
  
  const extractionUserPrompt = buildExtractionPrompt(formSchema);
  parts.push({ text: extractionUserPrompt });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: { parts: parts },
        config: {
          systemInstruction: GEMINI_EXTRACTION_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    try {
      const parsedData = JSON.parse(jsonStr) as ExtractedData;
      const finalData: ExtractedData = {};
      formSchema.forEach(field => {
        finalData[field.id] = parsedData[field.id] !== undefined ? parsedData[field.id] : '';
      });
      return finalData;
    } catch (e) {
      console.error("Failed to parse JSON response from Gemini for extraction:", e, "Raw response:", jsonStr);
      throw new Error("AI failed to return valid JSON for data extraction. Raw: " + jsonStr.substring(0, 200) + "...");
    }
  } catch (error) {
    console.error("Error calling Gemini API for extraction:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error (Extraction): ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the AI service for extraction.");
  }
};

export const generateSchemaFromSampleDocument = async (
  documentContent: string, // Base64 string for PDF
  documentMimeType: string // Should be 'application/pdf'
): Promise<FormFieldDefinition[]> => {
  if (!API_KEY) {
    throw new Error("Gemini API Key is not configured.");
  }
  if (documentMimeType !== 'application/pdf') { 
    throw new Error("Schema generation currently only supports PDF files.");
  }

  const parts: Part[] = [
    {
      inlineData: {
        mimeType: documentMimeType,
        data: documentContent,
      },
    },
    // The main instruction is now in systemInstruction
    { text: "Analyze this document and generate the form field schema as per your detailed system instructions." } 
  ];

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT, 
      contents: { parts: parts },
      config: {
        systemInstruction: GEMINI_SCHEMA_GENERATION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2, // Lower temperature for more deterministic schema generation
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    try {
      const parsedSchema = JSON.parse(jsonStr) as FormFieldDefinition[];
      if (!Array.isArray(parsedSchema) || parsedSchema.some(field => !field.id || !field.label || !field.type)) {
          console.error("Generated schema is not in the expected format:", parsedSchema);
          throw new Error("AI returned an invalid schema structure. Ensure the PDF is clear and machine-readable.");
      }
      // Sanitize IDs to be valid camelCase
      return parsedSchema.map(field => ({
        ...field,
        id: field.id.replace(/[^a-zA-Z0-9_]/g, '').replace(/^\d+/, '').replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      }));
    } catch (e) {
      console.error("Failed to parse JSON schema response from Gemini:", e, "Raw response:", jsonStr);
      throw new Error("AI failed to return valid JSON for schema. Raw: " + jsonStr.substring(0, 200) + "...");
    }
  } catch (error) {
    console.error("Error calling Gemini API for schema generation:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API Error (Schema Generation): ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the schema via AI.");
  }
};
