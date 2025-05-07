import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Button, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

const getStatusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'resolved':
      return '#388e3c';
    case 'pending':
      return '#fbc02d';
    case 'repair':
      return '#1976d2';
    case 'decommissioned':
      return '#d32f2f';
    default:
      return '#757575';
  }
};

const ReportDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${API_URL}/reports/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setReport(response.data?.data || response.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch report details');
        setReport(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  useEffect(() => {
    const getUserType = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserRole(user?.role ?? '');
        }
      } catch {}
    };
    getUserType();
  }, []);

  const handleResolve = async () => {
    if (!report) return;
    setDetailLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/reports/${report.id}/resolve`, {}, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      Alert.alert('Success', 'Report resolved successfully');
      router.replace('/(tabs)/reports');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to resolve report');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }} onPress={() => router.back()} testID="back-btn">
        <Ionicons name="arrow-back" size={28} color="#1976d2" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 64 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#1976d2" />
        ) : error ? (
          <Text style={{ color: 'red', marginTop: 16, textAlign: 'center' }}>{error}</Text>
        ) : report ? (
          <View style={styles.card}>
            <Text style={styles.title}>{report.title}</Text>
            <Text style={[styles.status, { color: getStatusColor(report.status) }]}>Status: {report.status || (report.resolved_by ? 'Resolved' : 'Pending')}</Text>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.desc}>{report.description}</Text>
            {report.device && (
              <Text style={styles.label}>Device: <Text style={styles.value}>{report.device.name || report.device_id}</Text></Text>
            )}
            {report.office && (
              <Text style={styles.label}>Office: <Text style={styles.value}>{report.office.name || report.office_id}</Text></Text>
            )}
            {report.image_url && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>Image:</Text>
                <View style={{ alignItems: 'center', marginTop: 4 }}>
                  <Image source={{ uri: report.image_url }} style={{ width: 220, height: 180, borderRadius: 8 }} resizeMode="cover" />
                </View>
              </View>
            )}
            {report.created_at && <Text style={styles.label}>Created: <Text style={styles.value}>{new Date(report.created_at).toLocaleString()}</Text></Text>}
            {report.resolved_by && (
              <Text style={styles.label}>Resolved By: <Text style={styles.value}>{report.resolved_by_user?.name || report.resolved_by_user?.email || report.resolved_by || 'Unknown'}</Text></Text>
            )}
            {report.resolution_notes && (
              <Text style={styles.label}>Resolution Notes: <Text style={styles.value}>{report.resolution_notes}</Text></Text>
            )}
            {userRole === 'admin' && !report.resolved_by && (
              <View style={{ marginTop: 24 }}>
                <Button title={detailLoading ? 'Resolving...' : 'Resolve Report'} onPress={handleResolve} disabled={detailLoading} color="#388e3c" />
              </View>
            )}
          </View>
        ) : (
          <Text>No report found.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  status: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  value: {
    fontWeight: 'normal',
  },
  desc: {
    marginBottom: 8,
    color: '#444',
    fontSize: 15,
  },
});

export default ReportDetailScreen;
import { TouchableOpacity } from 'react-native';