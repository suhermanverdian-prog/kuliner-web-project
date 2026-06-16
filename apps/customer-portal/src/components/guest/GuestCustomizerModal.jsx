import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  X, Check, Coffee, Thermometer, Droplets, Zap, 
  Flame, Sparkles, FileText, Plus, Minus, Candy, Snowflake, Utensils
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import api from '../../api';

// ─────────────────────────────────────────────
// Default/Fallback options — Beverages
// ─────────────────────────────────────────────
const DEFAULT_SIZES = [
  { key: 'S', label: 'Small', priceAdd: 0 },
  { key: 'R', label: 'Regular', priceAdd: 5000 },
  { key: 'L', label: 'Large', priceAdd: 10000 },
];

const DEFAULT_TEMPERATURES = [
  { key: 'hot',     label: 'Hot' },
  { key: 'iced',    label: 'Iced' },
];

const DEFAULT_SWEETNESS = [
  { key: 'no-sugar', label: 'Tanpa Gula' },
  { key: 'normal',   label: 'Normal' },
  { key: 'extra',    label: 'Extra Manis' },
];

const DEFAULT_STRENGTHS = [
  { key: 'standard', label: 'Standard' },
  { key: 'single',   label: '+1 Shot' },
  { key: 'double',   label: '+2 Shot' },
  { key: 'triple',   label: '+3 Shot' },
];

// Fallback extras
const SWEET_EXTRAS = [
  { key: 'whipped_cream',  label: 'Whipped Cream', priceAdd: 5000 },
  { key: 'cocoa_powder',   label: 'Cocoa Powder',  priceAdd: 0 },
  { key: 'caramel_drizzle',label: 'Caramel',       priceAdd: 3000 },
  { key: 'vanilla_syrup',  label: 'Vanilla Syrup', priceAdd: 5000 },
  { key: 'hazelnut_syrup', label: 'Hazelnut Syrup',priceAdd: 5000 },
];

const TEA_EXTRAS = [
  { key: 'honey',          label: 'Madu Organik',   priceAdd: 4000 },
  { key: 'lemon_slice',    label: 'Lemon Slice',    priceAdd: 2000 },
  { key: 'grass_jelly',    label: 'Grass Jelly',    priceAdd: 4000 },
];

// ─────────────────────────────────────────────
// Default/Fallback options — Food & Snacks
// ─────────────────────────────────────────────
const FOOD_SIZES = [
  { key: 'Regular', label: 'Porsi Regular', priceAdd: 0 },
  { key: 'Jumbo',   label: 'Porsi Jumbo',   priceAdd: 8000 }
];

const FOOD_TEMPERATURES = [
  { key: 'normal',  label: 'Suhu Ruang' },
  { key: 'heated',  label: 'Dipanaskan (Oven)' },
];

const FOOD_EXTRAS = [
  { key: 'extra_cheese',  label: 'Keju Tambahan',  priceAdd: 5000 },
  { key: 'extra_egg',     label: 'Telur Tambahan', priceAdd: 4000 },
  { key: 'extra_sauce',   label: 'Ekstra Sambal',  priceAdd: 2000 }
];

