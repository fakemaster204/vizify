import React, { useEffect, useRef } from 'react';

function CodeEditor({ value, onChange, mode = 'htmlmixed', readOnly = false }) {
  const textareaRef = useRef(null);
  const editorRef = useRef(null); // To store the CodeMirror instance

  useEffect(() => {
    if (textareaRef.current) {
      const editor = window.CodeMirror.fromTextArea(textareaRef.current, {
        lineNumbers: true,
        mode: mode,
        theme: 'material',
        autoCloseTags: true,
        matchBrackets: true,
        lineWrapping: true,
        readOnly: readOnly,
      });
      editorRef.current = editor;

      editor.on('change', (instance) => {
        const currentValue = instance.getValue();
        if (onChange) {
          onChange(currentValue);
        }
      });

      // Set initial value
      if (value !== editor.getValue()) {
        editor.setValue(value || '');
      }

      // Cleanup on unmount
      return () => {
        editor.toTextArea(); // Clean up CodeMirror instance
      };
    }
  }, [textareaRef, mode, readOnly]); // Re-initialize if mode or readOnly changes

  // Effect to update editor value if props.value changes from outside
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value || '');
    }
  }, [value]);

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <textarea ref={textareaRef} />
    </div>
  );
}

export default CodeEditor;
