import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ButtonPrimary } from '../ButtonPrimary';

describe('ButtonPrimary Component — KEN Enterprise Compliance', () => {
  it('renders with correct text', () => {
    render(<ButtonPrimary>Simpan</ButtonPrimary>);
    const button = screen.getByRole('button', { name: /simpan/i });
    expect(button).toBeInTheDocument();
  });

  it('applies KEN amber-500 primary styling in light mode', () => {
    render(<ButtonPrimary>Action</ButtonPrimary>);
    const button = screen.getByRole('button', { name: /action/i });
    expect(button.className).toMatch(/bg-amber-500/);
    expect(button.className).toMatch(/text-white/);
    expect(button.className).toMatch(/hover:bg-amber-600/);
  });

  it('applies KEN dark mode amber-400 styling with zinc-900 text', () => {
    render(<ButtonPrimary>Action</ButtonPrimary>);
    const button = screen.getByRole('button', { name: /action/i });
    expect(button.className).toMatch(/dark:bg-amber-400/);
    expect(button.className).toMatch(/dark:text-zinc-900/);
    expect(button.className).toMatch(/dark:hover:bg-amber-500/);
  });

  it('has correct border radius (rounded-md per KEN 8px grid)', () => {
    render(<ButtonPrimary>Radius</ButtonPrimary>);
    const button = screen.getByRole('button', { name: /radius/i });
    expect(button.className).toMatch(/rounded-md/);
  });

  it('has active:scale-95 for tactile feedback', () => {
    render(<ButtonPrimary>Tactile</ButtonPrimary>);
    const button = screen.getByRole('button', { name: /tactile/i });
    expect(button.className).toMatch(/active:scale-95/);
  });

  it('has shadow-lg with amber shadow for depth', () => {
    render(<ButtonPrimary>Shadow</ButtonPrimary>);
    const button = screen.getByRole('button', { name: /shadow/i });
    expect(button.className).toMatch(/shadow-lg/);
    expect(button.className).toMatch(/shadow-amber-500\/20/);
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<ButtonPrimary onClick={handleClick}>Click</ButtonPrimary>);
    const button = screen.getByRole('button', { name: /click/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables the button and applies disabled styling', () => {
    render(<ButtonPrimary disabled>Disabled</ButtonPrimary>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button.className).toMatch(/opacity-50/);
    expect(button.className).toMatch(/cursor-not-allowed/);
  });

  it('does NOT fire click when disabled', () => {
    const handleClick = vi.fn();
    render(<ButtonPrimary disabled onClick={handleClick}>No Click</ButtonPrimary>);
    const button = screen.getByRole('button', { name: /no click/i });
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<ButtonPrimary size="sm">Small</ButtonPrimary>);
    expect(screen.getByRole('button').className).toMatch(/h-8/);

    rerender(<ButtonPrimary size="md">Medium</ButtonPrimary>);
    expect(screen.getByRole('button').className).toMatch(/h-10/);

    rerender(<ButtonPrimary size="lg">Large</ButtonPrimary>);
    expect(screen.getByRole('button').className).toMatch(/h-12/);
  });

  it('merges custom className without overriding base styles', () => {
    render(<ButtonPrimary className="my-custom-class">Custom</ButtonPrimary>);
    const button = screen.getByRole('button', { name: /custom/i });
    expect(button.className).toMatch(/my-custom-class/);
    expect(button.className).toMatch(/bg-amber-500/);
  });

  it('has focus-visible ring for accessibility', () => {
    render(<ButtonPrimary>Focus</ButtonPrimary>);
    const button = screen.getByRole('button', { name: /focus/i });
    expect(button.className).toMatch(/focus-visible:ring-2/);
    expect(button.className).toMatch(/focus-visible:ring-amber-500/);
  });

  // Snapshot test
  it('matches snapshot (default props)', () => {
    const { container } = render(<ButtonPrimary>Snapshot</ButtonPrimary>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot (disabled)', () => {
    const { container } = render(<ButtonPrimary disabled>Snapshot Disabled</ButtonPrimary>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot (size lg)', () => {
    const { container } = render(<ButtonPrimary size="lg">Snapshot Large</ButtonPrimary>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
