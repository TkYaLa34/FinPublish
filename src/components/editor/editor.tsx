"use client";

import { useState } from 'react';
import { Bold, Italic, Heading, Eye, Edit3, Code } from 'lucide-react';
import { Button } from '../ui/button';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const Editor = ({ value, onChange, placeholder = 'Write your financial analysis here...' }: EditorProps) => {
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacement = before + (selected || 'text') + after;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected || 'text').length);
    }, 0);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 bg-gray-50">
        <div className="flex items-center space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('**', '**')}
            disabled={mode === 'preview'}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('*', '*')}
            disabled={mode === 'preview'}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('# ', '')}
            disabled={mode === 'preview'}
            title="Heading"
          >
            <Heading className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('`', '`')}
            disabled={mode === 'preview'}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'write' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Preview
          </button>
        </div>
      </div>

      <div className="p-4 min-h-[300px]">
        {mode === 'write' ? (
          <textarea
            id="editor-textarea"
            className="w-full min-h-[300px] border-0 outline-none resize-none focus:ring-0 text-gray-800 text-sm font-sans"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <div className="prose max-w-none text-gray-800 text-sm">
            {value ? (
              value.split('\n').map((para, i) => {
                if (para.startsWith('# ')) {
                  return <h1 key={i} className="text-2xl font-bold mt-4 mb-2 text-gray-900">{para.replace('# ', '')}</h1>;
                }
                if (para.startsWith('## ')) {
                  return <h2 key={i} className="text-xl font-bold mt-3 mb-2 text-gray-900">{para.replace('## ', '')}</h2>;
                }
                if (para.startsWith('- ') || para.startsWith('* ')) {
                  return <li key={i} className="ml-4 list-disc text-gray-700">{para.substring(2)}</li>;
                }
                return <p key={i} className="mb-3 leading-relaxed">{para}</p>;
              })
            ) : (
              <span className="text-gray-400 italic">Nothing to preview.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
