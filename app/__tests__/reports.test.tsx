import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Reports from '../reports';

describe('Reports Screen', () => {
  it('renders report list', async () => {
    const { getByText } = render(<Reports />);
    await waitFor(() => {
      expect(getByText(/Report History/i)).toBeTruthy();
    });
  });

  it('shows resolved and pending reports', async () => {
    const { getByText } = render(<Reports />);
    await waitFor(() => {
      expect(getByText(/Resolved/i)).toBeTruthy();
      expect(getByText(/Pending/i)).toBeTruthy();
    });
  });
});