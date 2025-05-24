
import React, { useState, useEffect, useCallback } from 'react';
import FileUpload from '../FileUpload';
import LoadingSpinner from '../LoadingSpinner';
import { generateSchemaFromSampleDocument } from '../../services/geminiService';
import * as TemplateService from '../../services/templateService';
import { FormFieldDefinition, ParserTemplate } from '../../types';
// Fix: Import ACCEPTED_FILE_TYPES_SCHEMA_GENERATION
import { ACCEPTED_FILE_TYPES_SCHEMA_GENERATION, MAX_FILE_SIZE_MB } from '../../constants';
import { FilePlus, ListChecks, Trash2, Edit3, Save, XCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const ParserTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<ParserTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [sampleFileContent, setSampleFileContent] = useState<string | null>(null); // Base64
  const [sampleFileMimeType, setSampleFileMimeType] = useState<string | null>(null);
  const [generatedSchema, setGeneratedSchema] = useState<FormFieldDefinition[] | null>(null);

  const fetchTemplates = useCallback(() => {
    setTemplates(TemplateService.getParserTemplates());
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSampleFileSelect = (file: File, content: string, mimeType: string) => {
    clearMessages();
    setSampleFile(file);
    setSampleFileContent(content);
    setSampleFileMimeType(mimeType);
    setGeneratedSchema(null); // Clear previous schema if a new file is selected
  };
  
  const clearSampleFile = useCallback(() => {
    setSampleFile(null);
    setSampleFileContent(null);
    setSampleFileMimeType(null);
    setGeneratedSchema(null);
    // If FileUpload component's internal state needs clearing, it should handle it via its own clear logic
  }, []);

  const handleGenerateSchema = async () => {
    if (!sampleFileContent || !sampleFileMimeType) {
      setError("Please select a sample PDF file first.");
      return;
    }
    if (!newTemplateName.trim()) {
        setError("Please provide a name for the new template.");
        return;
    }
    clearMessages();
    setIsGeneratingSchema(true);
    try {
      const schema = await generateSchemaFromSampleDocument(sampleFileContent, sampleFileMimeType);
      setGeneratedSchema(schema);
      setSuccess(`Schema generated successfully for "${newTemplateName}". Review and save.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred while generating schema.");
      setGeneratedSchema(null);
    } finally {
      setIsGeneratingSchema(false);
    }
  };

  const handleSaveTemplate = () => {
    if (!generatedSchema || generatedSchema.length === 0) {
      setError("No schema generated or schema is empty. Cannot save.");
      return;
    }
    if (!newTemplateName.trim()) {
      setError("Template name is required.");
      return;
    }
    clearMessages();
    setIsLoading(true);
    try {
      TemplateService.saveParserTemplate(newTemplateName.trim(), generatedSchema);
      setSuccess(`Template "${newTemplateName.trim()}" saved successfully!`);
      fetchTemplates(); // Refresh list
      // Reset form
      setNewTemplateName('');
      clearSampleFile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      clearMessages();
      setIsLoading(true);
      try {
        const deleted = TemplateService.deleteParserTemplate(id);
        if(deleted) {
            setSuccess("Template deleted successfully.");
            fetchTemplates(); // Refresh list
        } else {
            setError("Could not find template to delete.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete template.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 sm:text-4xl flex items-center justify-center">
          <ListChecks size={38} className="mr-3 text-indigo-500 dark:text-indigo-400" />
          Manage Parser Templates
        </h1>
        <p className="mt-2 text-md text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
          Create custom parser templates by uploading a sample PDF. The AI will generate a form schema based on the document's structure.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-800 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200 p-4 rounded-md shadow flex items-center" role="alert">
          <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400 mr-3 flex-shrink-0" />
          <div><p className="font-bold">Error</p><p className="text-sm">{error}</p></div>
        </div>
      )}
      {success && (
        <div className="bg-green-100 dark:bg-green-800 border-l-4 border-green-500 dark:border-green-400 text-green-700 dark:text-green-200 p-4 rounded-md shadow flex items-center" role="alert">
          <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
          <div><p className="font-bold">Success</p><p className="text-sm">{success}</p></div>
        </div>
      )}
       {!process.env.API_KEY && (
           <div className="bg-yellow-100 dark:bg-yellow-700 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-700 dark:text-yellow-200 p-4 rounded-md shadow" role="alert">
              <div className="flex"><div className="py-1"><Info className="h-6 w-6 text-yellow-500 dark:text-yellow-400 mr-3" /></div><div><p className="font-bold">API Key Missing</p><p className="text-sm">The Gemini API key is not configured. AI features will not work. Please set the <code>API_KEY</code> environment variable.</p></div></div>
          </div>
      )}


      {/* Create New Template Section */}
      <section aria-labelledby="create-template-heading" className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl">
        <h2 id="create-template-heading" className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
          <FilePlus size={28} className="mr-3 text-indigo-600 dark:text-indigo-400" />
          Create New Template
        </h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Template Name
            </label>
            <input
              type="text"
              id="templateName"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="e.g., Supplier Invoice Type A"
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isGeneratingSchema || isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Upload Sample PDF
            </label>
            <FileUpload
              onFileSelect={handleSampleFileSelect}
              isLoading={isGeneratingSchema || isLoading}
              clearFile={clearSampleFile}
              currentFile={sampleFile}
              // Fix: Pass acceptedFileTypes and a description for schema generation
              acceptedFileTypes={ACCEPTED_FILE_TYPES_SCHEMA_GENERATION}
              acceptedFileTypesDescription="PDF documents for schema generation"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">The AI will analyze this PDF to suggest form fields. Max size: {MAX_FILE_SIZE_MB}MB.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
            <button
              onClick={handleGenerateSchema}
              disabled={!sampleFile || !newTemplateName.trim() || isGeneratingSchema || isLoading || !process.env.API_KEY}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isGeneratingSchema ? (
                <><LoadingSpinner size="w-5 h-5" color="text-white" className="mr-2" />Generating Schema...</>
              ) : (
                <><Edit3 size={18} className="mr-2" />Generate Schema from PDF</>
              )}
            </button>
            {generatedSchema && (
                 <button
                    onClick={handleSaveTemplate}
                    disabled={isLoading || isGeneratingSchema || !process.env.API_KEY}
                    className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                    {isLoading && !isGeneratingSchema ? (
                        <><LoadingSpinner size="w-5 h-5" color="text-white" className="mr-2" />Saving...</>
                    ) : (
                        <><Save size={18} className="mr-2" />Save Generated Template</>
                    )}
                </button>
            )}
          </div>
        </div>

        {generatedSchema && (
          <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Generated Schema Preview:</h3>
            <pre className="text-xs p-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md overflow-x-auto max-h-96">
              {JSON.stringify(generatedSchema, null, 2)}
            </pre>
             <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Review the schema above. If it looks good, save the template. You can refine the schema generation by adjusting the system prompt in constants.ts for more complex needs.</p>
          </div>
        )}
      </section>

      {/* Existing Templates Section */}
      <section aria-labelledby="existing-templates-heading" className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-xl">
        <h2 id="existing-templates-heading" className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center">
          <ListChecks size={28} className="mr-3 text-indigo-600 dark:text-indigo-400" />
          Existing Templates
        </h2>
        {templates.length > 0 ? (
          <ul className="space-y-4">
            {templates.map(template => (
              <li key={template.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-700/50 shadow-sm">
                <div>
                  <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">{template.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{template.schema.length} fields</p>
                  <details className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      <summary className="cursor-pointer hover:underline">View Schema</summary>
                      <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded max-h-48 overflow-auto">{JSON.stringify(template.schema, null, 2)}</pre>
                  </details>
                </div>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  disabled={isLoading}
                  className="mt-3 sm:mt-0 sm:ml-4 flex items-center px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                  aria-label={`Delete template ${template.name}`}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600 dark:text-slate-400">No custom templates created yet. Use the form above to create your first one!</p>
        )}
      </section>
    </div>
  );
};

export default ParserTemplatesPage;
