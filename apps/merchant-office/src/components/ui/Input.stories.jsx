import { Input } from './Input';

export default {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'number', 'email', 'password', 'date'],
    },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '360px' }}>
        <Story />
      </div>
    ),
  ],
};

// — Default Text Input —
export const Default = {
  args: {
    placeholder: 'Masukkan nama kasir...',
    type: 'text',
  },
};

// — Number Input (font-mono tabular-nums) —
export const NumberInput = {
  args: {
    placeholder: '0',
    type: 'number',
  },
};

// — Date Input —
export const DateInput = {
  args: {
    type: 'date',
  },
};

// — With Error Message —
export const WithError = {
  args: {
    placeholder: 'Masukkan jumlah kas...',
    type: 'number',
    error: 'Jumlah kas harus berupa angka positif',
  },
};

// — Disabled State —
export const Disabled = {
  args: {
    placeholder: 'Tidak dapat diubah',
    disabled: true,
  },
};

// — Password Input —
export const Password = {
  args: {
    placeholder: 'Masukkan password...',
    type: 'password',
  },
};

// — All States Gallery —
export const AllStates = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '360px' }}>
      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Normal</label>
        <Input placeholder="Teks normal..." />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Angka (Monospace)</label>
        <Input type="number" placeholder="0" />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Error</label>
        <Input placeholder="Input error" error="Field ini wajib diisi" />
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Disabled</label>
        <Input placeholder="Disabled" disabled />
      </div>
    </div>
  ),
};
