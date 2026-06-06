import { Button } from './Button';

export default {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'premium'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'xs', 'lg', 'icon'],
    },
    isLoading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  parameters: {
    layout: 'centered',
  },
};

// — Primary (Amber) —
export const Primary = {
  args: {
    children: 'Simpan',
    variant: 'default',
  },
};

// — Secondary —
export const Secondary = {
  args: {
    children: 'Batal',
    variant: 'secondary',
  },
};

// — Ghost —
export const Ghost = {
  args: {
    children: 'Detail',
    variant: 'ghost',
  },
};

// — Outline —
export const Outline = {
  args: {
    children: 'Filter',
    variant: 'outline',
  },
};

// — Destructive —
export const Destructive = {
  args: {
    children: 'Hapus',
    variant: 'destructive',
  },
};

// — Loading State —
export const Loading = {
  args: {
    children: 'Menyimpan...',
    variant: 'default',
    isLoading: true,
  },
};

// — Disabled State —
export const Disabled = {
  args: {
    children: 'Tidak Aktif',
    variant: 'default',
    disabled: true,
  },
};

// — Small Size —
export const Small = {
  args: {
    children: 'Kecil',
    variant: 'default',
    size: 'sm',
  },
};

// — Large Size —
export const Large = {
  args: {
    children: 'Besar',
    variant: 'default',
    size: 'lg',
  },
};

// — All Variants Gallery (Light Mode) —
export const AllVariants = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
      <Button variant="default" isLoading>Loading</Button>
      <Button variant="default" disabled>Disabled</Button>
    </div>
  ),
};
