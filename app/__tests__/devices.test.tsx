import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Devices from '../devices';

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('Devices Screen', () => {
  it('renders device list', async () => {
    const { getByText } = render(<Devices />);
    await waitFor(() => {
      expect(getByText(/Device List/i)).toBeTruthy();
    });
  });

  it('handles device selection', async () => {
    const { getByTestId } = render(<Devices />);
    const deviceItem = await waitFor(() => getByTestId('device-item-0'));
    fireEvent.press(deviceItem);
    // Add assertion for navigation or selection effect
  });
});