import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button component', () => {
  it('renders primary variant with correct classes', () => {
    render(<Button variant="primary">Primary Action</Button>);
    const btn = screen.getByRole('button', { name: /primary action/i });
    // Check that button has Amber background class for primary variant in light mode
    expect(btn).toHaveClass('bg-amber-500');
    expect(btn).toHaveClass('text-white');
  });
});
