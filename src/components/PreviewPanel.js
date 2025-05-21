import React, { useEffect, useRef } from 'react';

function PreviewPanel({ code, inputMode }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      let content = code;

      if (inputMode === 'mermaid') {
        const mermaidCDN = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        // For Mermaid, the 'code' prop from App.js is already the <div class="mermaid">...</div> string
        // So, we directly embed this 'code' into the body.
        content = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <script src="${mermaidCDN}"></script>
            <script>
              mermaid.initialize({ startOnLoad: true, theme: 'neutral', sécurisecurityLevelvel: 'loose' });
            </script>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f8fafc; /* Tailwind slate-50 */ }
              .mermaid { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; padding: 10px; }
              .mermaid svg { max-width: 100%; max-height: 100%; }
            </style>
          </head>
          <body>
            ${code}
          </body>
          </html>
        `;
        iframe.srcdoc = content;
      } else {
        // For 'text' or 'manual' mode (HTML/CSS animations), set srcdoc directly
        // Add a basic HTML structure if not present for consistent styling
        if (!code.trim().startsWith('<!DOCTYPE html>') && !code.trim().startsWith('<html')) {
          content = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { margin: 0; font-family: 'Inter', sans-serif; background-color: #f8fafc; /* Tailwind slate-50 */ color: #334155; /* Tailwind slate-700 */ }
              </style>
            </head>
            <body>
              ${code}
            </body>
            </html>
          `;
        }
        iframe.srcdoc = content;
      }

      // Force iframe reload for some browsers/cases to ensure srcdoc changes apply
      // iframe.src = 'about:blank'; // Causes issues with Mermaid rendering and content flash
      // setTimeout(() => { iframe.srcdoc = content; }, 0); // This can also be problematic
    }
  }, [code, inputMode]);

  return (
    <div className="bg-white p-1 rounded-lg shadow-inner flex flex-col h-full border border-slate-200">
      <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 rounded-t-lg">
        <h2 className="text-sm font-semibold text-slate-600">Live Preview</h2>
      </div>
      <iframe
        ref={iframeRef}
        title="Visualization Preview"
        sandbox="allow-scripts allow-same-origin" // allow-same-origin for mermaid, allow-scripts for user JS
        className="w-full flex-grow border-0 rounded-b-lg" // flex-grow takes available space
        // srcDoc is managed by useEffect
      />
    </div>
  );
}

export default PreviewPanel;
