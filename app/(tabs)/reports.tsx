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
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      // Defensive: support both array and nested data
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
    fetchReportDetail(report.id);
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
      style={[styles.reportCard, { borderColor: getStatusColor(item.status), borderWidth: 2 }]}> // highlight card border by status
      <Text style={styles.reportTitle}>{item.title}</Text>
      <Text style={[styles.reportStatus, { color: getStatusColor(item.status) }]}>{item.status || (item.resolved_by ? 'Resolved' : 'Pending')}</Text>
      <Text numberOfLines={2} style={styles.reportDesc}>{item.description}</Text>
    </TouchableOpacity>
  );

  <Modal
    visible={modalVisible}
    animationType="slide"
    transparent={true}
    onRequestClose={() => setModalVisible(false)}
  >
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxHeight: '85%' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 8 }} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={28} color="#1976d2" />
          </TouchableOpacity>
          {detailLoading ? (
            <ActivityIndicator size="large" color="#1976d2" />
          ) : detailError ? (
            <Text style={{ color: 'red', marginBottom: 8 }}>{detailError}</Text>
          ) : selectedReport ? (
            <View>
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>{selectedReport.title}</Text>
              <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Status: <Text style={{ fontWeight: 'normal' }}>{selectedReport.status || (selectedReport.resolved_by ? 'Resolved' : 'Pending')}</Text></Text>
              <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Description:</Text>
              <Text style={{ marginBottom: 8 }}>{selectedReport.description}</Text>
              {selectedReport.created_at && <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Created: <Text style={{ fontWeight: 'normal' }}>{new Date(selectedReport.created_at).toLocaleString()}</Text></Text>}
              {selectedReport.resolved_by && <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Resolved By: <Text style={{ fontWeight: 'normal' }}>{selectedReport.resolved_by}</Text></Text>}
              {userType >= 2 && !selectedReport.resolved_by && (
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
    </View>
  </Modal>

  return (
    <View style={styles.container}>
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }} onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/index');
        }
      }} testID="back-btn">
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
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxHeight: '85%' }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 8 }} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#1976d2" />
              </TouchableOpacity>
              {detailLoading ? (
                <ActivityIndicator size="large" color="#1976d2" />
              ) : detailError ? (
                <Text style={{ color: 'red', marginBottom: 8 }}>{detailError}</Text>
              ) : selectedReport ? (
                <View>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>{selectedReport.title}</Text>
                  <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Status: <Text style={{ fontWeight: 'normal' }}>{selectedReport.status || (selectedReport.resolved_by ? 'Resolved' : 'Pending')}</Text></Text>
                  <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Description:</Text>
                  <Text style={{ marginBottom: 8 }}>{selectedReport.description}</Text>
                  {selectedReport.created_at && <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Created: <Text style={{ fontWeight: 'normal' }}>{new Date(selectedReport.created_at).toLocaleString()}</Text></Text>}
                  {selectedReport.resolved_by && <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Resolved By: <Text style={{ fontWeight: 'normal' }}>{selectedReport.resolved_by}</Text></Text>}
                  {userRole === 'admin' && !selectedReport.resolved_by && (
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
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  reportCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2, // default border width for status color
    borderColor: '#e0e0e0', // fallback color
  },
  reportTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  reportStatus: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  reportDate: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
});
 

export default ReportsScreen;


const getStatusColor = status => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return '#ff9800'; // orange
    case 'in_progress':
      return '#1976d2'; // blue
    case 'resolved':
      return '#43a047'; // green
    case 'inactive':
      return '#bdbdbd'; // gray
    default:
      return '#e0e0e0'; // default gray
  }
};


