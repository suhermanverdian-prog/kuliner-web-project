const AIRepository = require('../repositories/aiRepository');

class AIService {
  static async getSettings(tenantId) {
    try {
      const { data, error } = await AIRepository.getSettings(tenantId);
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.is_ai_enabled && data.ai_api_key) {
        return data;
      }
    } catch (err) {
      console.warn('⚠️ [AI] Failed to fetch settings from DB, falling back to process.env:', err.message);
    }
    
    // Self-Healing Fallback to Environment Variables (Enterprise Master Key)
    if (process.env.GEMINI_API_KEY) {
      return {
        ai_provider: 'gemini',
        ai_api_key: process.env.GEMINI_API_KEY,
        is_ai_enabled: true
      };
    }
    return null;
  }

  static async callGemini(apiKey, systemPrompt, message) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }]
        }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(`GEMINI_API_ERROR: ${data.error.message}`);
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error('GEMINI_EMPTY_RESPONSE');
  }

  static async callOpenAI(apiKey, systemPrompt, message, provider = 'openai') {
    let apiUrl = 'https://api.openai.com/v1/chat/completions';
    let model = 'gpt-3.5-turbo';

    if (provider === 'deepseek') {
        apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        model = 'deepseek-chat';
    } else if (provider === 'grok') {
        apiUrl = 'https://api.x.ai/v1/chat/completions';
        model = 'grok-beta';
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(`${provider.toUpperCase()}_API_ERROR: ${data.error.message}`);
    
    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    }
    throw new Error(`${provider.toUpperCase()}_EMPTY_RESPONSE`);
  }

  static async processChat(tenantId, message, user, apiKey, provider) {
    // 1. Resolve AI Settings
    if (!apiKey || !provider) {
      const settings = await this.getSettings(tenantId);
      if (settings && settings.is_ai_enabled) {
        apiKey = apiKey || settings.ai_api_key;
        provider = provider || settings.ai_provider;
      }
    }

    const now = new Date();
    const offset = 7 * 60 * 60 * 1000; // GMT+7
    const localToday = new Date(now.getTime() + offset).toISOString().split('T')[0];
    const localYesterday = new Date(now.getTime() + offset - 86400000).toISOString().split('T')[0];

    const [revRes, revYestRes, jLinesRes, bRes, topRes, custCount] = await Promise.all([
      AIRepository.getRevenueToday(tenantId, localToday),
      AIRepository.getRevenueYesterday(tenantId, localYesterday, localToday),
      AIRepository.getJournalLines(tenantId),
      AIRepository.getLowStockBahan(tenantId, 5),
      AIRepository.getRecentTransactions(tenantId, 50),
      AIRepository.getCustomerCount(tenantId)
    ]);

    const revenue = revRes?.reduce((s, t) => s + (Number(t.total) || 0), 0) || 0;
    const revenueYesterday = revYestRes?.reduce((s, t) => s + (Number(t.total) || 0), 0) || 0;
    const safeJLines = Array.isArray(jLinesRes) ? jLinesRes : [];
    const hpp = safeJLines.filter(l => l.account_code?.startsWith('5-')).reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const operational = safeJLines.filter(l => l.account_code?.startsWith('6-')).reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const profit = revenue - (hpp + operational);
    const stockKritis = bRes?.length || 0;
    const bahanKritis = bRes?.map(i => i.name).join(', ') || 'Semua aman';

    const itemMap = {};
    (topRes || []).forEach(tx => {
      const items = Array.isArray(tx.items) ? tx.items : [];
      items.forEach(it => {
        itemMap[it.name] = (itemMap[it.name] || 0) + (Number(it.qty) || 0);
      });
    });
    const topItems = Object.entries(itemMap).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([k,v]) => `${k} (${v})`).join(', ');

    const trend = revenue >= revenueYesterday ? 'NAIK' : 'TURUN';
    const systemPrompt = `Anda adalah KEN Intelligence v4.2, Executive Business Analyst. 
    DATA REAL-TIME (Tenant ID: ${tenantId}):
    - Revenue Today: Rp ${revenue.toLocaleString('id-ID')}
    - Revenue Yesterday: Rp ${revenueYesterday.toLocaleString('id-ID')} (${trend})
    - Estimated Profit: Rp ${profit.toLocaleString('id-ID')}
    - Kebutuhan Stok: ${stockKritis} bahan menipis (${bahanKritis})
    - Best Sellers: ${topItems || 'Belum ada data'}
    - CRM Status: ${custCount || 0} pelanggan terdaftar
    
    Analisis data di atas secara tajam. Berikan 1 saran strategis untuk meningkatkan profit hari ini. Bahasa: Profesional, padat, Markdown.`;

    console.log(`🤖 [AI] Request from Tenant: ${tenantId}, Provider: ${provider}`);
    
    let aiResponse;
    let success = false;

    if (apiKey && apiKey.trim().length > 10) {
      try {
        console.log(`🤖 [AI] Memanggil provider utama: ${provider}...`);
        if (provider === 'gemini') {
          aiResponse = await this.callGemini(apiKey, systemPrompt, message);
        } else {
          aiResponse = await this.callOpenAI(apiKey, systemPrompt, message, provider);
        }
        success = true;
      } catch (aiErr) {
        console.warn(`⚠️ [AI] Provider utama (${provider}) gagal: ${aiErr.message}. Mencoba fallback...`);
      }
    }

    if (!success && process.env.GEMINI_API_KEY) {
      try {
        console.log(`🛡️ [AI] Mengaktifkan Self-Healing Fallback ke Master Gemini Key...`);
        aiResponse = await this.callGemini(process.env.GEMINI_API_KEY, systemPrompt, message);
        success = true;
      } catch (geminiErr) {
        console.error('❌ [AI] Fallback ke Master Gemini Key juga gagal:', geminiErr.message);
      }
    }

    if (success && aiResponse) {
      return { response: aiResponse };
    }

    const lowInput = message.toLowerCase();
    let response = "🚨 **Fitur AI Belum Aktif.** Silakan masukkan API Key Anda di menu **Pengaturan > Integrasi AI** untuk mengaktifkan analisis bisnis cerdas.";
    
    if (lowInput.includes('halo')) response = `Halo **${user?.name || 'User'}**! Saya adalah asisten virtual Anda. Hubungkan API Key (DeepSeek/Gemini/OpenAI) agar saya bisa menganalisis data bisnis Anda secara mendalam.`;
    else if (lowInput.includes('omzet') || lowInput.includes('insight')) response = `Omzet Anda saat ini **Rp ${revenue.toLocaleString('id-ID')}**. Penghitungan manual ini terbatas, hubungkan AI untuk analisis yang lebih tajam!`;
    
    return { response };
  }

  static async generateInsights(tenantId, provider, apiKey) {
    const today = new Date(new Date().setHours(0,0,0,0)).toISOString();
    
    const [revRes, invRes, topRes] = await Promise.all([
      AIRepository.getRevenueToday(tenantId, today),
      AIRepository.getLowStockBahan(tenantId, 10),
      AIRepository.getTopTransactionItems(tenantId, 10)
    ]);

    const revenue = revRes?.reduce((s, t) => s + (Number(t.total) || 0), 0) || 0;
    const lowStock = invRes?.map(i => `${i.name} (${i.stock})`).join(', ') || 'Semua stok aman';
    
    const insightPrompt = `Misi: Executive Business Insight. 
    DATA: Omzet Hari Ini Rp ${revenue.toLocaleString('id-ID')}, Stok Menipis: ${lowStock}. 
    TUGAS: Berikan 3 poin insight singkat (maks 15 kata per poin) dalam format JSON array of objects: [{"title": "...", "message": "...", "type": "info|warning"}].`;

    let aiResponse;
    let success = false;

    if (apiKey && apiKey.length > 20) {
      try {
        aiResponse = (provider === 'gemini') 
          ? await this.callGemini(apiKey, insightPrompt, "Berikan 3 insight strategis.")
          : await this.callOpenAI(apiKey, insightPrompt, "Berikan 3 insight strategis.", provider);
        success = true;
      } catch (e) {
        console.warn(`⚠️ [AI Insight] Provider utama (${provider}) gagal: ${e.message}. Mencoba fallback...`);
      }
    }

    if (!success && process.env.GEMINI_API_KEY) {
      try {
        aiResponse = await this.callGemini(process.env.GEMINI_API_KEY, insightPrompt, "Berikan 3 insight strategis.");
        success = true;
      } catch (geminiErr) {
        console.error('❌ [AI Insight] Fallback ke Master Gemini Key gagal:', geminiErr.message);
      }
    }

    if (success && aiResponse) {
      const jsonMatch = aiResponse.match(/\[.*\]/s);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseErr) {
          console.warn('⚠️ [AI Insight] Gagal memparsing JSON hasil AI, fallback ke deterministik.');
        }
      }
    }

    // Fallback
    return [
      { title: 'Monitoring Omzet', message: `Omzet hari ini mencapai Rp ${revenue.toLocaleString('id-ID')}. Pantau terus performa sore ini.`, type: 'info' },
      { title: 'Alert Inventori', message: lowStock !== 'Semua stok aman' ? `Perhatian: ${lowStock} segera habis.` : 'Stok bahan baku terpantau stabil dan aman.', type: lowStock !== 'Semua stok aman' ? 'warning' : 'info' },
      { title: 'Saran Strategis', message: 'Pertimbangkan bundling menu terlaris untuk meningkatkan Average Order Value.', type: 'info' }
    ];
  }
}

module.exports = AIService;
