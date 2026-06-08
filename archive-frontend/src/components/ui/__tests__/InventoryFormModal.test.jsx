import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryFormModal from '../../InventoryFormModal';

// Mock minimal props
const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  initialData: null,
  inventoryMeta: {
    categories: ['Bahan Baku', 'Minuman', 'Makanan', 'Kemasan', 'Lainnya'],
    suppliers: [{ id: 'sup-1', name: 'PT Kopi Nusantara' }],
  },
  isSaving: false,
};

describe('InventoryFormModal — KEN Enterprise Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<InventoryFormModal {...defaultProps} />);
    expect(screen.getByText(/Register New Material/i)).toBeInTheDocument();
  });

  it('does NOT render when isOpen is false', () => {
    render(<InventoryFormModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/Register New Material/i)).not.toBeInTheDocument();
  });

  it('shows update title when initialData is provided', () => {
    render(
      <InventoryFormModal
        {...defaultProps}
        initialData={{ name: 'Kopi Arabica', unit: 'Gram', category: 'Bahan Baku' }}
      />
    );
    expect(screen.getByText(/Update Master Registry/i)).toBeInTheDocument();
  });

  it('calls onClose when discard button is clicked', () => {
    render(<InventoryFormModal {...defaultProps} />);
    const discardBtn = screen.getByText(/Discard Change/i);
    fireEvent.click(discardBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('uses Zinc/Amber palette — NO pure black or rainbow colors', () => {
    const { container } = render(<InventoryFormModal {...defaultProps} />);
    const html = container.innerHTML;
    // Should NOT contain legacy non-compliant colors
    expect(html).not.toMatch(/border-white\/10/);
    expect(html).not.toMatch(/border-white\/5/);
    expect(html).not.toMatch(/zinc-250/);
    expect(html).not.toMatch(/rounded-2xl/);
    expect(html).not.toMatch(/rounded-3xl/);
  });

  it('uses rounded-lg for modal card (not rounded-2xl)', () => {
    const { container } = render(<InventoryFormModal {...defaultProps} />);
    const card = container.querySelector('.rounded-lg');
    expect(card).toBeInTheDocument();
  });

  it('uses adaptive dark border (dark:border-zinc-700) consistently', () => {
    const { container } = render(<InventoryFormModal {...defaultProps} />);
    const html = container.innerHTML;
    // All dark borders should use zinc-700 or zinc-800
    expect(html).not.toMatch(/dark:border-white/);
  });

  it('primary action button has amber-500 background and text-white', () => {
    const { container } = render(<InventoryFormModal {...defaultProps} />);
    const saveBtn = screen.getByText(/INITIALIZE MATERIAL/i).closest('button');
    expect(saveBtn.className).toMatch(/bg-amber-500/);
    expect(saveBtn.className).toMatch(/text-white/);
    expect(saveBtn.className).toMatch(/active:scale-95/);
  });

  it('number displays use font-mono tabular-nums', () => {
    const { container } = render(<InventoryFormModal {...defaultProps} />);
    const monoElements = container.querySelectorAll('.tabular-nums');
    expect(monoElements.length).toBeGreaterThan(0);
  });

  // Snapshot test
  it('matches snapshot (new material mode)', () => {
    const { container } = render(<InventoryFormModal {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot (edit mode)', () => {
    const { container } = render(
      <InventoryFormModal
        {...defaultProps}
        initialData={{
          name: 'Kopi Robusta',
          unit: 'Kg',
          category: 'Bahan Baku',
          minStock: 10,
          conversions: [{ unit: 'Karton', multiplier: '25', to_unit: 'Kg' }],
        }}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
