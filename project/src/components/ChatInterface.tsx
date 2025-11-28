import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, BarChart3, Table as TableIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Message, Conversation } from '../lib/supabase';
import { DataVisualization } from './DataVisualization';

interface ChatInterfaceProps {
  fileId: string;
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
}

export function ChatInterface({ fileId, conversationId, onConversationCreated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data as Message[]);
  };

  const createConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        file_id: fileId,
        title: 'New Analysis',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    return data.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    let currentConversationId = conversationId;
    if (!currentConversationId) {
      currentConversationId = await createConversation();
      if (!currentConversationId) return;
      onConversationCreated(currentConversationId);
    }

    const userMessage = input;
    setInput('');
    setLoading(true);

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversationId,
      role: 'user',
      content: userMessage,
      query_metadata: {},
      visualization_data: {},
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const { data: userMsgData, error: userMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversationId,
          role: 'user',
          content: userMessage,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          query: userMessage,
          conversation_id: currentConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const result = await response.json();

      const { data: assistantMsgData, error: assistantMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversationId,
          role: 'assistant',
          content: result.answer,
          query_metadata: result.query_metadata || {},
          visualization_data: result.visualization || {},
        })
        .select()
        .single();

      if (assistantMsgError) throw assistantMsgError;

      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMessage.id), userMsgData, assistantMsgData] as Message[]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        {
          id: `error-${Date.now()}`,
          conversation_id: currentConversationId,
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request.',
          query_metadata: {},
          visualization_data: {},
          created_at: new Date().toISOString(),
        } as Message,
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="bg-blue-100 rounded-full p-4 mb-4">
              <BarChart3 className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Start Your Analysis
            </h3>
            <p className="text-slate-600 max-w-md">
              Ask me anything about your data. I can help with trends, statistics, comparisons, and more.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 w-full max-w-lg">
              <button
                onClick={() => setInput('What are the main trends in this data?')}
                className="text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition text-slate-700"
              >
                What are the main trends in this data?
              </button>
              <button
                onClick={() => setInput('Show me summary statistics')}
                className="text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition text-slate-700"
              >
                Show me summary statistics
              </button>
              <button
                onClick={() => setInput('What insights can you find?')}
                className="text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition text-slate-700"
              >
                What insights can you find?
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.visualization_data && Object.keys(message.visualization_data).length > 0 && (
                    <div className="mt-4">
                      <DataVisualization data={message.visualization_data} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-6 py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your data..."
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}