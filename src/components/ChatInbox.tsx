import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Send, MessageSquare, Package } from 'lucide-react';

interface Thread {
  id: string;
  buyer_id: string;
  order_summary: string;
  subtotal: number;
  delivery_destination: string;
  status: string;
  created_at: string;
  profiles?: { full_name: string; phone_number: string };
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  message_body: string;
  created_at: string;
}

export default function ChatInbox() {
  const { user, isAdmin } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchThreads();

    // Live-update the thread list when a new order comes in (or an existing one changes)
    const threadsChannel = supabase
      .channel('threads-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_threads' },
        () => {
          fetchThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(threadsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeThread) return;
    fetchMessages(activeThread.id);

    const channel = supabase
      .channel(`thread-${activeThread.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${activeThread.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchThreads() {
    try {
      const query = isAdmin
        ? supabase.from('chat_threads').select('*, profiles(full_name, phone_number)').order('created_at', { ascending: false })
        : supabase.from('chat_threads').select('*').eq('buyer_id', user!.id).order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setThreads((data as Thread[]) || []);
    } catch (err) {
      console.error('Error fetching threads:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(threadId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (!error && data) setMessages(data as Message[]);
  }

  async function sendMessage() {
    const body = newMessage.trim();
    if (!body || !activeThread || !user) return;
    setSending(true);
    setNewMessage('');
    const { error } = await supabase
      .from('chat_messages')
      .insert([{ thread_id: activeThread.id, sender_id: user.id, message_body: body }]);
    if (error) {
      console.error('Error sending message:', error);
      setNewMessage(body); // restore on failure so the user doesn't lose their text
    }
    setSending(false);
  }

  if (loading) return <p className="text-gray-500 text-center py-12">Loading orders...</p>;

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 px-4 sm:px-6 py-8">
      <div className="md:col-span-1 bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-3 border-b font-bold text-sm flex items-center gap-2">
          <Package className="w-4 h-4" /> {isAdmin ? 'All Orders' : 'My Orders'}
        </div>
        <div className="max-h-[40vh] md:max-h-[60vh] overflow-y-auto">
          {threads.length === 0 ? (
            <p className="text-gray-400 text-xs p-4">No orders yet.</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveThread(t)}
                className={`w-full text-left p-3 border-b text-xs hover:bg-gray-50 ${
                  activeThread?.id === t.id ? 'bg-gray-100' : ''
                }`}
              >
                {isAdmin && <p className="font-semibold">{t.profiles?.full_name || 'Buyer'}</p>}
                <p className="text-gray-600 truncate">{t.order_summary}</p>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400">{new Date(t.created_at).toLocaleDateString()}</span>
                  <span className="capitalize bg-gray-200 px-1.5 rounded">{t.status}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 flex flex-col h-[50vh] md:h-[60vh]">
        {!activeThread ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            <MessageSquare className="w-6 h-6 mr-2" /> Select an order to view the chat
          </div>
        ) : (
          <>
            <div className="p-3 border-b text-xs text-gray-600">
              <p className="font-semibold text-gray-900">Subtotal: R{Number(activeThread.subtotal || 0).toFixed(2)}</p>
              <p>Delivery to: {activeThread.delivery_destination}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[75%] p-2 rounded-lg text-xs ${
                    m.sender_id === user?.id ? 'ml-auto bg-black text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {m.message_body}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-black"
              />
              <button
                onClick={sendMessage}
                disabled={sending}
                className="bg-black text-white px-3 py-2 rounded-lg disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}