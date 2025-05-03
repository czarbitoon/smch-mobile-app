import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { RefreshControl } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReportsScreen = () => {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setReports(response.data.data.reports || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const renderReportItem = ({ item: report }) => (
    <View style={styles.reportCard}>
      <Text style={styles.reportTitle}>{report.title}</Text>
      <Text style={styles.reportStatus}>{report.status}</Text>
      <Button title="View Details" onPress={() => Alert.alert('Report Details', `Title: ${report.title}\nStatus: ${report.status}`)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={renderReportItem}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={{ color: '#888', fontSize: 16, marginTop: 32, textAlign: 'center' }}>No reports found.</Text>}
        />
      )}
      // Removed: <Button title="Add Report" onPress={() => router.push('/(tabs)/reportCreate')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  reportCard: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportStatus: {
    fontSize: 14,
    color: '#666',
  },
});

export default ReportsScreen;