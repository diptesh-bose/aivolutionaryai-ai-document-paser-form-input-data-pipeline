
import { ParserTemplate, FormFieldDefinition } from '../types';
import { v4 as uuidv4 } from 'uuid';

const TEMPLATES_STORAGE_KEY = 'parserTemplates_v2'; // Incremented version to avoid conflicts with old structure if any

export const getParserTemplates = (): ParserTemplate[] => {
  try {
    const templatesJson = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (templatesJson) {
      const parsed = JSON.parse(templatesJson);
      // Basic validation
      if (Array.isArray(parsed) && parsed.every(t => t.id && t.name && Array.isArray(t.schema))) {
        return parsed;
      }
    }
    return [];
  } catch (error) {
    console.error("Error loading parser templates from localStorage:", error);
    return [];
  }
};

export const saveParserTemplate = (name: string, schema: FormFieldDefinition[], id?: string): ParserTemplate => {
  const templates = getParserTemplates();
  let templateToSave: ParserTemplate;

  if (id) { // Update existing template
    const existingIndex = templates.findIndex(t => t.id === id);
    if (existingIndex > -1) {
      templates[existingIndex] = { ...templates[existingIndex], name, schema };
      templateToSave = templates[existingIndex];
    } else {
      // If ID provided but not found, treat as new (or throw error)
      templateToSave = { id: uuidv4(), name, schema };
      templates.push(templateToSave);
    }
  } else { // Create new template
    templateToSave = {
      id: uuidv4(),
      name,
      schema,
    };
    templates.push(templateToSave);
  }
  
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    return templateToSave;
  } catch (error) {
    console.error("Error saving parser template to localStorage:", error);
    // Potentially re-throw or handle more gracefully depending on requirements
    throw new Error(`Failed to save template: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getParserTemplateById = (id: string): ParserTemplate | undefined => {
  const templates = getParserTemplates();
  return templates.find(template => template.id === id);
};

export const deleteParserTemplate = (id: string): boolean => {
  let templates = getParserTemplates();
  const initialLength = templates.length;
  templates = templates.filter(template => template.id !== id);
  if (templates.length < initialLength) {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
      return true;
    } catch (error) {
      console.error("Error deleting parser template from localStorage:", error);
      return false;
    }
  }
  return false; // Template not found
};
