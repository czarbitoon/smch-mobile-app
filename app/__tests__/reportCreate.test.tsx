import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReportCreate from '../reportCreate';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ cancelled: false, uri: 'mock-uri' }))
}));

describe('ReportCreate Screen', () => {
  it('renders form fields', () => {
    const { getByPlaceholderText } = render(<ReportCreate />);
    expect(getByPlaceholderText(/Describe the issue/i)).toBeTruthy();
  });

  it('handles image picker', async () => {
    const { getByTestId } = render(<ReportCreate />);
    const imageButton = getByTestId('image-picker-btn');
    fireEvent.press(imageButton);
    await waitFor(() => {
      // Add assertion for image preview or state update
    });
  });

  it('submits report', async () => {
    const { getByTestId } = render(<ReportCreate />);
    const submitBtn = getByTestId('submit-report-btn');
    fireEvent.press(submitBtn);
    // Add assertion for submission effect or navigation
  });
});