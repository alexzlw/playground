import React, { useState } from 'react';
import Dropzone from './components/Dropzone';
import ResultsTable from './components/ResultsTable';
import { FileJob } from './types';
import { generateId } from './utils';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [jobs, setJobs] = useState<FileJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ total: 0, completed: 0 });

  const handleFilesSelected = async (files: File[]) => {
    const newJobs: FileJob[] = files.map(file => ({
      id: generateId(),
      fileName: file.name,
      file: file,
      imageUrl: URL.createObjectURL(file),
      status: 'pending',
      results: []
    }));

    setJobs(prev => [...prev, ...newJobs]);
    setProgress(prev => ({ total: prev.total + files.length, completed: prev.completed }));
    
    // Trigger processing for the new batch
    processJobs(newJobs);
  };

  const processJobs = async (newJobs: FileJob[]) => {
    if (newJobs.length === 0) return;
    
    setIsProcessing(true);
    // Increased concurrency to improve performance
    const CONCURRENCY = 10;

    const processItem = async (job: FileJob) => {
      try {
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j));
        
        const response = await geminiService.extractDataFromImage(job.file);
        
        setJobs(prev => prev.map(j => {
           if (j.id === job.id) {
             return {
               ...j,
               status: 'success',
               results: response.items
             };
           }
           return j;
        }));

      } catch (error) {
        console.error(`Error processing ${job.fileName}`, error);
        const errorMsg = error instanceof Error ? error.message : 'Analysis failed';
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error', errorMessage: errorMsg } : j));
      } finally {
        setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
      }
    };

    // Run in batches
    for (let i = 0; i < newJobs.length; i += CONCURRENCY) {
      const batch = newJobs.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(job => processItem(job)));
    }

    setIsProcessing(false);
    setTimeout(() => alert("処理が完了しました。"), 100);
  };

  const clearAll = () => {
    // Directly clear without confirmation to fix responsiveness issues
    jobs.forEach(j => {
      if (j.imageUrl) URL.revokeObjectURL(j.imageUrl);
    });
    setJobs([]);
    setProgress({ total: 0, completed: 0 });
  };

  return (
    <div className="min-h-screen bg-darker text-slate-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            80万目指し隊専用ツール
          </h1>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <Dropzone onFilesSelected={handleFilesSelected} disabled={isProcessing} />
          
          {progress.total > 0 && (
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${Math.min((progress.completed / progress.total) * 100, 100)}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Results Area */}
        {jobs.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-end">
                <button 
                  onClick={clearAll}
                  disabled={isProcessing}
                  className="
                    px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 
                    border border-red-900/50 rounded-lg text-sm transition-all
                    disabled:opacity-30 disabled:cursor-not-allowed
                    flex items-center gap-2
                  "
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  結果をすべてクリア
                </button>
            </div>
            <ResultsTable jobs={jobs} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;