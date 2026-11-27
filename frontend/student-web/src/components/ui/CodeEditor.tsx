'use client';

import React, { useRef, useState, useMemo, useCallback } from 'react';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  fontSize?: 'sm' | 'base' | 'lg';
  placeholder?: string;
  className?: string;
  minLines?: number;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function highlightCode(code: string, lang: string): string {
  if (!code) return '';
  const l = (lang || 'python').toLowerCase();

  const isPython = l.includes('python') || l === 'py';
  const isJava = l.includes('java') && !l.includes('script');
  const isCSharp = l.includes('csharp') || l.includes('c#') || l === 'cs';
  const isJS = l.includes('javascript') || l.includes('node') || l === 'js';

  // Comments
  const commentPattern = isPython ? /#[^\n]*/ : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/;

  // Strings
  const stringPattern = isPython
    ? /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/
    : /(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/;

  // Numbers
  const numberPattern = /\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/;

  // Keywords
  let keywordPattern: RegExp;
  if (isPython) {
    keywordPattern = /\b(def|class|import|from|as|return|if|elif|else|for|while|break|continue|try|except|finally|raise|with|pass|lambda|yield|async|await|assert|global|nonlocal|in|is|not|and|or|True|False|None)\b/;
  } else if (isJava) {
    keywordPattern = /\b(public|private|protected|static|final|abstract|class|interface|enum|extends|implements|new|this|super|return|if|else|switch|case|default|break|continue|for|while|do|try|catch|finally|throw|throws|import|package|instanceof|void|int|long|short|byte|float|double|char|boolean|true|false|null)\b/;
  } else if (isCSharp) {
    keywordPattern = /\b(using|namespace|class|struct|interface|enum|public|private|protected|internal|static|readonly|const|override|virtual|abstract|async|await|var|new|this|base|return|if|else|switch|case|default|break|continue|for|foreach|in|while|do|try|catch|finally|throw|void|int|long|short|byte|float|double|decimal|char|bool|string|object|true|false|null)\b/;
  } else {
    keywordPattern = /\b(function|const|let|var|return|if|else|switch|case|default|break|continue|for|while|do|try|catch|finally|throw|class|extends|new|this|super|import|export|from|as|async|await|yield|typeof|instanceof|in|of|void|delete|true|false|null|undefined|NaN)\b/;
  }

  // Built-in types / library classes
  let builtinPattern: RegExp;
  if (isPython) {
    builtinPattern = /\b(print|input|len|range|enumerate|zip|map|filter|list|dict|set|tuple|int|float|str|bool|min|max|sum|abs|round|sorted|open|isinstance|type|sys|os|math)\b/;
  } else if (isJava) {
    builtinPattern = /\b(System|Scanner|Math|String|Integer|Double|Boolean|List|ArrayList|Map|HashMap|Set|HashSet|Arrays|Collections|StringBuilder|Exception|Override|Main|Solution)\b/;
  } else if (isCSharp) {
    builtinPattern = /\b(Console|WriteLine|Write|ReadLine|Math|Convert|List|Dictionary|HashSet|Array|Enumerable|Task|Thread|Exception|Int32|Int64|String|Double|Boolean|Program)\b/;
  } else {
    builtinPattern = /\b(console|log|error|warn|info|Math|JSON|Promise|Array|Object|String|Number|Boolean|Date|RegExp|Set|Map|require|module|exports|process|fs)\b/;
  }

  // Capitalized Type/Class names
  const classTypePattern = /\b[A-Z][a-zA-Z0-9_]*\b/;

  // Functions (e.g. foo(...))
  const funcPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*\()/;

  // Operators
  const operatorPattern = /[=+\-*/%&|^~<>!?:]+|->|=>/;

  // Brackets
  const bracketPattern = /[{}()[\]]/;

  // Punctuation
  const punctuationPattern = /[.,;]/;

  // Identifiers / Variables
  const identifierPattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/;

  const masterRegex = new RegExp(
    [
      `(?<comment>${commentPattern.source})`,
      `(?<string>${stringPattern.source})`,
      `(?<keyword>${keywordPattern.source})`,
      `(?<builtin>${builtinPattern.source})`,
      `(?<classType>${classTypePattern.source})`,
      `(?<func>${funcPattern.source})`,
      `(?<number>${numberPattern.source})`,
      `(?<operator>${operatorPattern.source})`,
      `(?<bracket>${bracketPattern.source})`,
      `(?<punctuation>${punctuationPattern.source})`,
      `(?<identifier>${identifierPattern.source})`,
    ].join('|'),
    'g'
  );

  let lastIndex = 0;
  let html = '';
  let match: RegExpExecArray | null;

  while ((match = masterRegex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      html += `<span style="color: #F0F6FC;">${escapeHtml(code.substring(lastIndex, match.index))}</span>`;
    }
    const val = match[0];
    const groups = match.groups || {};

    if (groups.comment) {
      // Soft visible slate-gray for comments
      html += `<span style="color: #8B949E; font-style: italic;">${escapeHtml(val)}</span>`;
    } else if (groups.string) {
      // Crisp light green for strings
      html += `<span style="color: #7EE787;">${escapeHtml(val)}</span>`;
    } else if (groups.keyword) {
      // Vivid coral for keywords
      html += `<span style="color: #FF7B72;">${escapeHtml(val)}</span>`;
    } else if (groups.builtin || groups.classType) {
      // Warm bright gold/amber for builtins & types
      html += `<span style="color: #FFA657;">${escapeHtml(val)}</span>`;
    } else if (groups.func) {
      // Bright lavender purple for functions
      html += `<span style="color: #D2A8FF;">${escapeHtml(val)}</span>`;
    } else if (groups.number) {
      // Bright cyan for numbers
      html += `<span style="color: #79C0FF;">${escapeHtml(val)}</span>`;
    } else if (groups.operator) {
      // Bright cyan-blue for operators
      html += `<span style="color: #79C0FF;">${escapeHtml(val)}</span>`;
    } else if (groups.bracket) {
      // Bright crisp white for brackets
      html += `<span style="color: #F0F6FC;">${escapeHtml(val)}</span>`;
    } else if (groups.punctuation) {
      // Bright crisp white for punctuation (dots, semicolons, commas)
      html += `<span style="color: #F0F6FC;">${escapeHtml(val)}</span>`;
    } else if (groups.identifier) {
      // Bright crisp white for identifiers (variable names, parameter names)
      html += `<span style="color: #F0F6FC;">${escapeHtml(val)}</span>`;
    } else {
      html += `<span style="color: #F0F6FC;">${escapeHtml(val)}</span>`;
    }

    lastIndex = masterRegex.lastIndex;
  }

  if (lastIndex < code.length) {
    html += `<span style="color: #F0F6FC;">${escapeHtml(code.substring(lastIndex))}</span>`;
  }

  return html;
}

const BRACKET_PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  fontSize = 'sm',
  placeholder = '// Write your code here...',
  className = '',
  minLines = 15,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [activeLine, setActiveLine] = useState(1);

  const fontSizePx = fontSize === 'sm' ? '13px' : fontSize === 'base' ? '14px' : '16px';
  const lineHeightPx = '24px';
  const monoFontFamily = 'Consolas, Monaco, "Courier New", monospace';

  // Compute lines for line numbers gutter
  const lineCount = useMemo(() => {
    return Math.max((value || '').split('\n').length, minLines);
  }, [value, minLines]);

  // Compute highlighted code
  const highlightedCode = useMemo(() => {
    const html = highlightCode(value || '', language);
    // Append trailing space if code ends with newline so pre doesn't collapse last line
    return (value || '').endsWith('\n') ? html + ' ' : html;
  }, [value, language]);

  // Synchronize scrolling between textarea, pre, and gutter
  const handleScroll = useCallback(() => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  }, []);

  const updateCursorLine = useCallback(() => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const currentLine = (value.substring(0, pos).split('\n')).length;
    setActiveLine(currentLine);
  }, [value]);

  // Handle advanced keyboard shortcuts: Indent on Enter, Tab/Shift-Tab, Backspace smart dedent
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    // 1. ENTER KEY: Intelligent Auto-indentation
    if (e.key === 'Enter') {
      e.preventDefault();

      // Find start of current line
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(lineStart, start);
      const leadingIndent = currentLine.match(/^[ \t]*/)?.[0] || '';

      const trimmedLine = currentLine.trimEnd();
      const opensBlock =
        trimmedLine.endsWith(':') ||
        trimmedLine.endsWith('{') ||
        trimmedLine.endsWith('(') ||
        trimmedLine.endsWith('[');

      const charBefore = val[start - 1];
      const charAfter = val[start];
      const isSplitPair =
        (charBefore === '{' && charAfter === '}') ||
        (charBefore === '(' && charAfter === ')') ||
        (charBefore === '[' && charAfter === ']');

      let insertText = '\n' + leadingIndent;
      let newCursor = start + 1 + leadingIndent.length;

      if (isSplitPair) {
        insertText = '\n' + leadingIndent + '    \n' + leadingIndent;
        newCursor = start + 1 + leadingIndent.length + 4;
      } else if (opensBlock) {
        insertText += '    ';
        newCursor += 4;
      }

      const nextVal = val.substring(0, start) + insertText + val.substring(end);
      onChange(nextVal);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = newCursor;
          textareaRef.current.selectionEnd = newCursor;
          updateCursorLine();
          handleScroll();
        }
      });
      return;
    }

    // 2. TAB KEY: Indent / Multi-line indent (4 spaces)
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();

      if (start === end) {
        // Single cursor: insert 4 spaces
        const nextVal = val.substring(0, start) + '    ' + val.substring(end);
        onChange(nextVal);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 4;
            textareaRef.current.selectionEnd = start + 4;
            handleScroll();
          }
        });
      } else {
        // Multi-line selection: indent all affected lines
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = val.indexOf('\n', end);
        const effectiveEnd = lineEnd === -1 ? val.length : lineEnd;
        const selectedBlock = val.substring(lineStart, effectiveEnd);
        const lines = selectedBlock.split('\n');
        const indented = lines.map((l) => '    ' + l).join('\n');
        const nextVal = val.substring(0, lineStart) + indented + val.substring(effectiveEnd);
        onChange(nextVal);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = lineStart;
            textareaRef.current.selectionEnd = lineStart + indented.length;
            handleScroll();
          }
        });
      }
      return;
    }

    // 3. SHIFT + TAB KEY: Dedent current or selected lines
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();

      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = val.indexOf('\n', end);
      const effectiveEnd = lineEnd === -1 ? val.length : lineEnd;
      const selectedBlock = val.substring(lineStart, effectiveEnd);
      const lines = selectedBlock.split('\n');

      let removedFirst = 0;
      let totalRemoved = 0;

      const dedented = lines
        .map((line, idx) => {
          let toRemove = 0;
          if (line.startsWith('    ')) toRemove = 4;
          else if (line.startsWith('   ')) toRemove = 3;
          else if (line.startsWith('  ')) toRemove = 2;
          else if (line.startsWith(' ') || line.startsWith('\t')) toRemove = 1;

          if (idx === 0) removedFirst = toRemove;
          totalRemoved += toRemove;
          return line.substring(toRemove);
        })
        .join('\n');

      const nextVal = val.substring(0, lineStart) + dedented + val.substring(effectiveEnd);
      onChange(nextVal);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const newStart = Math.max(lineStart, start - removedFirst);
          const newEnd = Math.max(newStart, end - totalRemoved);
          textareaRef.current.selectionStart = newStart;
          textareaRef.current.selectionEnd = newEnd;
          handleScroll();
        }
      });
      return;
    }

    // 4. BACKSPACE: Smart dedent if cursor is at a 4-space indentation
    if (e.key === 'Backspace' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      if (start === end) {
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const beforeCursor = val.substring(lineStart, start);
        // Only spaces before cursor on this line
        if (beforeCursor.length > 0 && /^[ ]+$/.test(beforeCursor)) {
          e.preventDefault();
          const removeCount = beforeCursor.length % 4 === 0 ? 4 : beforeCursor.length % 4;
          const nextVal = val.substring(0, start - removeCount) + val.substring(start);
          onChange(nextVal);
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = start - removeCount;
              textareaRef.current.selectionEnd = start - removeCount;
              updateCursorLine();
              handleScroll();
            }
          });
          return;
        }
      }
    }

    // 5. AUTO-CLOSING BRACKETS & QUOTES
    const pair = BRACKET_PAIRS[e.key];
    if (pair) {
      if (start !== end) {
        // Selection wrapping
        e.preventDefault();
        const selected = val.substring(start, end);
        const nextVal = val.substring(0, start) + e.key + selected + pair + val.substring(end);
        onChange(nextVal);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 1;
            textareaRef.current.selectionEnd = end + 1;
            handleScroll();
          }
        });
        return;
      } else if (['"', "'", '`', ')', ']', '}'].includes(e.key) && val[start] === e.key) {
        // Skip over identical closing character
        e.preventDefault();
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 1;
            textareaRef.current.selectionEnd = start + 1;
            handleScroll();
          }
        });
        return;
      } else if (['(', '[', '{'].includes(e.key)) {
        // Auto-close opening bracket
        e.preventDefault();
        const nextVal = val.substring(0, start) + e.key + pair + val.substring(start);
        onChange(nextVal);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 1;
            textareaRef.current.selectionEnd = start + 1;
            handleScroll();
          }
        });
        return;
      }
    }
  };

  return (
    <div
      onClick={() => textareaRef.current?.focus()}
      className={`flex-1 flex overflow-hidden bg-[#0D1117] relative dark-scrollbar ${className}`}
    >
      {/* Line Numbers Gutter */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="w-11 sm:w-12 bg-[#090D16] border-r border-slate-800 text-slate-500 font-mono select-none py-3.5 text-right pr-2.5 overflow-hidden shrink-0 space-y-0"
        style={{
          fontSize: fontSizePx,
          lineHeight: lineHeightPx,
          fontFamily: monoFontFamily,
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => {
          const num = i + 1;
          const isCurrent = num === activeLine;
          return (
            <div
              key={num}
              className={`h-6 leading-6 transition-colors ${
                isCurrent ? 'text-amber-400 font-bold bg-[#161B22]/70 rounded-xs' : 'text-slate-600'
              }`}
            >
              {num}
            </div>
          );
        })}
      </div>

      {/* Editor Content Area: Syntax Highlight Layer + Interactive Transparent Textarea */}
      <div
        onClick={() => textareaRef.current?.focus()}
        className="relative flex-1 h-full overflow-hidden cursor-text"
      >
        {/* Syntax Highlighted Render (Underneath) */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none m-0 font-mono overflow-hidden whitespace-pre leading-6"
          style={{
            padding: '14px',
            fontSize: fontSizePx,
            lineHeight: lineHeightPx,
            fontFamily: monoFontFamily,
            letterSpacing: '0px',
            wordSpacing: '0px',
            fontVariantLigatures: 'none',
            color: '#F0F6FC',
            tabSize: 4,
          }}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />

        {/* Input Textarea (Overlayed) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            updateCursorLine();
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={updateCursorLine}
          onClick={updateCursorLine}
          onScroll={handleScroll}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          style={{
            padding: '14px',
            fontSize: fontSizePx,
            lineHeight: lineHeightPx,
            fontFamily: monoFontFamily,
            letterSpacing: '0px',
            wordSpacing: '0px',
            fontVariantLigatures: 'none',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
            caretColor: '#58A6FF',
            tabSize: 4,
            colorScheme: 'dark',
          }}
          className="absolute inset-0 w-full h-full font-mono bg-transparent resize-none outline-none border-none overflow-auto whitespace-pre leading-6 select-text selection:bg-[#3760F8]/40 focus:ring-0 focus:outline-none dark-scrollbar"
        />
      </div>
    </div>
  );
};
