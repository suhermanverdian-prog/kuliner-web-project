import { useState } from 'react';
import { Key, RefreshCw, Trash2, Copy, Plus, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

const MOCK_KEYS = [
  { id: 1, name: 'POS Integration', key: 'ken_live_abc123...', scope: 'pos:read,pos:write', created: '2026-05-01', status: 'active' },
  { id: 2, name: 'Reporting Bot',   key: 'ken_live_xyz789...', scope: 'reports:read',       created: '2026-05-15', status: 'active' },
  { id: 3, name: 'Old Webhook',     key: 'ken_live_revk000...', scope: 'all',               created: '2026-04-01', status: 'revoked' },
];

const MOCK_WEBHOOKS = [
  { id: 1, url: 'https://hooks.example.com/payment', events: 'payment.success', status: 'active' },
  { id: 2, url: 'https://hooks.example.com/order',   events: 'order.created',   status: 'active' },
];

export default function APIWebhookPage() {
  const [apiKeys, setApiKeys] = useState(MOCK_KEYS);
  const [webhooks, setWebhooks] = useState(MOCK_WEBHOOKS);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState('pos:read');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvent, setNewWebhookEvent] = useState('payment.success');
  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('api-keys');

  const generateKey = () => {
    if (!newKeyName.trim()) return;
    const key = `ken_live_${Math.random().toString(36).substring(2, 14)}...`;
    setApiKeys(prev => [
      { id: Date.now(), name: newKeyName, key, scope: newKeyScope, created: new Date().toLocaleDateString('id-ID'), status: 'active' },
      ...prev,
    ]);
    setNewKeyName('');
  };

  const revokeKey = (id) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
  };

  const copyKey = (id, key) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const addWebhook = () => {
    if (!newWebhookUrl.trim()) return;
    setWebhooks(prev => [
      { id: Date.now(), url: newWebhookUrl, events: newWebhookEvent, status: 'active' },
      ...prev,
    ]);
    setNewWebhookUrl('');
  };

  const deleteWebhook = (id) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const testWebhook = (webhook) => {
    alert(`🚀 Test payload dikirim ke:\n${webhook.url}\n\nEvent: ${webhook.events}`);
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2">
        <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider rounded border border-amber-500/20">
          Integrasi Hub
        </span>
        <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">API Key &amp; Webhook</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          Generate / revoke API keys dan kelola webhook endpoint untuk integrasi sistem eksternal.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        {[
          { id: 'api-keys', label: 'API Keys',  icon: Key },
          { id: 'webhooks', label: 'Webhooks', icon: Globe },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-6 py-3 border-b-2 font-black text-xs uppercase tracking-widest transition-all',
              activeTab === tab.id
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* API KEYS TAB */}
      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          {/* Generate New Key */}
          <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-background">
              <CardTitle className="text-base font-black uppercase tracking-tighter flex items-center gap-2">
                <Plus size={16} className="text-amber-500" /> Generate API Key Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Nama Key</label>
                  <Input
                    placeholder="Contoh: POS Integration"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Scope</label>
                  <select
                    value={newKeyScope}
                    onChange={e => setNewKeyScope(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-foreground font-bold"
                  >
                    <option value="pos:read">pos:read</option>
                    <option value="pos:read,pos:write">pos:read,pos:write</option>
                    <option value="reports:read">reports:read</option>
                    <option value="all">all (superadmin)</option>
                  </select>
                </div>
                <Button
                  onClick={generateKey}
                  className="h-10 font-black uppercase tracking-widest text-[10px] bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500"
                >
                  <Key size={14} className="mr-2" /> Generate Key
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Keys List */}
          <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background text-[9px] font-black uppercase tracking-wider text-zinc-500 border-b border-border">
                    <th className="px-6 py-4">Nama</th>
                    <th className="px-6 py-4">API Key</th>
                    <th className="px-6 py-4">Scope</th>
                    <th className="px-6 py-4">Dibuat</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {apiKeys.map(k => (
                    <tr key={k.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 font-black text-sm text-foreground">{k.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">{k.key}</td>
                      <td className="px-6 py-4 text-[9px] font-black uppercase text-zinc-500">{k.scope}</td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500 tabular-nums">{k.created}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[8px] font-black uppercase border',
                          k.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-800'
                        )}>
                          {k.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-foreground" onClick={() => copyKey(k.id, k.key)}>
                          {copiedId === k.id ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </Button>
                        {k.status === 'active' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-rose-500" onClick={() => revokeKey(k.id)}>
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* WEBHOOKS TAB */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          {/* Add Webhook */}
          <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
            <CardHeader className="p-6 border-b border-border bg-background">
              <CardTitle className="text-base font-black uppercase tracking-tighter flex items-center gap-2">
                <Plus size={16} className="text-amber-500" /> Tambah Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Endpoint URL</label>
                  <Input
                    placeholder="https://yourserver.com/webhook"
                    value={newWebhookUrl}
                    onChange={e => setNewWebhookUrl(e.target.value)}
                    className="h-10 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Event Type</label>
                  <select
                    value={newWebhookEvent}
                    onChange={e => setNewWebhookEvent(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-foreground font-bold"
                  >
                    <option value="payment.success">payment.success</option>
                    <option value="order.created">order.created</option>
                    <option value="tenant.created">tenant.created</option>
                    <option value="user.login">user.login</option>
                  </select>
                </div>
                <Button
                  onClick={addWebhook}
                  className="h-10 font-black uppercase tracking-widest text-[10px] bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-zinc-900 dark:hover:bg-amber-500"
                >
                  <Globe size={14} className="mr-2" /> Daftarkan Webhook
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Webhooks List */}
          <Card className="border-none bg-card shadow-xl rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background text-[9px] font-black uppercase tracking-wider text-zinc-500 border-b border-border">
                    <th className="px-6 py-4">URL Endpoint</th>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {webhooks.map(w => (
                    <tr key={w.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-foreground">{w.url}</td>
                      <td className="px-6 py-4 text-[9px] font-black uppercase text-zinc-500">{w.events}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase border bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800">
                          {w.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[9px] font-black uppercase"
                          onClick={() => testWebhook(w)}
                        >
                          Test
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-rose-500" onClick={() => deleteWebhook(w.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
