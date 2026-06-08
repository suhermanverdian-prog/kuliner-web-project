import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../Input';

describe('Input Component', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('renders with correct tabular-nums font for number types', () => {
    const { container } = render(<Input type="number" />);
    const input = container.querySelector('input');
    // From our design rules, numeric inputs must have font-mono tabular-nums
    expect(input.className).toMatch(/font-mono/);
    expect(input.className).toMatch(/tabular-nums/);
  });

  it('displays inline error message and applies error styles', () => {
    render(<Input placeholder="Username" error="This field is required" />);
    const errorText = screen.getByText('This field is required');
    expect(errorText).toBeInTheDocument();
    expect(errorText.className).toMatch(/text-rose-600/);
    
    // Check if input border changed to error state
    const input = screen.getByPlaceholderText('Username');
    expect(input.className).toMatch(/border-rose-500/);
  });
});
