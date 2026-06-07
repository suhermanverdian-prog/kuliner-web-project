import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { 
  Bot, Send, User, Sparkles, TrendingUp, 
  AlertTriangle, Package, DollarSign, 
  Trash2, BrainCircuit, ShieldCheck, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useAIAssistantPage } from '../hooks/useAIAssistantPage';

export default function AIAssistantPage() {
  const user = useAppStore(state => state.user);
  const {
    messages, setMessages,
    input, setInput,
    isTyping,
    scrollRef,
    handleSend
  } = useAIAssistantPage(user);

  // Elite Markdown & Agentic Action Parser
  const renderContent = (content) => {
    let textContent = content;
    let actionData = null;

    // Ekstrak JSON block jika ada
    const jsonMatch = textContent.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        actionData = JSON.parse(jsonMatch[1]);
        textContent = textContent.replace(jsonMatch[0], '').trim();
      } catch (e) {
        console.error("Gagal parsing action JSON:", e);
      }
    }

    let formatted = textContent
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-600 dark:text-amber-400 font-bold">$1</strong>')
      .replace(/^\s*[-*]\s+(.*)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n/g, '<br />');
    
    return (
      <div className="space-y-4">
        <div dangerouslySetInnerHTML={{ __html: formatted }} />
        {actionData && actionData.action === 'CREATE_PO' && (
          <div className="mt-4 p-4 bg-background border border-amber-500/30 rounded-lg shadow-lg flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Suggested Action</p>
              <p className="text-xs font-bold text-foreground">Draft PO: {actionData.payload.qty} {actionData.payload.item}</p>
            </div>
            <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600" onClick={() => alert('Fitur Draft PO sedang diaktifkan!')}>
              EXECUTE PO
            </Button>
          </div>
        )}
      </div>
    );
  };

  const suggestions = user?.role === 'super_admin' ? [
    { icon: Globe, text: "Performa seluruh cabang", cmd: "Berapa total omzet seluruh cabang?" },
    { icon: ShieldCheck, text: "Audit keamanan sistem", cmd: "Cek log aktivitas mencurigakan" },
    { icon: TrendingUp, text: "Tren produk global", cmd: "Produk apa yang paling laku di semua toko?" }
  ] : [
    { icon: DollarSign, text: "Analisis Laba Hari Ini", cmd: "Berapa laba bersih saya hari ini?" },
    { icon: Package, text: "Cek Stok Kritis", cmd: "Apa saja bahan yang hampir habis?" },
    { icon: AlertTriangle, text: "Deteksi Fraud Kasir", cmd: "Apakah ada pembatalan transaksi yang tidak wajar?" }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-6 animate-in fade-in duration-500 font-mono tabular-nums">
      {/* Header AI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 ">
            <BrainCircuit size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter flex items-center gap-4">
              KEN Intelligence
              <span className={cn(
                "px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                user?.role === 'super_admin' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-500/20" : "bg-primary/10 text-primary border border-primary/20"
              )}>
                {user?.role === 'super_admin' ? 'Master Level' : 'Store Level'}
              </span>
            </h2>
            <p className="text-zinc-500 dark:text-zinc-100 text-sm font-medium">Asisten cerdas berbasis AI untuk pengelolaan bisnis Anda.</p>
          </div>
        </div>
        <Button variant="outline" className="h-12 rounded-lg gap-2 font-bold" onClick={() => setMessages([messages[0]])}>
          <Trash2 size={16} /> Bersihkan Chat
        </Button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col shadow-2xl border-none rounded-lg overflow-hidden bg-card backdrop-blur-sm relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent via-zinc-900 to-accent" />
          
          <CardContent 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
          >
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex gap-4 animate-in slide-in-from-bottom-2 duration-300",
                msg.role === 'user' ? "flex-row-reverse" : ""
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === 'ai' ? "bg-zinc-900 text-zinc-900 dark:text-zinc-100" : "bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900"
                )}>
                  {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className={cn(
                  "max-w-[80%] space-y-1",
                  msg.role === 'user' ? "items-end flex flex-col" : ""
                )}>
                  <div className={cn(
                    "p-4 rounded-lg text-sm leading-relaxed",
                    msg.role === 'ai' 
                      ? "bg-background border shadow-sm text-zinc-800" 
                      : "bg-zinc-900 text-zinc-50 shadow-xl"
                  )}>
                    {renderContent(msg.content)}
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-100 uppercase tracking-widest px-2">
                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center"><Bot size={20} /></div>
                <div className="bg-background p-4 rounded-lg w-24 h-10" />
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 bg-background border-t backdrop-blur-md">
            <form onSubmit={handleSend} className="w-full flex gap-4 relative">
              <Input 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Tanyakan sesuatu tentang bisnis Anda..."
                className="h-14 rounded-lg pl-6 pr-16 bg-background border-none shadow-inner text-base font-medium focus-visible:ring-amber-500/20"
                disabled={isTyping}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-2 h-10 w-10 rounded-lg "
              >
                <Send size={18} />
              </Button>
            </form>
          </CardFooter>
        </Card>

        {/* Info & Suggestions */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          <Card className="border-none shadow-xl rounded-lg ">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center mb-2">
                <Sparkles className="text-amber-600 dark:text-amber-400" size={20} />
              </div>
              <CardTitle className="text-lg">Smart Suggestions</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs italic">Klik untuk bertanya otomatis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {(user?.is_superadmin ? [
                { icon: Globe, text: "Performa seluruh cabang", cmd: "Berapa total omzet seluruh cabang?" },
                { icon: ShieldCheck, text: "Audit keamanan sistem", cmd: "Cek log aktivitas mencurigakan" },
                { icon: TrendingUp, text: "Tren produk global", cmd: "Produk apa yang paling laku di semua toko?" }
              ] : [
                { icon: DollarSign, text: "Analisis Laba Hari Ini", cmd: "Berapa laba bersih saya hari ini?" },
                { icon: Package, text: "Cek Stok Kritis", cmd: "Apa saja bahan yang hampir habis?" },
                { icon: AlertTriangle, text: "Deteksi Fraud Kasir", cmd: "Apakah ada pembatalan transaksi yang tidak wajar?" }
              ]).map((s, i) => (
                <button 
                  key={i}
                  onClick={() => { setInput(s.cmd); }}
                  className="w-full text-left p-4 rounded-lg bg-background/5 hover:bg-background/10 border border-white/5 transition-all group flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-lg ">
                    <s.icon size={14} />
                  </div>
                  <span className="text-xs font-bold">{s.text}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-lg flex-1">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-100">Status Koneksi AI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/5 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-lg bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold">Data Engine Online</span>
                </div>
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-lg bg-blue-500" />
                  <span className="text-xs font-bold">Tenant Isolation: Active</span>
                </div>
                <Globe size={14} className="text-blue-500" />
              </div>
              <div className="p-4 rounded-lg bg-subtle border border-border-subtle mt-4">
                 <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-100 font-medium italic">
                   "AI ini menggunakan filter data **{user?.role === 'super_admin' ? 'Global System' : 'Tenant-Specific'}** untuk menjamin keamanan dan akurasi informasi."
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
