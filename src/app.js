import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import InputArea from './components/InputArea';
import PreviewPanel from './components/PreviewPanel';
import DownloadButton from './components/DownloadButton';
import './styles.css'; // Ensure this is imported

function App() {
  const [visualizationCode, setVisualizationCode] = useState('<p class="text-center p-4 text-slate-500">Enter a prompt, Mermaid code, or switch to Manual Code and start editing!</p>');
  const [currentInputMode, setCurrentInputMode] = useState('text'); // 'text', 'mermaid', or 'manual'
  const [isProcessing, setIsProcessing] = useState(false); // Unified loading state
  const [processingMessage, setProcessingMessage] = useState(''); // Message for loading overlay


  const handleGenerateVisualization = (content, inputMode) => {
    setCurrentInputMode(inputMode); 
    setIsProcessing(true);
    setProcessingMessage(inputMode === 'mermaid' ? 'Generating diagram...' : 'Generating visualization...');
    
    // Simulate async generation
    setTimeout(() => {
      let generatedCode = '';
      if (inputMode === 'text') {
        const lowerCasePrompt = content.toLowerCase();
        if (lowerCasePrompt.includes('red bouncing ball')) {
          generatedCode = `
            <style>
              body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 90vh; background-color: #f8fafc; /* Tailwind slate-50 */ }
              @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-25px); } }
              .red-ball { width: 60px; height: 60px; background-color: #ef4444; /* Tailwind red-500 */ border-radius: 50%; animation: bounce 1.2s infinite ease-in-out; margin: 20px auto; display: block; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); }
            </style>
            <div class="red-ball"></div>
            <p class="text-center text-sm text-slate-600 mt-2">Red Bouncing Ball</p>
          `;
        } else if (lowerCasePrompt.includes('blue square')) {
          generatedCode = `
            <style>
              body { margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 90vh; background-color: #f8fafc; }
              .blue-square { width: 60px; height: 60px; background-color: #3b82f6; /* Tailwind blue-500 */ margin: 20px auto; display: block; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); border-radius: 0.25rem; }
            </style>
            <div class="blue-square"></div>
            <p class="text-center text-sm text-slate-600 mt-2">Blue Square</p>
          `;
        } else {
          generatedCode = "<p class='text-center text-red-500 p-4'>Could not understand the text prompt. Try 'red bouncing ball' or 'blue square'.</p>";
        }
      } else if (inputMode === 'mermaid') {
        generatedCode = `<div class="mermaid" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">${content}</div>`;
      }
      
      if (inputMode !== 'manual') {
          setVisualizationCode(generatedCode);
      }
      setIsProcessing(false);
      setProcessingMessage('');
    }, 1200);
  };

  const handleCodeChangeFromEditor = (newCode) => {
    setVisualizationCode(newCode);
  };

  const handleSetCurrentInputMode = (newMode) => {
    setCurrentInputMode(newMode);
    // Clear initial message when user switches to manual mode for the first time
    if (newMode === 'manual' && visualizationCode.startsWith('<p class="text-center p-4 text-slate-500">')) {
      setVisualizationCode('<!-- Start coding your HTML, CSS (in <style> tags), and JS (in <script> tags) here! -->\n\n<div class="bg-white p-6 rounded-lg shadow-md">\n  <h1 class="text-2xl font-bold text-slate-700">Hello World!</h1>\n  <p class="text-slate-600 mt-2">Edit this code to see live updates.</p>\n</div>\n\n<style>\n  body {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    min-height: 90vh;\n    background-color: #e2e8f0; /* Tailwind slate-200 */\n  }\n</style>');
    }
  };

  const handleRefineWithAI = () => {
    if (!visualizationCode || visualizationCode.startsWith('<p class="text-center p-4">')) {
      alert("Please generate or write some code first!");
      return;
    }
    
    setIsProcessing(true);
    setProcessingMessage('Refining with AI...');

    setTimeout(() => {
      let refinedCode = visualizationCode;
      const effectiveModeForRefinement = currentInputMode === 'manual' ? 'text' : currentInputMode;

      if (effectiveModeForRefinement === 'text') {
        const comment = "<!-- AI Refinement: Enhanced styling and structure -->\n";
        const styleRegex = /<style>([\s\S]*?)<\/style>/;
        const styleMatch = refinedCode.match(styleRegex);
        let newStyles = "body { font-family: 'Inter', sans-serif; box-shadow: 0 0 15px rgba(0,0,0,0.15); padding: 1rem; }";

        if (styleMatch && styleMatch[1]) {
          refinedCode = refinedCode.replace(styleRegex, `<style>\n  /* Added by AI */\n  ${newStyles}\n  ${styleMatch[1]}\n</style>`);
        } else {
          refinedCode = `${comment}<style>\n  ${newStyles}\n</style>\n` + refinedCode;
        }
      } else if (effectiveModeForRefinement === 'mermaid') {
        if (refinedCode.trim().startsWith('<div class="mermaid"')) {
            const comment = "%% AI Refinement: Enhanced diagram theme and layout %%\n";
            const mermaidDivRegex = /(<div class="mermaid"[^>]*>)([\s\S]*?)(<\/div>)/;
            refinedCode = refinedCode.replace(mermaidDivRegex, (match, openingTag, content, closingTag) => {
                let newContent = content;
                if (newContent.trim().startsWith('graph')) {
                    newContent = newContent + '\n%%{init: {"theme": "forest", "themeVariables": { "primaryColor": "#4ade80", "edgeLabelBackground":"#f0fdf4", "clusterBkg": "#dcfce7"}}}%%';
                }
                return `${openingTag}${comment}${newContent}${closingTag}`;
            });
        } else {
            alert("Refinement for Mermaid is only available if the code is a valid Mermaid diagram.");
            setIsProcessing(false);
            setProcessingMessage('');
            return;
        }
      }
      setVisualizationCode(refinedCode);
      setIsProcessing(false);
      setProcessingMessage('');
    }, 1500); 
  };

  const handleAddImage = () => {
    if (currentInputMode === 'mermaid' && !visualizationCode.trim().startsWith('<div class="mermaid"')) {
      alert("Adding images directly to Mermaid diagrams is not supported in this way.");
      return;
    }
    setIsProcessing(true);
    setProcessingMessage('Adding image from web...');

    setTimeout(() => {
      const imageUrl = `https://source.unsplash.com/random/400x200?sig=${Math.random()}`; // Random image from Unsplash
      const imageTag = `<img src="${imageUrl}" alt="AI Suggested Image" style="max-width: 100%; height: auto; margin-top: 1rem; display: block; margin-left: auto; margin-right: auto; border-radius: 0.375rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">`;

      let newCode;
      if (!visualizationCode || visualizationCode.startsWith('<p class="text-center p-4">') || visualizationCode.includes('<!-- Start coding your HTML')) {
        newCode = `<div style="text-align: center; padding: 1rem;">${imageTag}</div>`;
      } else {
        newCode = visualizationCode + `\n${imageTag}`;
      }
      
      setVisualizationCode(newCode);
      setIsProcessing(false);
      setProcessingMessage('');
    }, 1200); 
  };

  const commonButtonStyles = "font-medium py-2.5 px-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 smooth-transition disabled:opacity-60 disabled:cursor-not-allowed";
  const primaryButtonStyles = `bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-400 ${commonButtonStyles}`;
  const secondaryButtonStyles = `bg-purple-500 hover:bg-purple-600 text-white focus:ring-purple-400 ${commonButtonStyles}`;
  const tertiaryButtonStyles = `bg-teal-500 hover:bg-teal-600 text-white focus:ring-teal-400 ${commonButtonStyles}`;


  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8">
      <header className="mb-6 md:mb-8 text-center">
        <h1 className="text-4xl lg:text-5xl font-bold text-slate-700">
          Live Coder & <span className="text-sky-500">Visualizer</span>
        </h1>
        <p className="mt-2 text-lg text-slate-500">
          Generate, edit, and visualize HTML, CSS, JS, and Mermaid diagrams instantly.
        </p>
      </header>

      {/* Main content grid */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8" style={{ minHeight: 'calc(100vh - 230px)' }}>
        <InputArea
          onGenerate={handleGenerateVisualization}
          isProcessing={isProcessing}
          visualizationCode={visualizationCode} 
          onCodeChange={handleCodeChangeFromEditor} 
          currentGlobalInputMode={currentInputMode} 
          onSetGlobalInputMode={handleSetCurrentInputMode} 
        />
        <div className="relative h-full flex flex-col rounded-lg shadow-xl overflow-hidden">
          <PreviewPanel code={visualizationCode} inputMode={currentInputMode} />
          {isProcessing && (
            <div className={`absolute inset-0 bg-slate-800 bg-opacity-80 flex items-center justify-center rounded-lg z-20 smooth-transition ${isProcessing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="text-center p-6">
                <svg className="animate-spin h-10 w-10 text-sky-400 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sky-100 text-xl font-semibold">
                  {processingMessage || 'Processing...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-6 md:mt-8 pt-6 border-t border-slate-300 text-center">
        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 mb-4">
          <button
            onClick={handleRefineWithAI}
            disabled={isProcessing || (!visualizationCode || visualizationCode.startsWith('<p class="text-center p-4">') || visualizationCode.includes('<!-- Start coding your HTML'))}
            className={`${secondaryButtonStyles} hover:scale-105`}
          >
            {isProcessing && processingMessage.includes('Refining') ? 'Refining...' : 'Refine with AI ✨'}
          </button>
          <button
            onClick={handleAddImage}
            disabled={isProcessing || (currentInputMode === 'mermaid' && !visualizationCode.trim().startsWith('<div class="mermaid"'))}
            className={`${tertiaryButtonStyles} hover:scale-105`}
          >
            {isProcessing && processingMessage.includes('Adding image') ? 'Adding...' : 'Add Image 🖼️'}
          </button>
          <DownloadButton 
            code={visualizationCode} 
            isMermaid={currentInputMode === 'mermaid' && visualizationCode.trim().startsWith('<div class="mermaid"')} 
            inputMode={currentInputMode} 
            commonButtonStyles={primaryButtonStyles} // Pass common styles
            disabled={isProcessing || (!visualizationCode || visualizationCode.startsWith('<p class="text-center p-4">') || visualizationCode.includes('<!-- Start coding your HTML'))}
          />
        </div>
        <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Live Coder. All rights reserved (not really).</p>
      </footer>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
