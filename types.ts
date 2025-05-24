
export interface FormFieldDefinition {
  id: string; // Used as key and for data object
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'number';
  placeholder?: string;
  required?: boolean;
}

// Dynamically created based on FormFieldDefinition ids
export type FormData = {
  [key: string]: string | number | undefined;
};

// Structure expected from Gemini after parsing
export type ExtractedData = FormData;

export interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface ParserTemplate {
  id: string;
  name: string;
  schema: FormFieldDefinition[];
  // systemInstruction?: string; // Optional: For future if extraction prompt itself is templated
}
