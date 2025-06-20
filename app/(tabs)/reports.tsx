import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, RefreshControl, Modal, Button, Alert, Dimensions, Platform, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import useUserRole from '../utils/useUserRole';
import axios from 'axios';
import { API_URL } from "../../utils/api";

// Add Report type for type safety
type Report = {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  resolved_by?: string;
};

const ReportsScreen = () => {
  const router = useRouter();
  const userRole = useUserRole();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [filterType, setFilterType] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [orderByCreated, setOrderByCreated] = useState('latest');
  const pageSize = 10;

  const windowWidth = Dimensions.get('window').width;
  const isSmallScreen = windowWidth < 600;

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem('token');
      const params: any = {};
      params.order_by_created = orderByCreated;
      const response = await axios.get(`${API_URL}/reports`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params
      });
      let reportsArr: Report[] = [];
      if (response.data && response.data.data && Array.isArray(response.data.data.reports)) {
        reportsArr = response.data.data.reports;
      } else if (response.data && Array.isArray(response.data.data)) {
        reportsArr = response.data.data;
      } else if (Array.isArray(response.data)) {
        reportsArr = response.data;
      }
      setReports(reportsArr);
    } catch (err: any) {
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
    useCallback(() => {
      fetchReports();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const fetchReportDetail = async (id: number) => {
    setDetailLoading(true);
    setDetailError("");
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const report: Report = response.data?.data || response.data;
      setSelectedReport(report);
      setStatusValue(report.status || "");
      setModalVisible(true);
    } catch (err: any) {
      setDetailError(err?.response?.data?.message || 'Failed to fetch report details');
      setSelectedReport(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReportPress = (report: Report) => {
    fetchReportDetail(report.id);
  };

  const handleResolve = async () => {
    if (!selectedReport) return;
    setDetailLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/reports/${selectedReport.id}/resolve`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      fetchReports();
      setModalVisible(false);
      Alert.alert('Success', 'Report resolved successfully');
    } catch (err: any) {
      setDetailError(err?.response?.data?.message || 'Failed to resolve report');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport || !statusValue || statusValue === selectedReport.status) return;
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
      setModalVisible(false);
      Alert.alert('Success', 'Status updated successfully');
    } catch (err: any) {
      setDetailError(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredReports = React.useMemo(() => {
    let filtered = reports;
    if (statusFilter) {
      filtered = filtered.filter((r) => (r.status || '').toLowerCase() === statusFilter.toLowerCase());
    }
    return [...filtered].sort((a, b) => 
      filterType === "oldest" 
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [reports, filterType, statusFilter]);

  const paginatedReports = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage]);

  const getStatusColor = (status: string) => {
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

  const renderReportModal = () => (
    <Modal
      visible={modalVisible && !!selectedReport}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={28} color="#1976d2" />
          </TouchableOpacity>
          {selectedReport ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{selectedReport.title}</Text>
              <Text style={[styles.modalStatus, { color: getStatusColor(selectedReport.status) }]}>{selectedReport.status || 'Unknown'}</Text>
              <Text style={styles.modalDesc}>{selectedReport.description}</Text>
              <Text style={styles.modalMeta}>Created: {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleString() : '-'}</Text>
              {selectedReport.resolved_by && (
                <Text style={styles.modalMeta}>Resolved by: {selectedReport.resolved_by}</Text>
              )}
              {detailError ? <Text style={{ color: 'red', marginTop: 8 }}>{detailError}</Text> : null}
              {detailLoading ? <ActivityIndicator size="small" color="#1976d2" style={{ marginTop: 8 }} /> : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                <Button title="Close" color="#888" onPress={() => setModalVisible(false)} />
                {userRole === 'admin' || userRole === 'superadmin' ? (
                  <Button title="Resolve" color="#388e3c" onPress={handleResolve} disabled={detailLoading || selectedReport.status === 'resolved'} />
                ) : null}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={[
        styles.reportCard,
        {
          borderColor: getStatusColor(item.status),
          backgroundColor: '#fff',
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
      <Text style={styles.reportTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.reportStatus} numberOfLines={1}>
        <Ionicons name="ellipse" size={12} color={getStatusColor(item.status)} /> {item.status || (item.resolved_by ? 'Resolved' : 'Pending')}
      </Text>
      <Text numberOfLines={3} style={styles.reportDesc}>{item.description}</Text>
    </TouchableOpacity>
  );

  const sortOptions = [
    { label: 'Latest', value: 'latest' },
    { label: 'Earliest', value: 'earliest' },
  ];

  const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Pending', value: 'pending' },
    { label: 'Under Repair', value: 'repair' },
    { label: 'Decommissioned', value: 'decommissioned' },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (userRole === 'admin' || userRole === 'superadmin') {
            router.replace('/screens/adminDashboard');
          } else if (userRole === 'staff') {
            router.replace('/screens/staffDashboard');
          } else if (userRole === 'user') {
            router.replace('/screens/userDashboard');
          } else {
            router.replace('/screens/userDashboard');
          }
        }}
        testID="back-btn"
      >
        <Ionicons name="arrow-back" size={28} color="#1976d2" />
      </TouchableOpacity>
      <Text style={styles.title}>Reports</Text>
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8 }}>
          {statusOptions.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.filterButton, statusFilter === opt.value && styles.filterButtonActive]}
              onPress={() => { setStatusFilter(opt.value); setCurrentPage(1); }}
            >
              <Text style={[styles.filterButtonText, statusFilter === opt.value && { color: '#fff' }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8, marginLeft: 8 }}>
          {sortOptions.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.filterButton, filterType === opt.value && styles.filterButtonActive]}
              onPress={() => { setFilterType(opt.value); setOrderByCreated(opt.value); setCurrentPage(1); }}
            >
              <Text style={[styles.filterButtonText, filterType === opt.value && { color: '#fff' }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {error ? (
        <Text style={{ color: 'red', marginTop: 16, marginBottom: 8, textAlign: 'center' }}>{error}</Text>
      ) : null}
      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={paginatedReports}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No reports found.</Text>}
          numColumns={isSmallScreen ? 1 : 2}
          columnWrapperStyle={isSmallScreen ? undefined : { justifyContent: 'space-between', marginBottom: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <View style={styles.paginationRow}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
          onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#b0b0b0' : '#1976d2'} />
          <Text style={[styles.pageButtonText, currentPage === 1 && { color: '#b0b0b0' }]}>Prev</Text>
        </TouchableOpacity>
        <Text style={styles.pageInfo}>{`Page ${currentPage} of ${Math.max(1, Math.ceil(filteredReports.length / pageSize))}`}</Text>
        <TouchableOpacity
          style={[styles.pageButton, currentPage >= Math.ceil(filteredReports.length / pageSize) && styles.disabledButton]}
          onPress={() => setCurrentPage(p => p < Math.ceil(filteredReports.length / pageSize) ? p + 1 : p)}
          disabled={currentPage >= Math.ceil(filteredReports.length / pageSize)}
        >
          <Text style={[styles.pageButtonText, currentPage >= Math.ceil(filteredReports.length / pageSize) && { color: '#b0b0b0' }]}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color={currentPage >= Math.ceil(filteredReports.length / pageSize) ? '#b0b0b0' : '#1976d2'} />
        </TouchableOpacity>
      </View>
      {renderReportModal()}
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#222',
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
    gap: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  filterButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginHorizontal: 2,
    alignItems: 'center',
    minWidth: 70,
  },
  filterButtonActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  filterButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 32,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  reportCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    minHeight: 110,
    flex: 1,
    marginHorizontal: 4,
    maxWidth: '100%',
  },
  reportTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
  },
  reportStatus: {
    fontSize: 14,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reportDesc: {
    fontSize: 13,
    color: '#444',
    marginTop: 2,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 32,
    textAlign: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#b0b0b0',
  },
  pageButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,
    marginHorizontal: 2,
  },
  pageInfo: {
    fontSize: 16,
    marginHorizontal: 8,
    color: '#222',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '92%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: '#f4f6fa',
    borderRadius: 20,
    padding: 2,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
    marginTop: 16,
  },
  modalStatus: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  modalDesc: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
  },
  modalMeta: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
});

export default ReportsScreen;