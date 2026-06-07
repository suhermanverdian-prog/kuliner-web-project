import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../Card';

/**
 * Helper to render Card in both light and dark mode.
 * Uses the "data-theme" attribute on <html> to toggle Tailwind dark mode.
 */
const renderWithTheme = (ui, { dark = false } = {}) => {
  const { container } = render(
    <div className={dark ? 'dark' : ''} data-theme={dark ? 'dark' : 'light'}>
      {ui}
    </div>
  );
  return { container };
};

describe('Card component – premium variant', () => {
  test('renders with correct light‑mode classes', () => {
    renderWithTheme(
      <Card variant="premium" data-testid="card">
        <CardHeader>
          <CardTitle>Premium</CardTitle>
          <CardDescription>Info</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('border-zinc-200');
    // hover state not directly testable, but ensure amber classes exist for hover
    expect(card).toHaveClass('hover:border-amber-500');
  });

  test('renders with correct dark‑mode classes', () => {
    renderWithTheme(
      <Card variant="premium" data-testid="card">
        <CardHeader>
          <CardTitle>Premium</CardTitle>
          <CardDescription>Info</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>,
      { dark: true }
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('dark:bg-zinc-950');
    expect(card).toHaveClass('dark:border-zinc-800/50');
  });

  test('icon receives proper contrast classes when used', () => {
    const Icon = () => <svg data-testid="icon" className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    renderWithTheme(
      <Card variant="premium">
        <CardHeader>
          <Icon />
          <CardTitle>With Icon</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveClass('text-amber-600');
    expect(icon).toHaveClass('dark:text-amber-400');
  });
});