export default function GuestCustomizerModal({ item, onClose, onConfirm }) {
  const nameLower = (item.name || '').toLowerCase();
  const catLower = (item.category || '').toLowerCase();

  // Dynamic heuristics to identify item type
  const isCoffee = (catLower.includes('coffee') && !catLower.includes('non')) || catLower.includes('signature') || nameLower.includes('latte') || nameLower.includes('espresso') || nameLower.includes('kopi') || nameLower.includes('cappuccino') || nameLower.includes('americano') || nameLower.includes('mocha') || nameLower.includes('cold brew');
  const isNonCoffee = catLower.includes('non-coffee') || catLower.includes('cokelat') || catLower.includes('chocolate') || catLower.includes('mocktail') || catLower.includes('juice') || nameLower.includes('chocolate') || nameLower.includes('cokelat') || nameLower.includes('matcha') || nameLower.includes('taro') || nameLower.includes('milkshake');
  const isTea = catLower.includes('tea') || catLower.includes('teh') || nameLower.includes('tea') || nameLower.includes('teh') || nameLower.includes('tisane');
  
  const isBeverage = isCoffee || isNonCoffee || isTea || catLower.includes('beverage') || catLower.includes('drink');

  // Load Customizations states
  const [sizesList, setSizesList] = useState(() => {
    try {
      const ls = JSON.parse(localStorage.getItem('ken_custom_sizes'));
      if (Array.isArray(ls) && ls.length > 0) return ls;
    } catch (_) {}
    return isBeverage ? DEFAULT_SIZES : FOOD_SIZES;
  });

  const [extrasList, setExtrasList] = useState(() => {
    try {
      const ls = JSON.parse(localStorage.getItem('ken_custom_extras'));
      if (Array.isArray(ls) && ls.length > 0) return isTea ? TEA_EXTRAS : ls;
    } catch (_) {}
    return isBeverage ? (isTea ? TEA_EXTRAS : SWEET_EXTRAS) : FOOD_EXTRAS;
  });

  const [milksList, setMilksList] = useState(() => {
    try {
      const ls = JSON.parse(localStorage.getItem('ken_custom_milks'));
      if (Array.isArray(ls) && ls.length > 0) {
        return [{ key: 'standard', label: 'Standard', priceAdd: 0 }, ...ls, { key: 'no-milk', label: 'Tanpa Susu', priceAdd: 0 }];
      }
    } catch (_) {}
    const defaultMilks = [
      { key: 'oat',     label: 'Oat Milk',     priceAdd: 5000, dose: 150, unit: 'ml', bahanId: '' },
      { key: 'almond',  label: 'Almond Milk',  priceAdd: 5000, dose: 150, unit: 'ml', bahanId: '' },
      { key: 'soy',     label: 'Soy Milk',     priceAdd: 5000, dose: 150, unit: 'ml', bahanId: '' },
    ];
    return [{ key: 'standard', label: 'Standard', priceAdd: 0 }, ...defaultMilks, { key: 'no-milk', label: 'Tanpa Susu', priceAdd: 0 }];
  });

  // State hooks
  const [size, setSize] = useState(() => sizesList[0]?.key || (isBeverage ? 'S' : 'Regular'));
  const [temperature, setTemperature] = useState(() => isBeverage ? 'iced' : 'normal');
  const [sweetness, setSweetness] = useState('normal');
  const [strength, setStrength] = useState('standard');
  const [milk, setMilk] = useState('standard');
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [note, setNote] = useState('');
  const [qty, setQty] = useState(1);

  // Fetch from Supabase config
  useEffect(() => {
    api.getCustomisations()
      .then(res => {
        const cfg = res?.data || res || {};

        const dbSizes = cfg['ken_custom_sizes'];
        if (Array.isArray(dbSizes) && dbSizes.length > 0) {
          setSizesList(isBeverage ? dbSizes : FOOD_SIZES);
          localStorage.setItem('ken_custom_sizes', JSON.stringify(dbSizes));
        }

        const dbExtras = cfg['ken_custom_extras'];
        if (Array.isArray(dbExtras) && dbExtras.length > 0) {
          setExtrasList(isBeverage ? (isTea ? TEA_EXTRAS : dbExtras) : FOOD_EXTRAS);
          localStorage.setItem('ken_custom_extras', JSON.stringify(dbExtras));
        }

        const dbMilks = cfg['ken_custom_milks'];
        if (Array.isArray(dbMilks) && dbMilks.length > 0) {
          const milks = [{ key: 'standard', label: 'Standard', priceAdd: 0 }, ...dbMilks, { key: 'no-milk', label: 'Tanpa Susu', priceAdd: 0 }];
          setMilksList(milks);
          localStorage.setItem('ken_custom_milks', JSON.stringify(dbMilks));
        }

        const dbEspresso = cfg['ken_custom_espresso'];
        if (dbEspresso) {
          try {
            const parsed = typeof dbEspresso === 'string' ? JSON.parse(dbEspresso) : dbEspresso;
            const price = Number(parsed.priceAdd || parsed.price || 5000);
            localStorage.setItem('ken_custom_espresso', JSON.stringify(parsed));
            localStorage.setItem('ken_price_espresso_shot', price.toString());
            localStorage.setItem('ken_dose_espresso', (Number(parsed.dose) || 7).toString());
          } catch (e) {
            console.warn('[KEN GuestCustomizer] Failed to parse dbEspresso:', e);
          }
        }
      })
      .catch(err => console.warn('[KEN GuestCustomizer] Failed to fetch customisations:', err));
  }, [isBeverage, isTea]);

  // Calculations
  const sizeObj = sizesList.find(s => s.key === size);
  const sizeCost = sizeObj?.priceAdd || 0;

  const espressoPrice = Number(localStorage.getItem('ken_price_espresso_shot') || 5000);
  const strengthObj = DEFAULT_STRENGTHS.find(s => s.key === strength);
  const strengthCost = isCoffee && strength === 'single' ? espressoPrice 
                     : isCoffee && strength === 'double' ? espressoPrice * 2 
                     : isCoffee && strength === 'triple' ? espressoPrice * 3 : 0;

  const milkObj = milksList.find(m => m.key === milk);
  const milkCost = (isCoffee || isNonCoffee) ? (milkObj?.priceAdd || 0) : 0;

  const extrasCost = selectedExtras.reduce((sum, key) => {
    const ex = extrasList.find(e => e.key === key);
    return sum + (ex?.priceAdd || ex?.price || 0);
  }, 0);

  const finalPriceSingle = item.price + sizeCost + strengthCost + milkCost + extrasCost;
  const finalPriceTotal = finalPriceSingle * qty;

  const handleToggleExtra = (key) => {
    setSelectedExtras(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleConfirmCustomization = () => {
    const customization = {
      size,
      temperature,
      sweetness: isBeverage ? sweetness : undefined,
      strength: isCoffee ? strength : undefined,
      milk: (isCoffee || isNonCoffee) ? milk : undefined,
      extras: selectedExtras,
      note: note.trim(),
      espressoDose: isCoffee ? Number(localStorage.getItem('ken_dose_espresso') || 7) : 0,
      milkDose: (isCoffee || isNonCoffee) ? Number(localStorage.getItem('ken_dose_milk') || 150) : 0,
      customRecipe: [] // Empty BOM template for guest self checkout mapping
    };

    const summaryParts = [
      sizeObj?.label || size,
      isBeverage ? (DEFAULT_TEMPERATURES.find(t => t.key === temperature)?.label || temperature) : (FOOD_TEMPERATURES.find(t => t.key === temperature)?.label || temperature),
      isBeverage ? (DEFAULT_SWEETNESS.find(s => s.key === sweetness)?.label || sweetness) : null,
      (isCoffee || isNonCoffee) && milk !== 'standard' ? (milksList.find(m => m.key === milk)?.label || milk) : null,
      isCoffee && strength !== 'standard' ? (DEFAULT_STRENGTHS.find(s => s.key === strength)?.label || strength) : null,
      ...selectedExtras.map(key => extrasList.find(e => e.key === key)?.label || key)
    ].filter(Boolean);

    const customizationSummary = summaryParts.join(' · ');

    onConfirm({
      customization,
      customizationSummary,
      finalPrice: finalPriceTotal,
      qty // Passing updated quantity to add multiple units directly
    });
  };

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[2000] bg-zinc-950/20 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop area click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <Card className="relative w-full max-w-md bg-card border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col max-h-[88vh] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 flex justify-between items-center bg-transparent">
          <div>
            <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50">Kustomisasi Menu</h3>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mt-0.5">{item.name}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Customizer Panel */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Temperature / Serving Temperature */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Thermometer size={16} className="text-amber-500 dark:text-amber-400" />
              <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {isBeverage ? 'Suhu Minuman' : 'Suhu Penyajian'}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(isBeverage ? DEFAULT_TEMPERATURES : FOOD_TEMPERATURES).map(t => {
                const isSelected = temperature === t.key;
                const isHot = t.key === 'hot' || t.key === 'heated';
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTemperature(t.key)}
                    className={`h-12 rounded-lg border-2 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 ${
                      isSelected
                        ? isHot 
                          ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/20 dark:border-rose-500 dark:text-rose-400' 
                          : 'bg-sky-50 border-sky-500 text-sky-700 dark:bg-sky-950/20 dark:border-sky-500 dark:text-sky-400'
                        : 'bg-white/40 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
                    }`}
                  >
                    {isHot ? (
                      <Flame size={14} className={isSelected ? 'text-rose-500' : 'text-zinc-400'} />
                    ) : (
                      <Snowflake size={14} className={isSelected ? 'text-sky-500' : 'text-zinc-400'} />
                    )}
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cup / Portion Size */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {isBeverage ? (
                <Coffee size={16} className="text-amber-500 dark:text-amber-400" />
              ) : (
                <Utensils size={16} className="text-amber-500 dark:text-amber-400" />
              )}
              <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {isBeverage ? 'Ukuran Cup' : 'Porsi Makanan'}
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {sizesList.map(s => {
                const isSelected = size === s.key;
                // Scale visualization for cup sizes
                const iconScale = s.key === 'S' || s.key === 'Regular' ? 'scale-75' : s.key === 'R' || s.key === 'Medium' ? 'scale-90' : 'scale-110';
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSize(s.key)}
                    className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center p-2 transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:border-amber-400 dark:text-zinc-900 shadow-lg shadow-amber-500/20'
                        : 'bg-white/40 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
                    }`}
                  >
                    {isBeverage ? (
                      <Coffee size={16} className={`mb-1 transition-transform ${iconScale} ${isSelected ? 'text-white dark:text-zinc-900' : 'text-zinc-400'}`} />
                    ) : (
                      <Utensils size={16} className={`mb-1 transition-transform ${iconScale} ${isSelected ? 'text-white dark:text-zinc-900' : 'text-zinc-400'}`} />
                    )}
                    <span className="text-[10px] font-bold tracking-tight">{s.label}</span>
                    {s.priceAdd > 0 && (
                      <span className={`text-[9px] font-mono tabular-nums mt-0.5 ${isSelected ? 'text-white/90 dark:text-zinc-900/80' : 'text-amber-600 dark:text-amber-400'}`}>
                        +{formatRupiah(s.priceAdd)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sweetness Option (Beverage Only) */}
          {isBeverage && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Candy size={16} className="text-amber-500 dark:text-amber-400" />
                <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Tingkat Kemanisan</label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {DEFAULT_SWEETNESS.map(s => {
                  const isSelected = sweetness === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSweetness(s.key)}
                      className={`h-11 rounded-lg border-2 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:border-amber-400 dark:text-zinc-900 shadow-md shadow-amber-500/10'
                          : 'bg-white/40 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
                      }`}
                    >
                      <Candy size={12} className={isSelected ? 'text-white dark:text-zinc-900' : 'text-zinc-400'} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Espresso Shots Strength (Coffee Only) */}
          {isCoffee && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-500 dark:text-amber-400" />
                <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Kekuatan Kopi (Espresso Shots)</label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_STRENGTHS.map(s => {
                  const isSelected = strength === s.key;
                  const priceAdd = s.key === 'single' ? espressoPrice : s.key === 'double' ? espressoPrice * 2 : s.key === 'triple' ? espressoPrice * 3 : 0;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setStrength(s.key)}
                      className={`h-14 rounded-lg border-2 text-[10px] font-black uppercase tracking-tight flex flex-col items-center justify-center p-1 transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:border-amber-400 dark:text-zinc-900 shadow-md shadow-amber-500/15'
                          : 'bg-white/40 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
                      }`}
                    >
                      <span>{s.label}</span>
                      {priceAdd > 0 && (
                        <span className={`text-[8px] font-mono tabular-nums mt-0.5 ${isSelected ? 'text-white/80 dark:text-zinc-900/70' : 'text-amber-600 dark:text-amber-400'}`}>
                          +{formatRupiah(priceAdd)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alternative Milk Option (Coffee & Non-Coffee Beverages) */}
          {(isCoffee || isNonCoffee) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Droplets size={16} className="text-amber-500 dark:text-amber-400" />
                <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Opsi Susu Alternatif</label>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {milksList.map(m => {
                  const isSelected = milk === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMilk(m.key)}
                      className={`h-9 px-3.5 rounded-lg border-2 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:border-amber-400 dark:text-zinc-900 shadow-sm shadow-amber-500/10'
                          : 'bg-white/40 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
                      }`}
                    >
                      {m.label}
                      {m.priceAdd > 0 && (
                        <span className={`text-[9px] font-mono font-bold tabular-nums ml-0.5 ${isSelected ? 'text-white/90 dark:text-zinc-900/80' : 'text-amber-600 dark:text-amber-400'}`}>
                          +{formatRupiah(m.priceAdd)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extras / Toppings Selection */}
          {extrasList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500 dark:text-amber-400" />
                <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  {isBeverage ? 'Tambah Topping (Extras)' : 'Tambahan / Topping'}
                </label>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {extrasList.map(extra => {
                  const isChecked = selectedExtras.includes(extra.key);
                  const price = extra.priceAdd || extra.price || 0;
                  return (
                    <button
                      key={extra.key}
                      type="button"
                      onClick={() => handleToggleExtra(extra.key)}
                      className={`w-full px-4 py-3 rounded-xl border-2 flex items-center justify-between transition-all active:scale-[0.98] text-left ${
                        isChecked
                          ? 'border-amber-500 bg-amber-50/20 dark:border-amber-400 dark:bg-amber-950/10'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-800/20 hover:bg-zinc-50/55 dark:hover:bg-zinc-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:border-amber-400 dark:text-zinc-900' : 'border-zinc-300 dark:border-zinc-700'
                        }`}>
                           {isChecked && <Check size={12} strokeWidth={4} />}
                        </div>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{extra.label || extra.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">+{formatRupiah(price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes / Special Instructions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-amber-500 dark:text-amber-400" />
              <label className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Catatan Khusus</label>
            </div>
            <textarea
              className="w-full p-4 text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-800/20 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-xl"
              placeholder="Contoh: Tanpa whipped cream, susu dipisah, dll."
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Action Panel Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800/80 bg-transparent flex flex-col gap-3">
          <div className="flex items-center justify-between">
            {/* Quantity Selector */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Jumlah</span>
              <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  <Minus size={12} strokeWidth={2.5} />
                </button>
                <span className="w-5 text-center font-mono font-bold tabular-nums text-xs text-zinc-900 dark:text-zinc-100">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(q => q + 1)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Price Preview */}
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Total Harga</p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums leading-tight">
                {formatRupiah(finalPriceTotal)}
              </p>
            </div>
          </div>

          <Button
            onClick={handleConfirmCustomization}
            className="w-full h-11 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 font-black text-sm rounded-lg active:scale-95 shadow-lg shadow-amber-500/20 dark:shadow-amber-400/5 transition-all flex items-center justify-center gap-2"
          >
            Tambahkan ke Keranjang
          </Button>
        </div>
      </Card>
    </div>
  );
}
