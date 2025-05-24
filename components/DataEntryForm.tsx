
import React from 'react';
import { FormFieldDefinition, FormData } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { Save, RotateCcw, Download } from 'lucide-react'; // Added Download icon

interface DataEntryFormProps {
  schema: FormFieldDefinition[];
  formData: FormData;
  onDataChange: (fieldName: string, value: string | number) => void;
  onSubmit: () => void;
  onReset?: () => void; // Optional reset functionality
  isProcessing: boolean; // For submit button loading state
  title?: string;
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({
  schema,
  formData,
  onDataChange,
  onSubmit,
  onReset,
  isProcessing,
  title = "Extracted Information"
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleSaveAsJson = () => {
    if (Object.keys(formData).length === 0) {
      alert("No data to save."); // Or provide a more subtle notification
      return;
    }
    try {
      const jsonString = JSON.stringify(formData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `form_data_${new Date().toISOString().split('T')[0]}.json`; // e.g., form_data_2023-10-27.json
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error saving data as JSON:", error);
      alert("Failed to save data as JSON. See console for details.");
    }
  };

  const renderField = (field: FormFieldDefinition) => {
    const commonProps = {
      id: field.id,
      name: field.id,
      value: formData[field.id] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        onDataChange(field.id, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value),
      placeholder: field.placeholder || '',
      required: field.required || false,
      className: "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm disabled:opacity-50",
      disabled: isProcessing,
    };

    switch (field.type) {
      case 'textarea':
        return <textarea {...commonProps} rows={3} />;
      case 'date':
      case 'email':
      case 'tel':
      case 'number':
      case 'text':
        return <input type={field.type} {...commonProps} />;
      default:
        return <p className="text-red-500">Unsupported field type: {field.type}</p>;
    }
  };

  const isFormDataEmpty = Object.keys(formData).length === 0 || Object.values(formData).every(val => val === '' || val === undefined);

  return (
    <div className="w-full p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-100">{title}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {schema.map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
          {onReset && (
             <button
                type="button"
                onClick={onReset}
                disabled={isProcessing || isFormDataEmpty}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 disabled:opacity-50"
              >
              <RotateCcw size={18} className="mr-2" />
              Reset Form
            </button>
          )}
           <button
            type="button"
            onClick={handleSaveAsJson}
            disabled={isProcessing || isFormDataEmpty}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-sky-500 dark:border-sky-400 rounded-md shadow-sm text-sm font-medium text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-slate-800 disabled:opacity-50"
          >
            <Download size={18} className="mr-2" />
            Save as JSON
          </button>
          <button
            type="submit"
            disabled={isProcessing || isFormDataEmpty}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="w-5 h-5" color="text-white" className="mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save Data
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DataEntryForm;
