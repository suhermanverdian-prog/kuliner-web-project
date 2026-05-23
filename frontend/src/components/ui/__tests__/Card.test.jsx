import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card';

describe('Card Component Family', () => {
  it('renders all card sections properly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Shift Details</CardTitle>
          <CardDescription>Active shift information</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Cash Drawer: $100</p>
        </CardContent>
        <CardFooter>
          <button>Close Shift</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Shift Details')).toBeInTheDocument();
    expect(screen.getByText('Active shift information')).toBeInTheDocument();
    expect(screen.getByText('Cash Drawer: $100')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close shift/i })).toBeInTheDocument();
  });

  it('applies the correct default classes to Card', () => {
    const { container } = render(<Card />);
    const cardDiv = container.firstChild;
    expect(cardDiv.className).toMatch(/bg-\[var\(--bg-card\)\]/);
    expect(cardDiv.className).toMatch(/rounded-lg/);
  });
});
