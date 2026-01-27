import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Player } from '../types';
import { MessageSquare, Minimize2, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  hero_class: string; // Snake case to match DB
  text: string;
  created_at: string; // ISO String from DB
}

interface GlobalChatProps {
  player: Player;
}

export const GlobalChat: React.FC<GlobalChatProps> = ({ player }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Track open state in ref for subscription callback
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
        setUnreadCount(0);
        // Scroll to bottom
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
        // Focus input
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  useEffect(() => {
    // 1. Fetch History on Mount
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('global_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        // Reverse because we fetch newest first, but display oldest at top
        setMessages(data.reverse() as ChatMessage[]);
      }
    };

    fetchHistory();

    // 2. Subscribe to DB Inserts
    const channel = supabase.channel('global_chat_persist')
    .on(
      'postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'global_messages' }, 
      (payload) => {
       const msg = payload.new as ChatMessage;
       setMessages((prev) => {
         // Keep only the last 20 messages
         const updated = [...prev, msg];
         return updated.slice(-20);
       });
       
       if (!isOpenRef.current) {
         setUnreadCount(prev => prev + 1);
       }
    })
    .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const textPayload = input.trim().substring(0, 140);
    setInput(''); // Clear immediately for UX

    const { error } = await supabase.from('global_messages').insert({
      sender: player.name,
      hero_class: player.heroClass,
      text: textPayload,
    });

    if (error) {
      console.error("Failed to send message:", error.message);
      // Optional: Restore input if failed
      setInput(textPayload);
      alert("Global Chat offline. Check connection.");
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-gray-900 border-2 border-gray-600 p-2 text-yellow-500 hover:border-yellow-400 hover:text-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] flex items-center gap-3 transition-transform hover:-translate-y-1 active:translate-y-0"
      >
        <div className="relative">
          <MessageSquare size={16} />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce border border-gray-900">
              {unreadCount > 9 ? '!' : unreadCount}
            </div>
          )}
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest hidden md:block">Global Chat</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 h-72 bg-gray-900 border-4 border-gray-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="bg-gray-800 p-2 border-b-2 border-gray-700 flex justify-between items-center select-none">
        <div className="flex items-center gap-2 text-[10px] font-bold text-yellow-500 uppercase tracking-wider">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"/> 
          Global Chat
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
          <Minimize2 size={16} />
        </button>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-950/80 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-[8px] text-gray-600 uppercase tracking-widest text-center opacity-50">
                Syncing Global Chat...<br/>(Loading History)
            </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-[9px] leading-relaxed animate-in fade-in slide-in-from-left-2 duration-200">
             <div className="flex items-baseline gap-2 mb-0.5">
                <span className={`font-bold uppercase tracking-tight ${msg.sender === player.name ? 'text-green-400' : 'text-blue-400'}`}>
                    {msg.sender}
                </span>
                <span className="text-[7px] text-gray-600 uppercase font-mono">
                    [{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]
                </span>
             </div>
             <div className="text-gray-300 break-words pl-2 border-l-2 border-gray-800">
                {msg.text}
             </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="bg-gray-800 p-2 border-t-2 border-gray-700 flex gap-2">
        <input 
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-gray-950 border border-gray-600 text-gray-200 text-[10px] px-2 py-2 outline-none focus:border-yellow-500 placeholder-gray-700 font-mono"
          placeholder="Global Chat message..."
          maxLength={140}
        />
        <button 
            type="submit" 
            className="bg-gray-700 text-yellow-500 p-2 border border-gray-600 hover:bg-gray-600 hover:text-white hover:border-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={!input.trim()}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
