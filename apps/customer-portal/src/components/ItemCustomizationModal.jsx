import { useState, useEffect, useMemo } from 'react';
import { 
  X, Plus, Minus, Coffee, Thermometer, Droplets, Zap, 
  SlidersHorizontal, Utensils, Flame, Sparkles, FileText, 
  CheckCircle2, Snowflake, Candy, Sliders
} from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { formatRupiah } from '../utils/formatters';
import api from '../api';

// ─────────────────────────────────────────────
// Default options — Beverage Sizes
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
  { key: 'less',     label: 'Sedikit' },
  { key: 'normal',   label: 'Normal' },
  { key: 'sweet',    label: 'Manis' },
  { key: 'extra',    label: 'Extra Manis' },
];

const DEFAULT_STRENGTHS = [
  { key: 'standard', label: 'Standard' },
  { key: 'single',   label: '+1 Shot' },
  { key: 'double',   label: '+2 Shot' },
  { key: 'triple',   label: '+3 Shot' },
];

// DEFAULT_MILKS has been refactored to be dynamically loaded from localStorage inside the component.

// Coffee & Chocolate Toppings
const SWEET_EXTRAS = [
  { key: 'whipped_cream',  label: 'Whipped Cream', priceAdd: 5000 },
  { key: 'cocoa_powder',   label: 'Cocoa Powder',  priceAdd: 0 },
  { key: 'caramel_drizzle',label: 'Caramel',       priceAdd: 3000 },
  { key: 'vanilla_syrup',  label: 'Vanilla Syrup', priceAdd: 5000 },
  { key: 'hazelnut_syrup', label: 'Hazelnut Syrup',priceAdd: 5000 },
];

// Tea-specific Toppings
const TEA_EXTRAS = [
  { key: 'honey',          label: 'Madu Organik',   priceAdd: 4000 },
  { key: 'lemon_slice',    label: 'Lemon Slice',    priceAdd: 2000 },
  { key: 'grass_jelly',    label: 'Grass Jelly',    priceAdd: 4000 },
  { key: 'chia_seeds',     label: 'Chia Seeds',     priceAdd: 3000 },
];

// ─────────────────────────────────────────────
// Default options — Food & Snacks
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

