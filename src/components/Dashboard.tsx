import { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { ChatInterface } from './ChatInterface';
import { Sidebar } from './Sidebar';
import { supabase } from '../lib/supabase';
import type { UploadedFile, Conversation } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';

export function Dashboard() {
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut } = useAuth();

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      loadConversations(selectedFile.id);
    }
  }, [selectedFile]);

  const loadFiles = async () => {
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading files:', error);
      return;
    }

    setFiles(data as UploadedFile[]);
  };

  const loadConversations = async (fileId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('file_id', fileId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    setConversations(data as Conversation[]);
  };

  const handleFileUploaded = async (fileId: string) => {
    await loadFiles();
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) {
      console.error('Error loading uploaded file:', error);
      return;
    }

    setSelectedFile(data as UploadedFile);
    setSelectedConversation(null);
  };

  const handleConversationCreated = (id: string) => {
    setSelectedConversation(id);
    if (selectedFile) {
      loadConversations(selectedFile.id);
    }
  };

  const handleNewChat = () => {
    setSelectedConversation(null);
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
  };

  const handleSelectFile = async (file: UploadedFile) => {
    setSelectedFile(file);
    setSelectedConversation(null);
    loadConversations(file.id);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed lg:relative lg:translate-x-0 z-30 transition-transform duration-300`}
      >
        <Sidebar
          files={files}
          conversations={conversations}
          selectedFile={selectedFile}
          selectedConversation={selectedConversation}
          onSelectFile={handleSelectFile}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-slate-600 hover:text-slate-900"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-xl font-semibold text-slate-900">
              {selectedFile ? selectedFile.original_filename : 'AI Data Agent'}
            </h1>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </header>

        <main className="flex-1 overflow-hidden p-6">
          {!selectedFile ? (
            <div className="flex items-center justify-center h-full">
              <FileUpload onFileUploaded={handleFileUploaded} />
            </div>
          ) : (
            <ChatInterface
              fileId={selectedFile.id}
              conversationId={selectedConversation}
              onConversationCreated={handleConversationCreated}
            />
          )}
        </main>
      </div>
    </div>
  );
}