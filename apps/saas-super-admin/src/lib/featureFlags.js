/**
 * KEN - Kitchen Enterprise Nodes
 * Feature Flag System v1.0
 * 
 * Logika: feature_overrides selalu menang atas default tier.
 * Ini memungkinkan SuperAdmin mengaktifkan fitur Enterprise
 * untuk tenant Pro tanpa upgrade tier.
 */

// Default features per tier
export const TIER_DEFAULTS = {
  lite: {
    pos: true,
    kds: true,
    table_management: true,
    guest_ordering: true,
    inventory: true,
    shift: true,
    recipe_bom: false,
    waste_management: false,
    procurement: false,
    reporting_pdf: true,
    reporting_excel: false,
    crm: false,
    loyalty: false,
    accounting: false,
    multi_outlet: false,
    hq_dashboard: false,
    stock_transfer: false,
    white_label: false,
    api_access: false,
    ai_insights: false,
    omnichannel: false,
    hrd: false,
  },
  pro: {
    pos: true,
    kds: true,
    table_management: true,
    guest_ordering: true,
    inventory: true,
    shift: true,
    recipe_bom: true,
    waste_management: true,
    procurement: true,
    reporting_pdf: true,
    reporting_excel: true,
    crm: true,
    loyalty: true,
    accounting: false,
    multi_outlet: false,
    hq_dashboard: false,
    stock_transfer: false,
    white_label: false,
    api_access: false,
    ai_insights: false,
    omnichannel: true,
    hrd: false,
  },
  enterprise: {
    pos: true,
    kds: true,
    table_management: true,
    guest_ordering: true,
    inventory: true,
    shift: true,
    recipe_bom: true,
    waste_management: true,
    procurement: true,
    reporting_pdf: true,
    reporting_excel: true,
    crm: true,
    loyalty: true,
    accounting: true,
    multi_outlet: true,
    hq_dashboard: true,
    stock_transfer: true,
    white_label: true,
    api_access: true,
    ai_insights: true,
    omnichannel: true,
    hrd: true,
  },
};

import { 
  ShoppingCart, ChefHat, Armchair, Smartphone, Layers, Clock,
  Box, Trash2, ShoppingBag, FileText, BarChart3, Users, Award,
  Scale, Building2, Globe, Truck, Tag, Code, BrainCircuit, ClipboardCheck
} from 'lucide-react';

// All feature definitions with metadata (for SuperAdmin UI)

