import React, { useState, useEffect, useRef } from 'react';

function DownloadButton({ code, isMermaid, inputMode, commonButtonStyles, disabled }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const baseButtonStyles = commonButtonStyles || "font-medium py-2.5 px-5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 smooth-transition disabled:opacity-60 disabled:cursor-not-allowed";
  const mainButtonActiveStyles = "bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-400";
  const mainButtonDisabledStyles = "bg-slate-400 text-slate-100 cursor-not-allowed";

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);


  const createHtmlFileContent = (currentCode) => {
    if (isMermaid) {
      const mermaidCDN = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Mermaid Diagram</title>
    <script src="${mermaidCDN}"></script>
    <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 90vh; margin: 0; background-color: #f8fafc; }
        .mermaid { text-align: center; }
    </style>
</head>
<body>
    ${currentCode} 
    <script>mermaid.initialize({startOnLoad: true});</script>
</body>
</html>`;
    }
    return currentCode;
  };

  const triggerDownload = (blob, filename) => {
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  const handleDirectDownload = () => {
    if (disabled) return;
    const filename = isMermaid ? "mermaid_diagram.html" : "visualization.html";
    const contentToDownload = createHtmlFileContent(code);
    const file = new Blob([contentToDownload], { type: 'text/html' });
    triggerDownload(file, filename);
    setShowDropdown(false);
  };

  const handleZipDownload = async () => {
    if (disabled) return;
    const zip = new JSZip();

    if (inputMode === 'mermaid' && isMermaid) { // Ensure it's truly Mermaid content
      const htmlContent = createHtmlFileContent(code);
      zip.file("diagram.html", htmlContent);
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, "text/html");
      const mermaidDiv = doc.querySelector(".mermaid");
      if (mermaidDiv) {
        zip.file("diagram.mmd", mermaidDiv.textContent || "");
      }
    } else { // Treat as 'text' or 'manual' (HTML/CSS/JS)
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, "text/html");
      let cssContent = "";
      let jsContent = "";

      const styleNodes = doc.querySelectorAll('style');
      styleNodes.forEach(node => {
        cssContent += node.textContent + "\n\n";
        node.parentNode.removeChild(node);
      });

      const scriptNodes = doc.querySelectorAll('script');
      scriptNodes.forEach(node => {
        if (!node.src) {
          jsContent += node.textContent + "\n\n";
          node.parentNode.removeChild(node);
        }
      });
      
      let htmlContent = doc.documentElement.outerHTML;
      const finalDoc = parser.parseFromString(htmlContent, "text/html"); // Re-parse to ensure clean structure
      const head = finalDoc.querySelector('head');
      const body = finalDoc.querySelector('body');


      if (cssContent.trim()) {
        const linkTag = finalDoc.createElement('link');
        linkTag.setAttribute('rel', 'stylesheet');
        linkTag.setAttribute('href', 'styles.css');
        if(head) head.appendChild(linkTag);
      }
      if (jsContent.trim()) {
        const scriptTag = finalDoc.createElement('script');
        scriptTag.setAttribute('src', 'script.js');
        scriptTag.setAttribute('defer', '');
        if(body) body.appendChild(scriptTag);
      }
      
      zip.file("index.html", finalDoc.documentElement.outerHTML);
      if (cssContent.trim()) zip.file("styles.css", cssContent.trim());
      if (jsContent.trim()) zip.file("script.js", jsContent.trim());
    }

    try {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerDownload(zipBlob, "visualization_project.zip");
    } catch (e) {
      console.error("Error generating zip:", e);
      alert("Could not generate zip file. See console for details.");
    }
    setShowDropdown(false);
  };
  
  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        className={`${baseButtonStyles} ${disabled ? mainButtonDisabledStyles : mainButtonActiveStyles} inline-flex items-center hover:scale-105`}
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled}
      >
        Download
        <svg className={`ml-2 -mr-1 h-5 w-5 smooth-transition ${showDropdown ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {showDropdown && !disabled && (
        <div
          className={`origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-2xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30 smooth-transition ${showDropdown ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
          style={{ transition: 'opacity 300ms ease-out, transform 300ms ease-out' }}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            <button
              onClick={handleDirectDownload}
              className="text-slate-700 block w-full text-left px-4 py-2 text-sm hover:bg-sky-100 hover:text-sky-700 smooth-transition"
              role="menuitem"
            >
              Download {isMermaid ? "Diagram HTML" : "HTML File"}
            </button>
            <button
              onClick={handleZipDownload}
              className="text-slate-700 block w-full text-left px-4 py-2 text-sm hover:bg-sky-100 hover:text-sky-700 smooth-transition"
              role="menuitem"
            >
              Download as .zip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DownloadButton;
