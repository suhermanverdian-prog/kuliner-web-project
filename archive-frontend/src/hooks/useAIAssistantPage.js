import { useState, useEffect, useRef } from 'react';
import { api } from '@/api';

export function useAIAssistantPage(user) {
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      content: `Halo **${user?.name || 'User'}**! Saya adalah KEN Intelligence v4.1. Sebagai **${user?.is_superadmin ? 'Super Admin' : 'Business Owner'}**, saya telah memetakan data real-time Anda. Apa analisis yang Anda perlukan?`,
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${api.url}/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, user })
      });
      
      const data = await res.json();
      const aiMsg = { 
        role: 'ai', 
        content: data.response || "Maaf, sistem sedang sibuk. Coba beberapa saat lagi.", 
        time: new Date() 
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'ai', content: "Terjadi kesalahan koneksi ke otak AI.", time: new Date() }]);
      setIsTyping(false);
    }
  };

  return {
    messages, setMessages,
    input, setInput,
    isTyping,
    scrollRef,
    handleSend
  };
}
