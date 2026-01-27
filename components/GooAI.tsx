import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';

interface Message {
  role: 'user' | 'goo';
  text: string;
  links?: { uri: string; title: string }[];
}

export const GooAI: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Connect to secure serverless proxy
      const response = await fetch('/api/goo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Uplink unstable. Retrying connection...');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'goo', 
        text: data.text || "Uplink unstable. Retrying connection...", 
        links: data.links 
      }]);
    } catch (e: any) {
      console.error("Goo Terminal Failure:", e);
      // Specific error messaging as per requirements
      const isConnectionError = e.message.includes('Uplink unstable');
      setMessages(prev => [...prev, { 
        role: 'goo', 
        text: isConnectionError 
          ? 'Uplink unstable. Retrying connection...' 
          : "Terminal error. Gemini uplink failed. Check connection parameters." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="max-w-4xl mx-auto h-[700px] flex flex-col glass-panel overflow-hidden rounded-none border-line animate-fade-in-up">
      {/* Terminal Header */}
      <div className="px-6 py-4 border-b border-line bg-black/40 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-brand rounded-full animate-pulse shadow-[0_0_8px_var(--color-brand)]" />
          <h2 className="font-heading text-xl italic text-white tracking-tighter">GOO_INTEL_TERMINAL</h2>
        </div>
        <Button variant="ghost" onClick={clearChat} className="text-[10px] !py-1 !px-3 border-white/10">PURGE_LOGS</Button>
      </div>

      {/* Chat History */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
             <div className="text-4xl mb-4 font-heading italic text-brand tracking-tighter">GOO</div>
             <p className="font-mono text-xs max-w-xs uppercase tracking-widest leading-relaxed">
               Awaiting query regarding Lookism lore, power scaling, or crew dynamics.
             </p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}>
            <div className={`max-w-[85%] p-4 rounded-sm font-mono text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-brand/10 border border-brand/20 text-white' 
                : 'bg-white/5 border border-line text-white/90'
            }`}>
              <div className="text-[10px] font-black text-brand mb-2 uppercase tracking-[0.2em]">
                {m.role === 'user' ? 'AGENT' : 'GOO'}
              </div>
              <div className="whitespace-pre-wrap">{m.text}</div>
              
              {m.links && m.links.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-[9px] font-bold text-muted uppercase tracking-widest mb-2">Validated Sources:</div>
                  <div className="flex flex-wrap gap-2">
                    {m.links.map((link, li) => (
                      <a 
                        key={li} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] bg-white/5 border border-line px-2 py-1 hover:border-brand hover:text-brand transition-colors truncate max-w-[200px]"
                      >
                        {link.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start">
             <div className="bg-white/5 border border-line p-4 rounded-sm font-mono text-sm text-muted animate-pulse">
                <div className="text-[10px] font-black text-brand mb-2 uppercase tracking-[0.2em]">GOO</div>
                REASONING THROUGH PTJ DATABASE...
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-line bg-black/40">
        <div className="flex gap-4">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
            placeholder="Query Lookism database..."
            className="flex-1 bg-bg0 border border-line px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-brand transition-all placeholder:text-muted/30"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()} className="px-8 shrink-0">
            {loading ? 'BUSY' : 'EXEC'}
          </Button>
        </div>
        <div className="mt-3 flex justify-between items-center opacity-30">
           <span className="text-[8px] font-mono tracking-widest uppercase">GND_TRUTH: ENABLED</span>
           <span className="text-[8px] font-mono tracking-widest uppercase">PTJ_VER: 4.8.2</span>
        </div>
      </div>
    </div>
  );
};