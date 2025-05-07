import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { RefreshControl } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Modal, ScrollView } from 'react-native';

const ReportsScreen = () => {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [userRole, setUserRole] = useState("");
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [statusValue, setStatusValue] = useState("");
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      let reportsArr = [];
      if (response.data && response.data.data && Array.isArray(response.data.data.reports)) {
        reportsArr = response.data.data.reports;
      } else if (response.data && Array.isArray(response.data.data)) {
        reportsArr = response.data.data;
      } else if (Array.isArray(response.data)) {
        reportsArr = response.data;
      }
      setReports(reportsArr);
    } catch (err) {
      setReports([]);
      setError(err?.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchReports();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const fetchReportDetail = async (id) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setSelectedReport(response.data?.data || response.data);
      setModalVisible(true);
    } catch (err) {
      setDetailError(err?.response?.data?.message || 'Failed to fetch report details');
      setSelectedReport(null);
    } finally {
      setDetailLoading(false);
    }
  };
  const getUserType = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user?.role ?? "");
      }
    } catch {}
  };
  useEffect(() => { getUserType(); }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const handleReportPress = (report) => {
    // Navigate to the new report detail screen
    router.push(`/report/${report.id}`);
  };
  
  const handleResolve = async () => {
    if (!selectedReport) return;
    setDetailLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/reports/${selectedReport.id}/resolve`, {}, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      fetchReports();
      setModalVisible(false);
      Alert.alert('Success', 'Report resolved successfully');
    } catch (err) {
      setDetailError(err?.response?.data?.message || 'Failed to resolve report');
    } finally {
      setDetailLoading(false);
    }
  };

  const paginatedReports = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return reports.slice(start, start + pageSize);
  }, [reports, currentPage, pageSize]);

  const renderReportItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.reportCard,
        {
          borderColor: getStatusColor(item.status),
          borderWidth: 2,
          backgroundColor: '#f9f9f9',
          margin: 4,
          flex: 1,
          minWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
      ]}
      onPress={() => handleReportPress(item)}
      activeOpacity={0.85}
    >
      <Text style={styles.reportTitle}>{item.title}</Text>
      <Text style={[
        styles.reportStatus,
        {
          color: getStatusColor(item.status),
          fontWeight: 'bold',
          marginBottom: 4,
          textTransform: 'capitalize',
        },
      ]}>
        {item.status || (item.resolved_by ? 'Resolved' : 'Pending')}
      </Text>
      <Text numberOfLines={2} style={styles.reportDesc}>{item.description}</Text>
    </TouchableOpacity>
  );

  // Remove duplicate modal and ensure only one modal is rendered, using latest selectedReport data
  return (
    <View style={styles.container}>
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }} onPress={() => router.replace('/(tabs)/index')} testID="back-btn">
        <Ionicons name="arrow-back" size={28} color="#1976d2" />
      </TouchableOpacity>
      <Text style={styles.title}>Reports</Text>
      {error ? (
        <Text style={{ color: 'red', marginTop: 16, marginBottom: 8, textAlign: 'center' }}>{error}</Text>
      ) : null}
      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" />
      ) : (
        <>
        <FlatList
          data={paginatedReports}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={renderReportItem}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={{ color: '#888', fontSize: 16, marginTop: 32, textAlign: 'center' }}>No reports found.</Text>}
          numColumns={3}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
          <Button title="Prev" onPress={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
          <Text style={{ marginHorizontal: 16 }}>Page {currentPage} / {Math.max(1, Math.ceil(reports.length / pageSize))}</Text>
          <Button title="Next" onPress={() => setCurrentPage(p => p < Math.ceil(reports.length / pageSize) ? p + 1 : p)} disabled={currentPage >= Math.ceil(reports.length / pageSize)} />
        </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
    paddingTop: 64,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#222',
  },
  reportCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    minHeight: 110,
    flexBasis: '32%',
    maxWidth: '32%',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
  },
  reportStatus: {
    fontSize: 14,
    marginBottom: 2,
  },
  reportDesc: {
    fontSize: 13,
    color: '#444',
    marginTop: 2,
  },
});
 

export default ReportsScreen;


const getStatusColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'resolved':
      return '#388e3c'; // green
    case 'pending':
      return '#fbc02d'; // yellow
    case 'repair':
      return '#1976d2'; // blue
    case 'decommissioned':
      return '#d32f2f'; // red
    default:
      return '#757575'; // grey
  }
};



const handleUpdateStatus = async () => {
  if (!selectedReport || !statusValue) return;
  setDetailLoading(true);
  setDetailError("");
  try {
    const token = await AsyncStorage.getItem('token');
    await axios.patch(
      `${API_URL}/reports/${selectedReport.id}`,
      { status: statusValue },
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    fetchReports();
    setShowStatusUpdate(false);
    setModalVisible(false);
    Alert.alert('Success', 'Status updated successfully');
  } catch (err) {
    setDetailError(err?.response?.data?.message || 'Failed to update status');
  } finally {
    setDetailLoading(false);
  }
};


