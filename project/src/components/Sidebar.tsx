import { Plus, FileSpreadsheet, MessageSquare, Database } from 'lucide-react';
import type { UploadedFile, Conversation } from '../lib/supabase';

interface SidebarProps {
  files: UploadedFile[];
  conversations: Conversation[];
  selectedFile: UploadedFile | null;
  selectedConversation: string | null;
  onSelectFile: (file: UploadedFile) => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

export function Sidebar({
  files,
  conversations,
  selectedFile,
  selectedConversation,
  onSelectFile,
  onSelectConversation,
  onNewChat,
}: SidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-slate-200 h-screen flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 rounded-lg p-2">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">AI Data Agent</h2>
        </div>
        {selectedFile && (
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Your Files
          </h3>
          <div className="space-y-2">
            {files.map((file) => (
              <button
                key={file.id}
                onClick={() => onSelectFile(file)}
                className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-3 ${
                  selectedFile?.id === file.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.original_filename}</p>
                  <p className="text-xs text-slate-500">{file.row_count} rows</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedFile && conversations.length > 0 && (
          <div className="p-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Conversations
            </h3>
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-3 ${
                    selectedConversation === conversation.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conversation.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}