export default function ItemCustomizationModal({ item, onConfirm, onClose }) {
  // Category resolution
  const name = (item.name || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  
  // High-performance heuristics to detect beverage vs food
  const isCoffee = (cat.includes('coffee') && !cat.includes('non')) || cat.includes('signature') || name.includes('latte') || name.includes('espresso') || name.includes('kopi') || name.includes('cappuccino') || name.includes('americano') || name.includes('mocha') || name.includes('cold brew');
  const isNonCoffee = cat.includes('non-coffee') || cat.includes('cokelat') || cat.includes('chocolate') || cat.includes('mocktail') || cat.includes('juice') || name.includes('chocolate') || name.includes('cokelat') || name.includes('matcha') || name.includes('taro') || name.includes('milkshake');
  const isTea = cat.includes('tea') || cat.includes('teh') || name.includes('tea') || name.includes('teh') || name.includes('tisane');
  
  const isBeverage = isCoffee || isNonCoffee || isTea || cat.includes('beverage') || cat.includes('drink');

  // ─── State modifier — diisi dari Supabase via getCustomisations() ───
  const [sizes,     setSizes]     = useState(() => {
    try {
      const ls = JSON.parse(localStorage.getItem('ken_custom_sizes'));
      if (Array.isArray(ls) && ls.length > 0) return ls;
    } catch (_) {}
    return DEFAULT_SIZES;
  });
  const [extras,    setExtras]    = useState(() => {
    try {
      const ls = JSON.parse(localStorage.getItem('ken_custom_extras'));
      if (Array.isArray(ls) && ls.length > 0) return isTea ? TEA_EXTRAS : ls;
    } catch (_) {}
    return isTea ? TEA_EXTRAS : SWEET_EXTRAS;
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
  const [customisationsLoading, setCustomisationsLoading] = useState(true);

  // ─── Fetch customisations dari Supabase ───────────────────────────────
  useEffect(() => {
    api.getCustomisations()
      .then(res => {
        const cfg = res?.data || res || {};

        const dbSizes = cfg['ken_custom_sizes'];
        if (Array.isArray(dbSizes) && dbSizes.length > 0) {
          setSizes(dbSizes);
          localStorage.setItem('ken_custom_sizes', JSON.stringify(dbSizes));
        }

        const dbExtras = cfg['ken_custom_extras'];
        if (Array.isArray(dbExtras) && dbExtras.length > 0) {
          setExtras(isTea ? TEA_EXTRAS : dbExtras);
          localStorage.setItem('ken_custom_extras', JSON.stringify(dbExtras));
        }

        const dbMilks = cfg['ken_custom_milks'];
        if (Array.isArray(dbMilks) && dbMilks.length > 0) {
          setMilksList([
            { key: 'standard', label: 'Standard',   priceAdd: 0 },
            ...dbMilks,
            { key: 'no-milk',  label: 'Tanpa Susu', priceAdd: 0 },
          ]);
          localStorage.setItem('ken_custom_milks', JSON.stringify(dbMilks));
        }
      })
      .catch(err => {
        console.warn('[KEN CustomizationModal] Failed to fetch customisations, using local defaults/localStorage:', err);
      })
      .finally(() => setCustomisationsLoading(false));
  }, [isTea]);

  const isGuest = useMemo(() => {
    try {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.includes('/guest') || path.includes('/store') || path.includes('/order') || path.includes('/customer')) {
          console.log("[KEN CustomizationModal] isGuest=true (URL Path Match):", path);
          return true;
        }
      }
      const storageStr = localStorage.getItem('ken-enterprise-storage');
      if (storageStr) {
        const storage = JSON.parse(storageStr);
        const state = storage.state || storage;
        const user = state.user || state;
        const innerUser = user?.user || user;
        const role = innerUser?.role;
        console.log("[KEN CustomizationModal] isGuest role check:", { role, user });
        if (!role) return true;
        return ['guest', 'customer'].includes(String(role).toLowerCase());
      }
      const hasToken = !!localStorage.getItem('token');
      console.log("[KEN CustomizationModal] isGuest token fallback check:", { hasToken });
      return !hasToken;
    } catch (e) {
      console.error("[KEN CustomizationModal] isGuest evaluation error:", e);
      return true;
    }
  }, []);

  const [qty, setQty] = useState(1);
  const [size, setSize] = useState(() => {
    return isBeverage ? 'R' : 'Regular';
  });
  const [temperature, setTemperature] = useState('iced'); // Default Iced
  const [sweetness, setSweetness] = useState('normal');
  const [strength, setStrength] = useState('standard');
  const [milk, setMilk] = useState('standard');
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [note, setNote] = useState('');

  // 🧪 State for raw materials (BOM / Recipe Modifiers)
  const [bahanList, setBahanList] = useState([]);
  const [recipeIngredients, setRecipeIngredients] = useState([]);

  // Fetch materials for real-time BOM display
  useEffect(() => {
    console.log("[KEN CustomizationModal] Fetching bahan list. isGuest=", isGuest);
    if (isGuest) return;
    api.getBahan().then(data => {
      console.log("[KEN CustomizationModal] Bahan list loaded successfully:", data?.length || 0, "items");
      if (data) setBahanList(data);
    }).catch(err => console.error("[KEN CustomizationModal] Gagal memuat bahan baku untuk BOM", err));
  }, [isGuest]);

  const activeExtras = isBeverage ? extras : FOOD_EXTRAS;

  // Sync / Initialize recipe ingredients based on item BOM and customization choices
  useEffect(() => {
    if (isGuest) return;

    let baseBom = [];
    if (Array.isArray(item.bom) && item.bom.length > 0) {
      baseBom = item.bom.map(b => ({
        id: b.id || b.bahanId || b.bahan_id,
        bahanId: b.id || b.bahanId || b.bahan_id,
        qty: Number(b.qty),
        active: true,
        isCustom: false
      }));
    } else if (isBeverage) {
      // Mock standard recipe ingredients if no BOM is registered in database
      const coffeeBean = bahanList.find(b => {
        const name = (b.name || b.nama || '').toLowerCase();
        return name.includes('kopi') || name.includes('bean') || name.includes('espresso');
      });
      const freshMilk = bahanList.find(b => {
        const name = (b.name || b.nama || '').toLowerCase();
        return name.includes('susu') || name.includes('milk') || name.includes('fresh');
      });

      if (isCoffee && coffeeBean) {
        const doseEspresso = Number(localStorage.getItem('ken_dose_espresso') || 7);
        baseBom.push({ id: coffeeBean.id, bahanId: coffeeBean.id, qty: doseEspresso, active: true, isCustom: false });
      }
      if ((isCoffee || isNonCoffee) && freshMilk) {
        const doseMilk = Number(localStorage.getItem('ken_dose_milk') || 150);
        baseBom.push({ id: freshMilk.id, bahanId: freshMilk.id, qty: doseMilk, active: true, isCustom: false });
      }
    }

    // Dynamic Swapping: Handle milk substitutions in the BOM
    if (milk !== 'standard' && milk !== 'no-milk') {
      const localSavedMilks = JSON.parse(localStorage.getItem('ken_custom_milks'));
      const localMilksList = [
        { key: 'standard', label: 'Standard', priceAdd: 0 },
        ...(localSavedMilks || [
          { key: 'oat',     label: 'Oat Milk',     priceAdd: 5000, dose: 150, unit: 'ml', bahanId: '' },
          { key: 'almond',  label: 'Almond Milk',  priceAdd: 5000, dose: 150, unit: 'ml', bahanId: '' },
          { key: 'soy',     label: 'Soy Milk',     priceAdd: 5000, dose: 150, unit: 'ml', bahanId: '' },
        ]),
        { key: 'no-milk', label: 'Tanpa Susu', priceAdd: 0 },
      ];
      const chosenMilkObj = localMilksList.find(m => m.key === milk);
      let altMilkBahan = null;
      if (chosenMilkObj && chosenMilkObj.bahanId) {
        altMilkBahan = bahanList.find(b => String(b.id) === String(chosenMilkObj.bahanId));
      }
      if (!altMilkBahan) {
        altMilkBahan = bahanList.find(b => {
          const name = (b.name || b.nama || '').toLowerCase();
          return name.includes(milk);
        });
      }
      
      if (altMilkBahan) {
        // Swap out regular milk for alternative milk
        baseBom = baseBom.map(row => {
          const matchedBahan = bahanList.find(b => String(b.id) === String(row.bahanId));
          const nameLower = (matchedBahan?.name || matchedBahan?.nama || '').toLowerCase();
          if (nameLower.includes('susu') || nameLower.includes('milk')) {
            return {
              ...row,
              id: altMilkBahan.id,
              bahanId: altMilkBahan.id,
              qty: chosenMilkObj?.dose || row.qty // inherits original dose or uses configured dose
            };
          }
          return row;
        });
      }
    } else if (milk === 'no-milk') {
      // Disable milk in the BOM if "Tanpa Susu" is selected
      baseBom = baseBom.map(row => {
        const matchedBahan = bahanList.find(b => String(b.id) === String(row.bahanId));
        const nameLower = (matchedBahan?.name || matchedBahan?.nama || '').toLowerCase();
        if (nameLower.includes('susu') || nameLower.includes('milk')) {
          return { ...row, active: false, isSystemToggled: true };
        }
        return row;
      });
    }

    // Handle coffee strength shot additions in the BOM checklist
    if (strength !== 'standard') {
      const extraShots = strength === 'single' ? 1 : strength === 'double' ? 2 : 3;
      const shotDose = Number(localStorage.getItem('ken_dose_espresso') || 7);
      const extraCoffeeGrams = extraShots * shotDose;

      baseBom = baseBom.map(row => {
        const matchedBahan = bahanList.find(b => String(b.id) === String(row.bahanId));
        const nameLower = (matchedBahan?.name || matchedBahan?.nama || '').toLowerCase();
        if (nameLower.includes('kopi') || nameLower.includes('bean') || nameLower.includes('espresso')) {
          return {
            ...row,
            qty: row.qty + extraCoffeeGrams
          };
        }
        return row;
      });
    }

    // Add selected extras/toppings to the BOM checklist
    selectedExtras.forEach(eKey => {
      const extConfig = activeExtras.find(e => e.key === eKey);
      if (extConfig) {
        let linkedBahan = null;
        if (extConfig.bahanId) {
          linkedBahan = bahanList.find(b => String(b.id) === String(extConfig.bahanId));
        }
        if (!linkedBahan) {
          // Self-healing: match by name (e.g. "Caramel" or "Whipped Cream")
          const searchName = (extConfig.label || '').toLowerCase();
          linkedBahan = bahanList.find(b => {
            const bName = (b.name || b.nama || '').toLowerCase();
            return bName.includes(searchName) || searchName.includes(bName);
          });
        }

        if (linkedBahan) {
          baseBom.push({
            id: `extra-${eKey}`,
            bahanId: linkedBahan.id,
            qty: Number(extConfig.dose || 10),
            active: true,
            isCustom: true,
            label: extConfig.label
          });
        }
      }
    });

    setRecipeIngredients(prev => {
      if (prev.length === 0) return baseBom;
      return baseBom.map(row => {
        const existing = prev.find(x => String(x.bahanId) === String(row.bahanId));
        if (existing) {
          // If system explicitly deactivates this row (e.g. no-milk), always use baseBom value
          if (row.isSystemToggled) return row;
          // If previous state was system-driven (e.g. switching back FROM no-milk), restore from baseBom
          if (existing.isSystemToggled) return row;
          // Otherwise, preserve the user's manual toggle
          return { ...row, active: existing.active };
        }
        return row;
      });
    });
  }, [item.bom, bahanList, milk, strength, selectedExtras, isBeverage, activeExtras]);

  // Size objects & calculations
  const sizeObj = isBeverage
    ? (sizes.find(s => s.key === size) || sizes[0])
    : (FOOD_SIZES.find(s => s.key === size) || FOOD_SIZES[0]);

  // Premium Pricing Calculations for Espresso Shots & Alternative Milk
  const espressoPrice = Number(localStorage.getItem('ken_price_espresso_shot') || 5000);
  const strengthPriceAdd = strength === 'single' ? espressoPrice : strength === 'double' ? espressoPrice * 2 : strength === 'triple' ? espressoPrice * 3 : 0;
  const chosenMilk = milksList.find(m => m.key === milk);
  const milkPriceAdd = chosenMilk ? (chosenMilk.priceAdd || 0) : 0;

  const extrasPrice = selectedExtras.reduce((sum, eKey) => {
    const found = activeExtras.find(e => e.key === eKey);
    return sum + (found?.priceAdd || 0);
  }, 0);

  const finalPrice = (item.price + (sizeObj?.priceAdd || 0) + strengthPriceAdd + milkPriceAdd + extrasPrice) * qty;

  const toggleExtra = (key) => {
    setSelectedExtras(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleRecipeIngredient = (id) => {
    setRecipeIngredients(prev =>
      prev.map(row => row.id === id ? { ...row, active: !row.active } : row)
    );
  };

  const handleConfirm = () => {
    const customRecipe = recipeIngredients.map(row => ({
      bahanId: row.bahanId,
      qty: row.active ? row.qty : 0,
      active: row.active
    }));

    if (isBeverage) {
      const espressoDose = isCoffee ? Number(localStorage.getItem('ken_dose_espresso') || 7) : 0;
      const milkDose = (isCoffee || isNonCoffee) ? Number(localStorage.getItem('ken_dose_milk') || 150) : 0;
      
      onConfirm({
        ...item,
        qty,
        finalPrice: item.price + (sizeObj?.priceAdd || 0) + strengthPriceAdd + milkPriceAdd + extrasPrice,
        customization: {
          size,
          temperature,
          sweetness,
          strength: isCoffee ? strength : undefined,
          milk: (isCoffee || isNonCoffee) ? milk : undefined,
          extras: selectedExtras,
          note: note.trim(),
          espressoDose,
          milkDose,
          customRecipe // Inject modified BOM recipes for smart checkout stock deductions
        },
        customizationSummary: [
          size,
          DEFAULT_TEMPERATURES.find(t => t.key === temperature)?.label || temperature,
          DEFAULT_SWEETNESS.find(s => s.key === sweetness)?.label || sweetness,
          (isCoffee || isNonCoffee) && milk !== 'standard' ? (milksList.find(m => m.key === milk)?.label || milk) : null,
          isCoffee && strength !== 'standard' ? (DEFAULT_STRENGTHS.find(s => s.key === strength)?.label || strength) : null,
          ...selectedExtras.map(eKey => extras.find(e => e.key === eKey)?.label || eKey),
          ...recipeIngredients.filter(row => !row.active).map(row => {
            const b = bahanList.find(x => String(x.id) === String(row.bahanId));
            return `Tanpa ${b?.name || b?.nama || 'Bahan'}`;
          })
        ].filter(Boolean).join(' · '),
      });
    } else {
      // Food Item Customization (Heated option + Savory Extras)
      onConfirm({
        ...item,
        qty,
        finalPrice: item.price + (sizeObj?.priceAdd || 0) + extrasPrice,
        customization: {
          size,
          temperature, // Heated vs normal temp
          extras: selectedExtras,
          note: note.trim(),
          customRecipe // Inject modified BOM recipes for smart checkout stock deductions
        },
        customizationSummary: [
          size !== 'Regular' ? size : null,
          FOOD_TEMPERATURES.find(t => t.key === temperature)?.label || null,
          ...selectedExtras.map(eKey => FOOD_EXTRAS.find(e => e.key === eKey)?.label || eKey),
          ...recipeIngredients.filter(row => !row.active).map(row => {
            const b = bahanList.find(x => String(x.id) === String(row.bahanId));
            return `Tanpa ${b?.name || b?.nama || 'Bahan'}`;
          })
        ].filter(Boolean).join(' · '),
      });
    }
  };

  // Close on ESC
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Panel */}
      <div className="relative w-full md:max-w-6xl sm:max-w-2xl bg-card rounded-lg border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
        
        {/* Absolute Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
        >
          <X size={18} />
        </button>

        {/* Three Columns Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column (col-span-4): Visual Preview, BOM & Checkout */}
            <div className="md:col-span-4 space-y-4">
              {/* Product Visual Card */}
              <div className="bg-muted border border-border rounded-lg p-3 flex gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-md border border-border shadow-sm shrink-0"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center border border-border shadow-sm shrink-0">
                    {isBeverage ? (
                      <Coffee size={32} className="text-amber-500 dark:text-amber-400" />
                    ) : (
                      <Utensils size={32} className="text-amber-500 dark:text-amber-400" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500">Pratinjau Item</span>
                      <span className="px-1.5 py-0.5 rounded-sm bg-background border border-border text-[9px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-widest">
                        {item.category || 'Menu'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground truncate leading-tight">{item.name}</h4>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 dark:text-zinc-500">Harga Dasar</span>
                      <span className="font-mono tabular-nums font-semibold text-foreground">{formatRupiah(item.price)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold border-t border-border pt-0.5 mt-0.5">
                      <span className="text-foreground">Total</span>
                      <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">{formatRupiah(item.price + (sizeObj?.priceAdd || 0) + strengthPriceAdd + milkPriceAdd + extrasPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Dynamic BOM Checklist */}
              {recipeIngredients.length > 0 && (
                <div className="border border-border rounded-lg p-2.5 bg-muted flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1 shrink-0">
                    <span className="text-amber-500 dark:text-amber-400">
                      <Sliders size={10} />
                    </span>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      BOM Modifiers
                    </h4>
                  </div>
                  <div className="space-y-1 h-[148px] overflow-y-auto custom-scrollbar pr-1">
                    {recipeIngredients.map(row => {
                      const b = bahanList.find(x => String(x.id) === String(row.bahanId));
                      const label = row.label || b?.name || b?.nama || 'Bahan Baku';
                      const unit = b?.unit || b?.satuan || '';
                      
                      return (
                        <div 
                          key={row.id}
                          onClick={() => toggleRecipeIngredient(row.id)}
                          className={cn(
                            "flex items-center justify-between py-1.5 px-2 rounded border text-xs cursor-pointer select-none transition-all active:scale-[0.99]",
                            row.active 
                              ? "bg-card border-border hover:border-amber-500/30 text-foreground" 
                              : "bg-background border-transparent text-zinc-400 dark:text-zinc-500 line-through"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className={cn(
                              "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
                              row.active 
                                ? "bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:border-amber-400 dark:text-zinc-900" 
                                : "bg-transparent border-zinc-300 dark:border-zinc-700"
                            )}>
                              {row.active && <CheckCircle2 size={8} strokeWidth={4} />}
                            </div>
                            <span className="font-bold text-xs">{label}</span>
                          </div>
                          <span className="font-mono text-xs font-bold tabular-nums">
                            {row.active ? row.qty : 0} <span className="uppercase text-[9px] font-medium">{unit}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity selector & Add button */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Jumlah</span>
                  <div className="flex items-center gap-3 bg-card border border-border rounded-md p-0.5">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 transition-colors"
                    >
                      <Minus size={12} strokeWidth={3} />
                    </button>
                    <span className="w-6 text-center font-bold font-mono tabular-nums text-sm text-zinc-900 dark:text-zinc-50">{qty}</span>
                    <button
                      onClick={() => setQty(q => q + 1)}
                      className="w-7 h-7 rounded flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-500 transition-colors"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  className="w-full h-10 rounded bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-zinc-900 font-bold text-xs shadow shadow-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-between px-3"
                >
                  <span>Tambah ke Pesanan</span>
                  <span className="font-mono tabular-nums text-xs font-bold">{formatRupiah(finalPrice)}</span>
                </button>
              </div>

            </div>

            {/* Center Column (col-span-4): Size, Sweetness, Shots, Milk */}
            <div className="md:col-span-4 space-y-6">
              {isBeverage ? (
                <>
                  {/* SIZE */}
                  <Section icon={<SlidersHorizontal size={14} />} title="Ukuran Cup">
                    <div className="grid grid-cols-3 gap-2">
                      {sizes.map(s => (
                        <button
                          key={s.key}
                          onClick={() => setSize(s.key)}
                          className={cn(
                            'flex flex-col items-center justify-center h-12 rounded-md border-2 text-xs font-bold transition-all active:scale-95',
                            size === s.key
                              ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:border-amber-400 dark:text-zinc-900 shadow-md shadow-amber-500/20'
                              : 'bg-card border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500 dark:hover:border-amber-400'
                          )}
                        >
                          <span className="text-xs font-bold">{s.label} ({s.key})</span>
                          {s.priceAdd > 0 && (
                            <span className={cn('text-[9px] font-bold mt-0.5 font-mono', size === s.key ? 'text-white/80 dark:text-zinc-900/70' : 'text-zinc-400 dark:text-zinc-500')}>
                              +{formatRupiah(s.priceAdd)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </Section>

                  {/* SWEETNESS */}
                  <Section icon={<Candy size={14} />} title="Tingkat Kemanisan">
                    <div className="flex gap-2 flex-wrap">
                      {DEFAULT_SWEETNESS.map(s => (
                        <button
                          key={s.key}
                          onClick={() => setSweetness(s.key)}
                          className={cn(
                            'h-8 px-4 rounded-md border-2 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95',
                            sweetness === s.key
                              ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 shadow-sm shadow-amber-500/10'
                              : 'bg-card border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500 dark:hover:border-amber-400'
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </Section>

                  {/* ESPRESSO SHOTS — COFFEE ONLY */}
                  {isCoffee && (
                    <Section icon={<Zap size={14} />} title="Kekuatan Kopi (Shots)">
                      <div className="grid grid-cols-4 gap-2">
                        {DEFAULT_STRENGTHS.map(s => (
                          <button
                            key={s.key}
                            onClick={() => setStrength(s.key)}
                            className={cn(
                              'h-10 rounded-md border-2 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95',
                              strength === s.key
                                ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900'
                                : 'bg-card border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500 dark:hover:border-amber-400'
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* MILK SELECTION — COFFEE & CHOCOLATE ONLY */}
                  {(isCoffee || isNonCoffee) && (
                    <Section icon={<Droplets size={14} />} title="Opsi Susu Alternatif">
                      <div className="flex gap-2 flex-wrap">
                        {milksList.map(m => (
                          <button
                            key={m.key}
                            onClick={() => setMilk(m.key)}
                            className={cn(
                              'h-8 px-4 rounded-md border-2 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95',
                              milk === m.key
                                ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 shadow-sm shadow-amber-500/10'
                                : 'bg-card border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500 dark:hover:border-amber-400'
                            )}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </Section>
                  )}
                </>
              ) : (
                <>
                  {/* FOOD PORTION */}
                  <Section icon={<SlidersHorizontal size={14} />} title="Porsi Makanan">
                    <div className="grid grid-cols-2 gap-2">
                      {FOOD_SIZES.map(s => (
                        <button
                          key={s.key}
                          onClick={() => setSize(s.key)}
                          className={cn(
                            'flex flex-col items-center justify-center h-12 rounded-md border-2 text-xs font-bold transition-all active:scale-95',
                            size === s.key
                              ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:border-amber-400 dark:text-zinc-900 shadow-md shadow-amber-500/20'
                              : 'bg-card border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500 dark:hover:border-amber-400'
                          )}
                        >
                          <span className="text-sm font-bold">{s.label}</span>
                          {s.priceAdd > 0 && (
                            <span className={cn('text-[9px] font-bold mt-0.5 font-mono', size === s.key ? 'text-white/80 dark:text-zinc-900/70' : 'text-zinc-400 dark:text-zinc-500')}>
                              +{formatRupiah(s.priceAdd)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </Section>
                </>
              )}
            </div>

            {/* Right Column (col-span-4): Temp, Extras, Note */}
            <div className="md:col-span-4 space-y-6">
              {isBeverage ? (
                <>
                  {/* TEMPERATURE */}
                  <Section icon={<Thermometer size={14} />} title="Suhu Minuman">
                    <div className="grid grid-cols-2 gap-2">
                      {DEFAULT_TEMPERATURES.map(t => {
                        const isHot = t.key === 'hot';
                        return (
                          <button
                            key={t.key}
                            onClick={() => setTemperature(t.key)}
                            className={cn(
                              'flex items-center justify-center gap-2 h-12 rounded-md border-2 transition-all active:scale-95 font-bold text-xs uppercase tracking-widest',
                              temperature === t.key
                                ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 shadow-md shadow-amber-500/20'
                                : 'bg-card border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500 dark:hover:border-amber-400'
                            )}
                          >
                            {isHot ? <Flame size={14} className={temperature === t.key ? 'text-white dark:text-zinc-900' : 'text-zinc-500'} /> : <Snowflake size={14} className={temperature === t.key ? 'text-white dark:text-zinc-900' : 'text-zinc-500'} />}
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Section>

                  {/* EXTRAS */}
                  <Section icon={<Sparkles size={14} />} title={isTea ? "Topping Teh Premium" : "Tambahan Minuman"}>
                    <div className="grid grid-cols-2 gap-2">
                      {extras.map(e => {
                        const selected = selectedExtras.includes(e.key);
                        return (
                          <button
                            key={e.key}
                            onClick={() => toggleExtra(e.key)}
                            className={cn(
                              'flex items-center justify-between px-3 h-10 rounded-md border-2 text-[10px] font-bold transition-all active:scale-95',
                              selected
                                ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:border-amber-400 dark:text-zinc-900 shadow-sm shadow-amber-500/20'
                                : 'bg-card border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500 dark:hover:border-amber-400'
                            )}
                          >
                            <span className="truncate">{e.label}</span>
                            {e.priceAdd > 0 && (
                              <span className={cn('font-mono text-[9px] font-bold ml-1', selected ? 'text-white/80 dark:text-zinc-900/70' : 'text-zinc-400 dark:text-zinc-500')}>
                                +{formatRupiah(e.priceAdd)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </Section>
                </>
              ) : (
                <>
                  {/* FOOD SERVER TEMPERATURE */}
                  <Section icon={<Flame size={14} />} title="Suhu Penyajian">
                    <div className="grid grid-cols-2 gap-2">
                      {FOOD_TEMPERATURES.map(t => (
                        <button
                          key={t.key}
                          onClick={() => setTemperature(t.key)}
                          className={cn(
                            'flex flex-col items-center justify-center h-12 rounded-md border-2 transition-all active:scale-95 text-xs font-bold uppercase tracking-wider',
                            temperature === t.key
                              ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:text-zinc-900 shadow-md shadow-amber-500/20'
                              : 'bg-card border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500 dark:hover:border-amber-400'
                          )}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  {/* SAVORY EXTRAS FOOD */}
                  <Section icon={<Sparkles size={14} />} title="Ekstra Topping Gurih">
                    <div className="grid grid-cols-2 gap-2">
                      {FOOD_EXTRAS.map(e => {
                        const selected = selectedExtras.includes(e.key);
                        return (
                          <button
                            key={e.key}
                            onClick={() => toggleExtra(e.key)}
                            className={cn(
                              'flex items-center justify-between px-3 h-10 rounded-md border-2 text-[10px] font-bold transition-all active:scale-95',
                              selected
                                ? 'bg-amber-500 border-amber-500 text-white dark:bg-amber-400 dark:border-amber-400 dark:text-zinc-900 shadow-sm shadow-amber-500/20'
                                : 'bg-card border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500 dark:hover:border-amber-400'
                            )}
                          >
                            <span className="truncate">{e.label}</span>
                            {e.priceAdd > 0 && (
                              <span className={cn('font-mono text-[9px] font-bold ml-1', selected ? 'text-white/80 dark:text-zinc-900/70' : 'text-zinc-400 dark:text-zinc-500')}>
                                +{formatRupiah(e.priceAdd)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </Section>
                </>
              )}

              {/* NOTE */}
              <Section icon={<FileText size={14} />} title="Catatan Khusus">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={isBeverage ? "Contoh: Es batu dipisah, kurangi manis, dll..." : "Contoh: Sangat pedas, saus dipisah, dll..."}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400 resize-none transition-all"
                />
              </Section>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

/** Sub-komponen Section header */
function Section({ icon, title, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-amber-500 dark:text-amber-400">{icon}</span>
        <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{title}</h4>
      </div>
      {children}
    </div>
  );
}
