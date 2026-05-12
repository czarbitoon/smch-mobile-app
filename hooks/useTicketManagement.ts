// smch-mobile-app/hooks/useTicketManagement.ts
// Hook for sequential ticket creation/fetching to prevent ngrok tunnel overload

import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../utils/axiosConfig';

export interface TicketCreatePayload {
  title: string;
  description: string;
  device_id: number | string;
  status?: string;
  report_image?: string;
}

export interface TicketResponse {
  id: number;
  title: string;
  description: string;
  device_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface UseTicketManagementResult {
  createTicket: (payload: TicketCreatePayload) => Promise<TicketResponse>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Sequential ticket creation hook
 * Ensures requests are sent one at a time to prevent ngrok tunnel ERR_CONNECTION_CLOSED
 */
export const useTicketManagement = (): UseTicketManagementResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createTicket = useCallback(
    async (payload: TicketCreatePayload): Promise<TicketResponse> => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        // Ensure we have a token
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required. Please log in.');
        }

        // Sequential request to create ticket
        const response = await axiosInstance.post<TicketResponse>(
          '/tickets',
          payload
        );

        setSuccess(true);
        return response.data;
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to create ticket';
        
        setError(errorMessage);
        console.error('Ticket creation error:', errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createTicket,
    loading,
    error,
    success,
  };
};
