import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPage from './page';
import { expect, vi, it, describe, beforeEach } from 'vitest';
import React from 'react';

// Mock components
vi.mock('@/components/GlassCard', () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div>ThemeToggle</div>,
}));
vi.mock('@/components/FloatingBackground', () => ({
  FloatingBackground: () => <div>FloatingBackground</div>,
}));
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// Mock fetch
global.fetch = vi.fn();

describe('AdminPage', () => {
  const mockContestants = [
    { id: '1', country: 'UK', artist: 'A1', song: 'S1', performanceOrder: 1, flagEmoji: '🇬🇧' },
    { id: '2', country: 'France', artist: 'A2', song: 'S2', performanceOrder: 2, flagEmoji: '🇫🇷' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/contestants') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ contestants: mockContestants }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('renders contestants and allows changing order', async () => {
    render(<AdminPage />);

    await waitFor(() => expect(screen.getByText('UK')).toBeInTheDocument());

    const inputs = screen.getAllByRole('spinbutton');
    // Form has 1, List has 2. Total 3.
    // The first one is Performance Order in the form.
    // The others are in the list.

    // Change order of first contestant in list (index 1 of inputs)
    fireEvent.change(inputs[1], { target: { value: '3' } });

    expect(screen.getByText('Save Running Order')).toBeInTheDocument();
  });

  it('shows conflict warning and disables save button when duplicates exist', async () => {
    render(<AdminPage />);

    await waitFor(() => expect(screen.getByText('UK')).toBeInTheDocument());

    const inputs = screen.getAllByRole('spinbutton');

    // Change order of first contestant to 2 (same as second contestant)
    fireEvent.change(inputs[1], { target: { value: '2' } });

    expect(screen.getByText('Duplicate Orders!')).toBeInTheDocument();
    const saveButton = screen.getByText('Save Running Order');
    expect(saveButton).toBeDisabled();
  });

  it('prevents form submission if order conflicts', async () => {
    render(<AdminPage />);

    await waitFor(() => expect(screen.getByText('UK')).toBeInTheDocument());

    // Fill in the form with country "Germany" and order 1 (which conflicts with UK)
    fireEvent.change(screen.getByPlaceholderText('e.g. United Kingdom'), { target: { value: 'Germany' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 🇬🇧'), { target: { value: '🇩🇪' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. RAYE'), { target: { value: 'Artist' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Genesis'), { target: { value: 'Song' } });

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '1' } }); // Form order input

    fireEvent.click(screen.getByText('Add Contestant'));

    await waitFor(() => {
      expect(screen.getByText(/Order 1 is already assigned to UK/)).toBeInTheDocument();
    });

    // Verify fetch was not called for POST
    expect(global.fetch).not.toHaveBeenCalledWith('/api/contestants', expect.objectContaining({ method: 'POST' }));
  });
});
