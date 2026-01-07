import React, { useState } from 'react';
import ColorPicker from './ColorPicker';

interface Props {
  textareaRef: React.RefObject<HTMLInputElement>;
}

export default function MarkdownToolbar({ textareaRef }: Props) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    if (selectedText) {
      // Chuyển đổi text
      textarea.value = beforeText + prefix + selectedText + suffix + afterText;
    
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = end + prefix.length;
    } else {
      const placeholder = 'text';
      textarea.value = beforeText + prefix + placeholder + suffix + afterText;

      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length + placeholder.length;
    }

    textarea.focus();
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
  };

  const handleColorSelect = (colorHex: string) => {
    wrapSelection(`[${colorHex}]`, `[/${colorHex}]`);
  };

  const ToolButton = ({ 
    label, 
    onClick, 
    title 
  }: { 
    label: string | React.ReactNode; 
    onClick: () => void; 
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded transition-colors"
    >
      {label}
    </button>
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs text-gray-500 mr-2">Format:</span>
        
        <ToolButton 
          label="B" 
          onClick={() => wrapSelection('**')}
          title="Bold: **text**"
        />
        
        <ToolButton 
          label={<i>I</i>} 
          onClick={() => wrapSelection('*')}
          title="Italic: *text*"
        />
        
        <ToolButton 
          label={<u>U</u>}
          onClick={() => wrapSelection('__')}
          title="Underline: __text__"
        />

        <div className="mx-2 h-4 border-l border-gray-300"></div>

        <ToolButton 
          label={<span style={{color: '#FF0000'}}>A</span>}
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Text Color"
        />

        <div className="ml-auto text-xs text-gray-400">
          Chọn text và click chuyển đổi
        </div>
      </div>

      {/* Color Picker Popup */}
      {showColorPicker && (
        <ColorPicker 
          onSelectColor={handleColorSelect}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
}
