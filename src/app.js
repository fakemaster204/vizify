import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import InputArea from './components/InputArea';
import PreviewPanel from './components/PreviewPanel';
import DownloadButton from './components/DownloadButton';
import './styles.css'; // Ensure this is imported

// WARNING: Storing API keys directly in client-side code is insecure for production.
// This is for development purposes only, acknowledging the risk.
const GEMINI_API_KEY = 'AIzaSyAPz4JP3UCQTVTKJ_ggKWWL8_DR1LGsfo8';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-preview-05-20:generateContent';

function App() {
  const [visualizationCode, setVisualizationCode] = useState('<p class="text-center p-4 text-slate-500">Enter a prompt, Mermaid code, or switch to Manual Code and start editing!</p>');
  const [currentInputMode, setCurrentInputMode] = useState('text'); // 'text', 'mermaid', or 'manual'
  const [isProcessing, setIsProcessing] = useState(false); // Unified loading state
  const [processingMessage, setProcessingMessage] = useState(''); // Message for loading overlay
  const [originalCodeBeforeRefinement, setOriginalCodeBeforeRefinement] = useState('');
  const [activePrompt, setActivePrompt] = useState(''); // To store the current text prompt
  const [apiError, setApiError] = useState(null); // For displaying API errors


  const handleGenerateVisualization = async (content, inputMode, promptText) => { 
    setCurrentInputMode(inputMode);
    if(inputMode === 'text' && promptText) setActivePrompt(promptText);
    setApiError(null); // Clear previous errors
    
    if (inputMode === 'text') {
      setIsProcessing(true);
      setProcessingMessage('Generating with Gemini AI...');
      const previousCode = visualizationCode; // Save previous code in case of error
      setVisualizationCode('<p class="text-center p-4 text-slate-500">Generating visualization with AI, please wait...</p>'); 

      const promptData = {
        contents: [{
          parts: [{
            text: `You are a creative frontend developer. Generate a single HTML string (including embedded CSS in <style> tags and JavaScript in <script> tags if needed) to create a live visualization based on the following description: "${content}". The HTML should be self-contained and render directly in a browser preview. Ensure the visualization is engaging and visually appealing. If the request is vague, try to make a creative interpretation. Ensure the HTML, CSS and JS are valid. Do not use external libraries unless absolutely necessary and easy to load from a CDN. The visualization should be centered on the page and look good on a light background (e.g. #f8fafc).`
          }]
        }],
        generationConfig: {
          "temperature": 0.7,
          "topK": 40,
          "responseMimeType": "text/plain", 
        }
      };

      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(promptData),
        });

        if (response.ok) {
          const responseData = await response.json();
          if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content && responseData.candidates[0].content.parts && responseData.candidates[0].content.parts[0]) {
            let generatedHtml = responseData.candidates[0].content.parts[0].text;
            generatedHtml = generatedHtml.replace(/^```html\s*([\s\S]*?)\s*```$/, '$1').trim();
            generatedHtml = generatedHtml.replace(/^```\s*([\s\S]*?)\s*```$/, '$1').trim(); 
            setVisualizationCode(generatedHtml);
          } else {
            console.error('Error: Invalid response structure from Gemini API', responseData);
            setApiError("Error: Received invalid data from AI. Please check console.");
            setVisualizationCode(previousCode); // Revert to previous code
          }
        } else {
          const errorData = await response.json();
          console.error('Error generating visualization with AI:', response.status, errorData);
          setApiError(`Gemini API Error ${response.status}: ${errorData?.error?.message || 'Failed to generate visualization.'}`);
          setVisualizationCode(previousCode); // Revert to previous code
        }
      } catch (error) {
        console.error('Error calling Gemini API:', error);
        setApiError("Network Error: Could not connect to AI service. Please check your network.");
        setVisualizationCode(previousCode); // Revert to previous code
      } finally {
        setIsProcessing(false);
        setProcessingMessage('');
      }

    } else if (inputMode === 'mermaid') {
      setIsProcessing(true);
      setProcessingMessage('Generating diagram...');
      setTimeout(() => {
        const generatedCode = `<div class="mermaid" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">${content}</div>`;
        setVisualizationCode(generatedCode);
        setIsProcessing(false);
        setProcessingMessage('');
      }, 1200);
    } else if (inputMode === 'manual') {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleCodeChangeFromEditor = (newCode) => {
    setVisualizationCode(newCode);
    if (apiError) setApiError(null); // Clear error when user starts editing
  };

  const handleSetCurrentInputMode = (newMode) => {
    setCurrentInputMode(newMode);
    setApiError(null); // Clear error when changing mode
    if (newMode === 'manual' && visualizationCode.startsWith('<p class="text-center p-4 text-slate-500">')) {
      setVisualizationCode('<!-- Start coding your HTML, CSS (in <style> tags), and JS (in <script> tags) here! -->\n\n<div class="bg-white p-6 rounded-lg shadow-md">\n  <h1 class="text-2xl font-bold text-slate-700">Hello World!</h1>\n  <p class="text-slate-600 mt-2">Edit this code to see live updates.</p>\n</div>\n\n<style>\n  body {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    min-height: 90vh;\n    background-color: #e2e8f0; /* Tailwind slate-200 */\n  }\n</style>');
    }
  };

  const handleRefineWithAI = async () => {
    if (!visualizationCode || visualizationCode.startsWith('<p class="text-center p-4">') || visualizationCode.includes('<!-- Start coding your HTML')) {
      alert("Please generate or write some code first!");
      return;
    }
    
    setOriginalCodeBeforeRefinement(visualizationCode);
    setApiError(null); // Clear previous errors
    setIsProcessing(true);
    setProcessingMessage('Refining with Gemini AI...');

    let promptText = '';
    let modeForApi = currentInputMode === 'manual' ? 'text' : currentInputMode;
    let codeToRefine = visualizationCode;

    if (modeForApi === 'mermaid') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(visualizationCode, "text/html");
      const mermaidDiv = doc.querySelector(".mermaid");
      if (mermaidDiv && mermaidDiv.textContent) {
        codeToRefine = mermaidDiv.textContent.trim();
        promptText = `You are an expert in Mermaid.js diagrams. Please refine the following Mermaid diagram code to improve its clarity, layout, and visual appeal. If there are syntax issues, try to correct them. Here's the Mermaid code (it's the content inside the <div class="mermaid">...</div> tags):\n\n${codeToRefine}`;
      } else {
        setApiError("Could not extract Mermaid code for refinement. Please ensure it's in a valid format.");
        setIsProcessing(false);
        setProcessingMessage('');
        return;
      }
    } else { 
      promptText = `You are an expert frontend developer. Please refine the following HTML/CSS/JS code to improve its layout, polish animations, enhance colors, and overall usability. The code should remain a single, self-contained HTML string. If it contains any obvious errors, try to fix them. Here's the code:\n\n${codeToRefine}`;
    }

    const promptData = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { "temperature": 0.5, "responseMimeType": "text/plain" }
    };

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData),
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content && responseData.candidates[0].content.parts && responseData.candidates[0].content.parts[0]) {
          let refinedContent = responseData.candidates[0].content.parts[0].text;
          refinedContent = refinedContent.replace(/^```(?:html|mermaid)?\s*([\s\S]*?)\s*```$/, '$1').trim();
          refinedContent = refinedContent.replace(/^```\s*([\s\S]*?)\s*```$/, '$1').trim();

          if (modeForApi === 'mermaid') {
            setVisualizationCode(`<div class="mermaid" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">${refinedContent}</div>`);
          } else {
            setVisualizationCode(refinedContent);
          }
        } else {
          console.error('Error: Invalid response structure from Gemini API for refinement', responseData);
          setApiError("AI Refinement Error: Received invalid data from AI.");
          setVisualizationCode(originalCodeBeforeRefinement); // Revert
        }
      } else {
        const errorData = await response.json();
        console.error('Error refining with AI:', response.status, errorData);
        setApiError(`AI Refinement Error ${response.status}: ${errorData?.error?.message || 'Failed to refine.'}`);
        setVisualizationCode(originalCodeBeforeRefinement); // Revert
      }
    } catch (error) {
      console.error('Error calling Gemini API for refinement:', error);
      setApiError("Network Error: Could not connect to AI service for refinement.");
      setVisualizationCode(originalCodeBeforeRefinement); // Revert
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleAddImage = async () => {
    if (currentInputMode === 'mermaid') {
      alert("Adding images to Mermaid diagrams is not directly supported via this feature. Please use the 'Manual Code' tab to embed images if needed.");
      return;
    }
    
    const imagePromptContext = activePrompt || "a relevant image for the current visualization"; 
    setApiError(null); // Clear previous errors
    setIsProcessing(true);
    setProcessingMessage('Fetching image ideas with Gemini AI...');
    const originalCodeForImageAdd = visualizationCode; // Save current code

    const promptData = {
      contents: [{
        parts: [{
          text: `You are an assistant helping find images for a visualization. Based on the following topic: "${imagePromptContext}". 
Please provide: 
1. Up to 3 concise image search keywords (e.g., "abstract patterns", "futuristic city"). 
2. (Optional) If you can find a direct URL to a relevant, high-quality, royalty-free image (e.g., from Unsplash, Pexels), please provide it. If providing a URL, make sure it's just the URL. 

Format your response clearly, for example:
Keywords: keyword1, keyword2
Image URL: [URL if found, otherwise N/A]`
        }]
      }],
      generationConfig: { "temperature": 0.6, "responseMimeType": "text/plain" }
    };

    let imageUrlToUse = '';
    let imageAltText = "AI Suggested Image";

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData),
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content && responseData.candidates[0].content.parts && responseData.candidates[0].content.parts[0]) {
          const geminiResponseText = responseData.candidates[0].content.parts[0].text;
          
          const urlMatch = geminiResponseText.match(/Image URL:\s*(https?:\/\/\S+)/i);
          if (urlMatch && urlMatch[1] && urlMatch[1].toLowerCase() !== 'n/a') {
            imageUrlToUse = urlMatch[1];
            imageAltText = `AI Suggested Image (from URL: ${imagePromptContext})`;
          } else {
            const keywordsMatch = geminiResponseText.match(/Keywords:\s*(.*)/i);
            if (keywordsMatch && keywordsMatch[1]) {
              const keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k);
              if (keywords.length > 0) {
                imageUrlToUse = `https://source.unsplash.com/featured/?${encodeURIComponent(keywords[0])}&sig=${Math.random()}`;
                imageAltText = `AI Suggested Image (based on keyword: ${keywords[0]})`;
              }
            }
          }
        } else {
          console.error('Error: Invalid response structure from Gemini API for image suggestion', responseData);
          setApiError("Image Suggestion Error: Received invalid data from AI.");
        }
      } else {
        const errorData = await response.json();
        console.error('Error getting image suggestions from AI:', response.status, errorData);
        setApiError(`Image Suggestion Error ${response.status}: ${errorData?.error?.message || 'Failed to get suggestions.'}`);
      }
    } catch (error) {
      console.error('Error calling Gemini API for image suggestion:', error);
      setApiError("Network Error: Could not get image suggestions from AI.");
    }

    if (!imageUrlToUse) {
      console.log("Falling back to generic Unsplash image due to no specific suggestion from AI or error.");
      imageUrlToUse = `https://source.unsplash.com/random/400x200?sig=${Math.random()}`;
      imageAltText = `AI Suggested Image (random fallback)`;
      if(!apiError) setApiError("Could not get specific image suggestions, using a random image."); // Inform user if no other error was set
    }
    
    const imageTag = `<img src="${imageUrlToUse}" alt="${imageAltText}" style="max-width: 100%; height: auto; margin-top: 1rem; display: block; margin-left: auto; margin-right: auto; border-radius: 0.375rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);">`;
    let newCode;

    if (!originalCodeForImageAdd || originalCodeForImageAdd.startsWith('<p class="text-center p-4">') || originalCodeForImageAdd.includes('<!-- Start coding your HTML')) {
      newCode = `<div style="text-align: center; padding: 1rem;">${imageTag}</div>`;
    } else {
      newCode = originalCodeForImageAdd + `\n${imageTag}`;
    }
    
    setVisualizationCode(newCode);
    setIsProcessing(false);
    setProcessingMessage('');
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

      {apiError && (
        <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-sm" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 102 0V5zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{apiError}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button 
                  type="button" 
                  className="inline-flex bg-red-100 rounded-md p-1.5 text-red-500 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  onClick={() => setApiError(null)}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8" style={{ minHeight: 'calc(100vh - 230px - (2.5rem + 1rem))' }}> {/* Adjusted for potential error message height */}
        <InputArea
          onGenerate={handleGenerateVisualization}
          isProcessing={isProcessing}
          processingMessage={processingMessage} // Pass processingMessage
          visualizationCode={visualizationCode} 
          onCodeChange={handleCodeChangeFromEditor} 
          currentGlobalInputMode={currentInputMode} 
          onSetGlobalInputMode={handleSetCurrentInputMode} 
          onActivePromptChange={setActivePrompt} 
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
            disabled={isProcessing || currentInputMode === 'mermaid'}
            className={`${tertiaryButtonStyles} hover:scale-105`}
          >
            {isProcessing && processingMessage.includes('image suggestions') ? 'Fetching Ideas...' : isProcessing && processingMessage.includes('Adding image') ? 'Adding...' : 'Add Image 🖼️'}
          </button>
          <DownloadButton 
            code={visualizationCode} 
            isMermaid={currentInputMode === 'mermaid' && visualizationCode.trim().startsWith('<div class="mermaid"')} 
            inputMode={currentInputMode} 
            commonButtonStyles={primaryButtonStyles} 
            disabled={isProcessing || (!visualizationCode || visualizationCode.startsWith('<p class="text-center p-4">') || visualizationCode.includes('<!-- Start coding your HTML'))}
          />
        </div>
        <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Live Coder. All rights reserved (not really).</p>
      </footer>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