// Feature flag for Finance & Billing menu (enabled by default)
export const finance_billing_enabled = true;
export const FEATURE_CATALOG = [
  { key: 'pos',              label: 'POS Kasir',                group: 'Core',        icon: ShoppingCart, description: 'Point of Sale & transaksi' },
  { key: 'kds',              label: 'KDS (Dapur)',              group: 'Core',        icon: ChefHat, description: 'Kitchen Display System' },
  { key: 'table_management', label: 'Manajemen Meja',           group: 'Core',        icon: Armchair, description: 'Reservasi & okupansi meja' },
  { key: 'guest_ordering',   label: 'Menu Digital / Self-Order',group: 'Core',        icon: Smartphone, description: 'QR code menu untuk pelanggan' },
  { key: 'inventory',        label: 'Inventori Bahan Baku',     group: 'Core',        icon: Layers, description: 'Stok dan gudang' },
  { key: 'shift',            label: 'Shift Kasir',              group: 'Core',        icon: Clock, description: 'Manajemen shift kerja' },
  { key: 'recipe_bom',       label: 'Resep / BOM',              group: 'Produksi',    icon: Box, description: 'Bill of Materials per menu' },
  { key: 'waste_management', label: 'Waste Management',         group: 'Produksi',    icon: Trash2, description: 'Pencatatan kerusakan & loss' },
  { key: 'procurement',      label: 'Pengadaan (PO)',           group: 'Pengadaan',   icon: ShoppingBag, description: 'PO → GRN → Invoice → Payment' },
  { key: 'reporting_pdf',    label: 'Laporan PDF',              group: 'Laporan',     icon: FileText, description: 'Export laporan ke PDF' },
  { key: 'reporting_excel',  label: 'Laporan Excel',            group: 'Laporan',     icon: BarChart3, description: 'Export laporan ke Excel' },
  { key: 'crm',              label: 'CRM Pelanggan',            group: 'Bisnis',      icon: Users, description: 'Data & analitik pelanggan' },
  { key: 'loyalty',          label: 'Program Loyalty',          group: 'Bisnis',      icon: Award, description: 'Poin & reward member' },
  { key: 'accounting',       label: 'Akuntansi',                group: 'Keuangan',    icon: Scale, description: 'Double-entry bookkeeping' },
  { key: 'multi_outlet',     label: 'Multi-Outlet',             group: 'Enterprise',  icon: Building2, description: 'Kelola banyak cabang' },
  { key: 'hq_dashboard',     label: 'HQ Dashboard',             group: 'Enterprise',  icon: Globe, description: 'Dashboard pusat semua outlet' },
  { key: 'stock_transfer',   label: 'Transfer Stok',            group: 'Enterprise',  icon: Truck, description: 'Pindah stok antar outlet' },
  { key: 'white_label',      label: 'White Label',              group: 'Enterprise',  icon: Tag, description: 'Custom branding tenant' },
  { key: 'api_access',       label: 'API Access',               group: 'Enterprise',  icon: Code, description: 'REST API untuk integrasi' },
  { key: 'ai_insights',      label: 'AI Insights',              group: 'Enterprise',  icon: BrainCircuit, description: 'Prediksi & rekomendasi AI' },
  { key: 'omnichannel',      label: 'Omnichannel Marketplace',  group: 'Bisnis',      icon: ShoppingBag, description: 'GoFood, GrabFood, ShopeeFood' },
  { key: 'hrd',              label: 'Manajemen HRD & Payroll',  group: 'Enterprise',  icon: ClipboardCheck, description: 'Absensi GPS, Selfie AI & Gaji' },
];

/**
 * Resolve effective features for a tenant.
 * Priority: feature_overrides > tier defaults > false
 */
export function resolveFeatures(tenant) {
  const tier = tenant?.tier || 'lite';
  const defaults = TIER_DEFAULTS[tier] || TIER_DEFAULTS.lite;
  const overrides = tenant?.feature_overrides || {};

  const resolved = {};
  for (const key of Object.keys(TIER_DEFAULTS.enterprise)) {
    if (key in overrides) {
      resolved[key] = overrides[key];
    } else {
      resolved[key] = defaults[key] ?? false;
    }
  }
  return resolved;
}

/**
 * Check if a specific feature is enabled for the current user.
 * Call this from any component with the user object from context/props.
 */
export function hasFeature(user, flag) {
  // SuperAdmin always has access to everything
  if (user?.is_superadmin || user?.role === 'superadmin') return true;

  const tenant = user?.tenant || user; // Fallback if tenant is flattened into user
  if (!tenant || (!tenant.tier && !tenant.feature_overrides)) {
    // If no tenant context at all, allow as safe default
    return true;
  }

  const features = resolveFeatures(tenant);
  return features[flag] ?? false;
}

// Map sidebar page IDs to feature flags
// MUST MATCH Sidebar.jsx IDs exactly (without leading slash)
export const PAGE_FEATURE_MAP = {
  '':              null,          // dashboard
  'kasir':         'pos',
  'tables':        'table_management',
  'kds':           'kds',
  'shifts':        'shift',
  'inventory':     'inventory',
  'opname':        'inventory',
  'inventory-intel': 'ai_insights',
  'waste-monitoring': 'waste_management',
  'logistics-hub': 'stock_transfer',
  'procurement':   'procurement',
  'menu':          'recipe_bom',
  'marketplace':   'omnichannel',
  'reports':       'reporting_pdf',
  'budget':        'accounting',
  'revenue-intel': 'ai_insights',
  'tax-report':    'accounting',
  'report-builder':'reporting_excel',
  'consolidated-finance': 'multi_outlet',
  'accounting':    'accounting',
  'outlets':       'multi_outlet',
  'customers':     'crm',
  'settings':      null,
  'hrd':           'hrd',
  'ai-assistant':  'ai_insights',
  'command-center':'superadmin',
  'superadmin':    'superadmin',
};
