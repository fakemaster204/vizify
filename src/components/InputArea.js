import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';

function InputArea({ onGenerate, isProcessing, visualizationCode, onCodeChange, currentGlobalInputMode, onSetGlobalInputMode }) {
  const [inputType, setInputType] = useState(currentGlobalInputMode);
  const [prompt, setPrompt] = useState('');
  const [mermaidInput, setMermaidInput] = useState('');

  useEffect(() => {
    setInputType(currentGlobalInputMode);
  }, [currentGlobalInputMode]);

  const handleGenerateClick = () => {
    if (onGenerate) {
      const content = inputType === 'text' ? prompt : mermaidInput;
      onGenerate(content, inputType);
    }
  };

  const handleTabClick = (newMode) => {
    setInputType(newMode);
    if (onSetGlobalInputMode) {
      onSetGlobalInputMode(newMode);
    }
  };

  const commonTextareaStyles = "w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 smooth-transition text-sm";
  const activeTabStyles = "bg-sky-500 text-white shadow-md";
  const inactiveTabStyles = "bg-slate-200 hover:bg-slate-300 text-slate-700 hover:shadow-sm";
  const tabButtonBaseStyles = "px-4 py-2.5 text-sm font-medium smooth-transition focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const commonActionButtonStyles = "font-medium py-2.5 px-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 smooth-transition disabled:opacity-60 disabled:cursor-not-allowed w-full hover:scale-105";
  const generateButtonStyles = `bg-green-500 hover:bg-green-600 text-white focus:ring-green-400 ${commonActionButtonStyles}`;


  return (
    <div className="bg-white p-5 rounded-lg shadow-xl flex flex-col h-full">
      {/* Tabs */}
      <div className="flex mb-4 rounded-lg shadow-sm border border-slate-300 overflow-hidden">
        <button
          className={`${tabButtonBaseStyles} rounded-l-md ${inputType === 'text' ? activeTabStyles : inactiveTabStyles} ${isProcessing ? 'cursor-not-allowed' : ''}`}
          onClick={() => handleTabClick('text')}
          disabled={isProcessing}
        >
          Text Prompt
        </button>
        <button
          className={`${tabButtonBaseStyles} border-l border-r border-slate-300 ${inputType === 'mermaid' ? activeTabStyles : inactiveTabStyles} ${isProcessing ? 'cursor-not-allowed' : ''}`}
          onClick={() => handleTabClick('mermaid')}
          disabled={isProcessing}
        >
          Mermaid
        </button>
        <button
          className={`${tabButtonBaseStyles} rounded-r-md ${inputType === 'manual' ? activeTabStyles : inactiveTabStyles} ${isProcessing ? 'cursor-not-allowed' : ''}`}
          onClick={() => handleTabClick('manual')}
          disabled={isProcessing}
        >
          Manual Code
        </button>
      </div>

      {/* Content Area */}
      <div className={`flex-grow flex flex-col ${inputType !== 'manual' ? 'space-y-4' : ''} tab-content-active`}>
        {inputType === 'text' && (
          <div className="h-full flex flex-col">
            <label htmlFor="textPrompt" className="text-sm font-medium text-slate-600 mb-1">Describe your visualization:</label>
            <textarea
              id="textPrompt"
              className={`${commonTextareaStyles} flex-grow min-h-[150px] ${isProcessing ? 'bg-slate-200 cursor-not-allowed' : 'bg-white'}`}
              placeholder="e.g., 'A red ball bouncing under a blue sky with clouds'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        )}

        {inputType === 'mermaid' && (
          <div className="h-full flex flex-col">
            <label htmlFor="mermaidCode" className="text-sm font-medium text-slate-600 mb-1">Enter Mermaid diagram syntax:</label>
            <textarea
              id="mermaidCode"
              className={`${commonTextareaStyles} font-mono text-xs flex-grow min-h-[150px] ${isProcessing ? 'bg-slate-200 cursor-not-allowed' : 'bg-white'}`}
              placeholder={`graph TD;\n  A[Start] --> B{Is it?};\n  B -- Yes --> C[OK];\n  B -- No --> D[Not OK];`}
              value={mermaidInput}
              onChange={(e) => setMermaidInput(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        )}
        
        {inputType !== 'manual' && (
          <button
            className={`${generateButtonStyles} mt-auto`} // mt-auto pushes button to bottom if space allows
            onClick={handleGenerateClick}
            disabled={isProcessing || (inputType === 'text' && !prompt.trim()) || (inputType === 'mermaid' && !mermaidInput.trim())}
          >
            {isProcessing ? 'Processing...' : 'Generate'}
          </button>
        )}

        {inputType === 'manual' && (
          <div className="flex-grow flex flex-col h-full"> {/* Ensure this div takes height */}
            <label className="text-sm font-medium text-slate-600 mb-1">Live HTML/CSS/JS Editor:</label>
            <div className="flex-grow h-full rounded-md overflow-hidden border border-slate-300 shadow-sm"> {/* Explicit height for CodeMirror parent */}
              <CodeEditor
                value={visualizationCode}
                onChange={onCodeChange}
                mode="htmlmixed"
                readOnly={isProcessing} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InputArea;
