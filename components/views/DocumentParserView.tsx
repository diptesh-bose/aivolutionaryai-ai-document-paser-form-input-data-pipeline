
import React, { useState, useCallback, useEffect } from 'react';
import FileUpload from '../FileUpload';
import DataEntryForm from '../DataEntryForm';
import LoadingSpinner from '../LoadingSpinner';
import { extractDataFromDocument } from '../../services/geminiService';
import * as TemplateService from '../../services/templateService';
import { FormData as AppFormData, ExtractedData, FormFieldDefinition, ParserTemplate } from '../../types';
// Fix: Import ACCEPTED_FILE_TYPES_EXTRACTION
import { DEFAULT_FORM_SCHEMA, ACCEPTED_FILE_TYPES_EXTRACTION, DEFAULT_PARSER_TEMPLATE_ID } from '../../constants';
import { Bot, FileWarning, CheckCircle2, Info, Settings2 } from 'lucide-react';

const DocumentParserView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);
  
  const [parserTemplates, setParserTemplates] = useState<ParserTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>(DEFAULT_PARSER_TEMPLATE_ID);
  const [formSchema, setFormSchema] = useState<FormFieldDefinition[]>(DEFAULT_FORM_SCHEMA);
  
  const [formData, setFormData] = useState<AppFormData>({});
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    const templates = TemplateService.getParserTemplates();
    setParserTemplates(templates);
    // Set initial schema based on activeTemplateId (which defaults to default)
    const currentTemplate = templates.find(t => t.id === activeTemplateId) || 
                            (activeTemplateId === DEFAULT_PARSER_TEMPLATE_ID ? {id: DEFAULT_PARSER_TEMPLATE_ID, name: "Default Invoice Parser", schema: DEFAULT_FORM_SCHEMA} : null);
    if (currentTemplate) {
        setFormSchema(currentTemplate.schema);
    } else {
        setFormSchema(DEFAULT_FORM_SCHEMA); // Fallback
    }
  }, []);


  // Update form schema and reset form data when active template changes
  useEffect(() => {
    const selectedTemplate = 
      activeTemplateId === DEFAULT_PARSER_TEMPLATE_ID 
      ? { id: DEFAULT_PARSER_TEMPLATE_ID, name: "Default Invoice Parser", schema: DEFAULT_FORM_SCHEMA }
      : parserTemplates.find(t => t.id === activeTemplateId);

    if (selectedTemplate) {
      setFormSchema(selectedTemplate.schema);
      const initialFormData: AppFormData = {};
      selectedTemplate.schema.forEach(field => {
        initialFormData[field.id] = ''; 
      });
      setFormData(initialFormData);
      setExtractedData(null); // Clear previous extraction results
      setErrorMessage(null);
      setSuccessMessage(`Switched to '${selectedTemplate.name}' template.`);
    }
  }, [activeTemplateId, parserTemplates]);


  const handleFileSelect = useCallback((file: File, content: string, mimeType: string) => {
    setSelectedFile(file);
    setFileContent(content);
    setFileMimeType(mimeType);
    setErrorMessage(null);
    setSuccessMessage(null);
    setExtractedData(null);
    const initialFormData: AppFormData = {};
    formSchema.forEach(field => { // Use current formSchema
      initialFormData[field.id] = ''; 
    });
    setFormData(initialFormData);
  }, [formSchema]);

  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setFileContent(null);
    setFileMimeType(null);
    setExtractedData(null);
    const initialFormData: AppFormData = {};
    formSchema.forEach(field => {
      initialFormData[field.id] = ''; 
    });
    setFormData(initialFormData);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [formSchema]);

  const handleParseDocument = useCallback(async () => {
    if (!fileContent || !fileMimeType) {
      setErrorMessage("No file content to parse.");
      return;
    }
    if (!formSchema || formSchema.length === 0) {
      setErrorMessage("No form schema loaded. Please select a valid parser template.");
      return;
    }

    setIsLoading(true);
    setIsParsing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await extractDataFromDocument(fileContent, fileMimeType, formSchema);
      setExtractedData(data);
      const newFormData: AppFormData = {};
      formSchema.forEach(field => {
        newFormData[field.id] = data[field.id] !== undefined ? data[field.id] : '';
      });
      setFormData(newFormData);
      setSuccessMessage("Document parsed successfully! Review the form below.");
    } catch (error) {
      console.error("Parsing error:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred during parsing.");
      setExtractedData(null);
    } finally {
      setIsLoading(false);
      setIsParsing(false);
    }
  }, [fileContent, fileMimeType, formSchema]);

  const handleFormDataChange = useCallback((fieldName: string, value: string | number) => {
    setFormData(prevData => ({
      ...prevData,
      [fieldName]: value,
    }));
  }, []);

  const handleFormSubmit = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    console.log("Form Data Submitted:", formData);
    setTimeout(() => {
      setSuccessMessage("Data saved successfully (logged to console).");
      setIsLoading(false);
    }, 1000);
  }, [formData]);

  const handleFormReset = useCallback(() => {
      const initialFormData: AppFormData = {};
      if (extractedData) {
        formSchema.forEach(field => {
            initialFormData[field.id] = extractedData[field.id] !== undefined ? extractedData[field.id] : '';
        });
      } else {
        formSchema.forEach(field => {
            initialFormData[field.id] = '';
        });
      }
      setFormData(initialFormData);
      setSuccessMessage("Form has been reset to extracted data (or blank if no extraction).");
      setErrorMessage(null);
  }, [extractedData, formSchema]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 sm:text-4xl flex items-center justify-center">
                <Bot size={38} className="mr-3 text-indigo-500 dark:text-indigo-400" />
                AI Document Processor
            </h1>
            <p className="mt-2 text-md text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                Select a parser template, upload your document, and let AI extract the data.
            </p>
        </div>

      {errorMessage && (
        <div className="bg-red-100 dark:bg-red-800 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200 p-4 rounded-md shadow" role="alert">
          <div className="flex"><div className="py-1"><FileWarning className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" /></div><div><p className="font-bold">Error</p><p className="text-sm">{errorMessage}</p></div></div>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 dark:bg-green-800 border-l-4 border-green-500 dark:border-green-400 text-green-700 dark:text-green-200 p-4 rounded-md shadow" role="alert">
          <div className="flex"><div className="py-1"><CheckCircle2 className="h-6 w-6 text-green-500 dark:text-green-400 mr-3" /></div><div><p className="font-bold">Success</p><p className="text-sm">{successMessage}</p></div></div>
        </div>
      )}

      {!process.env.API_KEY && (
           <div className="bg-yellow-100 dark:bg-yellow-700 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-700 dark:text-yellow-200 p-4 rounded-md shadow" role="alert">
              <div className="flex"><div className="py-1"><Info className="h-6 w-6 text-yellow-500 dark:text-yellow-400 mr-3" /></div><div><p className="font-bold">API Key Missing</p><p className="text-sm">The Gemini API key is not configured. AI functionality will not work. Please set the <code>API_KEY</code> environment variable.</p></div></div>
          </div>
      )}

      <section aria-labelledby="template-selection-heading" className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
        <h2 id="template-selection-heading" className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center">
            <Settings2 size={20} className="mr-2 text-indigo-600 dark:text-indigo-400" />
            Select Parser Template
        </h2>
        <select
          value={activeTemplateId}
          onChange={(e) => setActiveTemplateId(e.target.value)}
          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
          aria-label="Select a parser template"
        >
          <option value={DEFAULT_PARSER_TEMPLATE_ID}>Default Invoice Parser</option>
          {parserTemplates.map(template => (
            <option key={template.id} value={template.id}>{template.name}</option>
          ))}
        </select>
        {parserTemplates.length === 0 && activeTemplateId !== DEFAULT_PARSER_TEMPLATE_ID && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">No custom templates found. You can create templates in the 'Manage Templates' section.</p>
        )}
      </section>

      <section aria-labelledby="file-upload-heading">
        <h2 id="file-upload-heading" className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-1 sr-only">
          Upload Document for Extraction
        </h2>
        <FileUpload 
            onFileSelect={handleFileSelect} 
            isLoading={isLoading || isParsing} 
            clearFile={clearSelectedFile}
            currentFile={selectedFile}
            // Fix: Pass acceptedFileTypes and a description for extraction
            acceptedFileTypes={ACCEPTED_FILE_TYPES_EXTRACTION}
            acceptedFileTypesDescription="PDF, Images (JPG, PNG, WEBP) or Text (TXT)"
        />
      </section>

      {selectedFile && (
        <section className="text-center mt-4">
          <button
            onClick={handleParseDocument}
            disabled={isParsing || isLoading || !process.env.API_KEY || !formSchema || formSchema.length === 0}
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 transition-colors duration-150 flex items-center justify-center mx-auto"
          >
            {isParsing ? (<><LoadingSpinner size="w-5 h-5" color="text-white" className="mr-2" />Parsing Document...</>) : ("Parse Document with AI")}
          </button>
        </section>
      )}

      {isParsing && (
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg mt-8">
          <LoadingSpinner size="w-12 h-12" />
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">AI is analyzing your document. Please wait...</p>
        </div>
      )}

      {extractedData && !isParsing && formSchema.length > 0 && (
        <section aria-labelledby="data-entry-form-heading" className="mt-8">
          <h2 id="data-entry-form-heading" className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-1 sr-only">
            Review and Edit Extracted Data
          </h2>
          <DataEntryForm
            schema={formSchema}
            formData={formData}
            onDataChange={handleFormDataChange}
            onSubmit={handleFormSubmit}
            onReset={handleFormReset}
            isProcessing={isLoading && !isParsing}
            title={`Extracted Data using "${parserTemplates.find(t=>t.id === activeTemplateId)?.name || (activeTemplateId === DEFAULT_PARSER_TEMPLATE_ID ? "Default" : "Selected")} Parser"`}
          />
        </section>
      )}
       {(!extractedData && !isParsing && selectedFile && formSchema.length === 0) && (
         <p className="text-center text-yellow-600 dark:text-yellow-400 mt-4">Selected template has an empty schema. Cannot display form.</p>
       )}
    </div>
  );
};

export default DocumentParserView;
