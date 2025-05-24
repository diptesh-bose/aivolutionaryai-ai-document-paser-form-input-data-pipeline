
import React, { useState, useCallback } from 'react';
import DocumentParserView from './components/views/DocumentParserView';
import ParserTemplatesPage from './components/pages/ParserTemplatesPage';
import { APP_TITLE } from './constants';
import { Bot, FileText, LayoutGrid, Github } from 'lucide-react';

type Page = 'parser' | 'templates';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('parser');

  const renderPage = () => {
    switch (currentPage) {
      case 'parser':
        return <DocumentParserView />;
      case 'templates':
        return <ParserTemplatesPage />;
      default:
        return <DocumentParserView />;
    }
  };

  const commonButtonClass = "flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors duration-150";
  const activeButtonClass = "bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100 focus:ring-indigo-500";
  const inactiveButtonClass = "text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-slate-500";
  
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Bot size={32} className="text-indigo-600 dark:text-indigo-400" />
              <h1 className="ml-3 text-2xl font-bold text-slate-800 dark:text-slate-100 hidden sm:block">
                {APP_TITLE}
              </h1>
            </div>
            <nav className="flex space-x-2 sm:space-x-4">
              <button
                onClick={() => setCurrentPage('parser')}
                className={`${commonButtonClass} ${currentPage === 'parser' ? activeButtonClass : inactiveButtonClass}`}
                aria-current={currentPage === 'parser' ? 'page' : undefined}
              >
                <FileText size={18} className="mr-2" />
                Document Parser
              </button>
              <button
                onClick={() => setCurrentPage('templates')}
                className={`${commonButtonClass} ${currentPage === 'templates' ? activeButtonClass : inactiveButtonClass}`}
                aria-current={currentPage === 'templates' ? 'page' : undefined}
              >
                <LayoutGrid size={18} className="mr-2" />
                Manage Templates
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        {renderPage()}
      </main>

      <footer className="py-6 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        <p>&copy; {new Date().getFullYear()} AI Document Solutions. Powered by Gemini.</p>
        <a 
            href="https://github.com/GoogleCloudPlatform/generative-ai-docs/tree/main/demos/palm/javascript/ai-document-parser" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
        >
            <Github size={16} className="mr-1" />
            View on GitHub
        </a>
      </footer>
    </div>
  );
};

export default App;
