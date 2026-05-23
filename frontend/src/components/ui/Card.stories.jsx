import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from './Button';

export default {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'glass', 'quantum', 'premium'],
    },
  },
  parameters: {
    layout: 'centered',
  },
};

// — Default Card —
export const Default = {
  render: (args) => (
    <Card {...args} style={{ width: '380px' }}>
      <CardHeader>
        <CardDescription>Shift #001</CardDescription>
        <CardTitle>Shift Pagi</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Kasir: Admin — Mulai 08:00 WIB
        </p>
      </CardContent>
    </Card>
  ),
  args: {
    variant: 'default',
  },
};

// — Premium Card —
export const Premium = {
  render: (args) => (
    <Card {...args} style={{ width: '380px' }}>
      <CardHeader>
        <CardDescription>Total Penjualan</CardDescription>
        <CardTitle>
          <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">
            Rp 2.450.000
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          12 transaksi hari ini
        </p>
      </CardContent>
    </Card>
  ),
  args: {
    variant: 'premium',
  },
};

// — Card with Footer —
export const WithFooter = {
  render: (args) => (
    <Card {...args} style={{ width: '380px' }}>
      <CardHeader>
        <CardDescription>Konfirmasi</CardDescription>
        <CardTitle>Tutup Shift?</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Pastikan jumlah uang kas sudah dihitung dengan benar.
        </p>
      </CardContent>
      <CardFooter>
        <div className="flex gap-4 w-full justify-end pt-4">
          <Button variant="secondary" size="sm">Batal</Button>
          <Button variant="default" size="sm">Konfirmasi</Button>
        </div>
      </CardFooter>
    </Card>
  ),
  args: {
    variant: 'default',
  },
};
