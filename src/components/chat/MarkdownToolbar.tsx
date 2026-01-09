import React, { useState } from 'react';
import ColorPicker from './ColorPicker';

interface Props {
  editorRef: React.RefObject<HTMLDivElement | null>;
}

interface ToolButtonProps {
  label: string | React.ReactNode;
  onClick: () => void;
  title: string;
}

const ToolButton = React.memo(({ label, onClick, title }: ToolButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    onMouseDown={(e) => e.preventDefault()}
    title={title}
    className="px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded transition-colors"
  >
    {label}
  </button>
));

ToolButton.displayName = 'ToolButton';

export default function MarkdownToolbar({ editorRef }: Props) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText) {
      const placeholder = 'text';
      const textNode = document.createTextNode(prefix + placeholder + suffix);
      range.insertNode(textNode);
      
      const newRange = document.createRange();
      newRange.setStart(textNode, prefix.length);
      newRange.setEnd(textNode, prefix.length + placeholder.length);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      const wrappedText = prefix + selectedText + suffix;
      const textNode = document.createTextNode(wrappedText);
      
      range.deleteContents();
      range.insertNode(textNode);
      
      const newRange = document.createRange();
      newRange.setStartAfter(textNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    const event = new Event('input', { bubbles: true });
    editorRef.current.dispatchEvent(event);
    
    editorRef.current.focus();
  };

  const handleColorSelect = (colorHex: string) => {
    wrapSelection(`[${colorHex}]`, `[/${colorHex}]`);
    setShowColorPicker(false);
  };

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
