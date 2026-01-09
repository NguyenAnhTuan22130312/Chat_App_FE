import React, { useEffect, useRef, useState, useCallback } from 'react';
import { replaceEmojiShortcodes } from '../../utils/emojiShortcodes';
import { COLOR_MAP, getColorName } from '../../constants/colors';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  editorRef?: React.RefObject<HTMLDivElement | null>;
}

export default function RichTextInput({ 
  value, 
  onChange, 
  onKeyDown, 
  placeholder, 
  disabled,
  className,
  editorRef: externalRef
}: Props) {
  const internalRef = useRef<HTMLDivElement>(null);
  const editorRef = externalRef || internalRef;
  const [isComposing, setIsComposing] = useState(false);
  const isUpdatingRef = useRef(false);

  const textToHtml = useCallback((text: string): string => {
    if (!text) return '';
    
    let html = text;
    
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    const emojiPattern = /:([a-z_]+):/g;
    html = html.replace(emojiPattern, (match) => {
      const replaced = replaceEmojiShortcodes(match);
      return replaced !== match ? replaced : match;
    });
    
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    html = html.replace(/__([^_]+)__/g, '<u>$1</u>');
    
    Object.entries(COLOR_MAP).forEach(([name, hex]) => {
      const regex = new RegExp(`\\[${name}\\]([^\\[]+)\\[\\/${name}\\]`, 'g');
      html = html.replace(regex, `<span style="color:${hex}">$1</span>`);
    });
    
    return html;
  }, []);

  const htmlToMarkdown = useCallback((node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const children = Array.from(element.childNodes)
        .map(child => htmlToMarkdown(child))
        .join('');
      
      switch (element.tagName) {
        case 'STRONG':
        case 'B':
          return `**${children}**`;
        case 'EM':
        case 'I':
          return `*${children}*`;
        case 'U':
          return `__${children}__`;
        case 'SPAN':
          const color = element.style.color;
          if (color) {
            const colorName = getColorName(color);
            if (colorName) {
              return `[${colorName}]${children}[/${colorName}]`;
            }
          }
          return children;
        case 'BR':
          return '\n';
        case 'DIV':
          return children;
        default:
          return children;
      }
    }
    
    return '';
  }, []);

  const getPlainText = useCallback((): string => {
    if (!editorRef.current) return '';
    return htmlToMarkdown(editorRef.current);
  }, [editorRef, htmlToMarkdown]);

  const saveCursorPosition = useCallback((): number | null => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
  }, [editorRef]);

  const restoreCursorPosition = useCallback((position: number) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection) return;

    const createRange = (node: Node, chars: {count: number}): Range | null => {
      if (chars.count === 0) {
        const range = document.createRange();
        range.setStart(node, 0);
        range.collapse(true);
        return range;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (chars.count <= textLength) {
          const range = document.createRange();
          range.setStart(node, Math.min(chars.count, textLength));
          range.collapse(true);
          return range;
        } else {
          chars.count -= textLength;
        }
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          const range = createRange(node.childNodes[i], chars);
          if (range) return range;
        }
      }
      return null;
    };

    const range = createRange(editorRef.current, { count: position });
    if (range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, [editorRef]);

  useEffect(() => {
    if (!editorRef.current || isComposing || isUpdatingRef.current) return;

    const currentPlainText = getPlainText();
    
    if (value === '' && currentPlainText !== '') {
      editorRef.current.innerHTML = '';
      return;
    }

    if (currentPlainText === value) {
      return;
    }

    const newHtml = textToHtml(value);
    const currentHtml = editorRef.current.innerHTML;
    
    if (newHtml !== currentHtml) {
      const cursorPos = saveCursorPosition();
      editorRef.current.innerHTML = newHtml;
      
      if (cursorPos !== null) {
        restoreCursorPosition(cursorPos);
      }
    }
  }, [value, isComposing, editorRef, textToHtml, getPlainText, saveCursorPosition, restoreCursorPosition]);

  const handleInput = () => {
    if (!editorRef.current || isComposing) return;
    
    isUpdatingRef.current = true;
    const plainText = getPlainText();
    onChange(plainText);
    
    const cursorPos = saveCursorPosition();
    const renderedHtml = textToHtml(plainText);
    
    if (editorRef.current.innerHTML !== renderedHtml) {
      editorRef.current.innerHTML = renderedHtml;
      
      if (cursorPos !== null) {
        restoreCursorPosition(cursorPos);
      }
    }
    
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown(e);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    if (editorRef.current) {
      const event = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(event);
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
    setTimeout(() => {
      if (editorRef.current) {
        isUpdatingRef.current = true;
        const plainText = getPlainText();
        onChange(plainText);
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }, 0);
  };

  return (
    <div
      ref={editorRef}
      contentEditable={!disabled}
      onInput={handleInput}
      onKeyDown={handleKeyDownInternal}
      onPaste={handlePaste}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      className={className}
      suppressContentEditableWarning
      data-placeholder={placeholder}
      style={{
        minHeight: '20px',
        maxHeight: '100px',
        overflowY: 'auto',
        outline: 'none',
      }}
    />
  );
}
