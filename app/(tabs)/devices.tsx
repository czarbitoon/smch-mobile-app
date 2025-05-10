import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TextInput, ActivityIndicator, Image, FlatList, Modal, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from "@shopify/flash-list";

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper to get status color
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

// Custom hook for fetching with token and error handling
const useFetchWithToken = (fetchFn, deps = []) => {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setError('Unauthorized. Please login again.');
          router.replace('/auth/login');
          setLoading(false);
          return;
        }
        const result = await fetchFn(token);
        if (isMounted) setData(result);
      } catch (e) {
        if (e?.response?.status === 401) {
          setError('Session expired. Please login again.');
          await AsyncStorage.removeItem('token');
          router.replace('/auth/login');
        } else {
          setError('Failed to fetch data');
        }
        if (isMounted) setData([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, deps);
  return { data, loading, error };
}
const DevicesScreen = () => {
  const router = useRouter();
  // Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  // Modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  // Fetch devices
  const { data: devices, loading, error } = useFetchWithToken(async (token) => {
    const params = {};
    if (selectedCategory) params.device_category_id = selectedCategory;
    if (typeFilter) params.device_type_id = typeFilter;
    if (selectedOffice) params.office_id = selectedOffice;
    if (statusFilter) params.status = statusFilter;
    params.per_page = 200;
    const res = await axios.get(`${API_URL}/devices`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    let deviceArray = [];
    if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
      deviceArray = res.data.data.data;
    } else if (Array.isArray(res.data.data)) {
      deviceArray = res.data.data;
    } else {
      deviceArray = [];
    }
    return deviceArray;
  }, [selectedCategory, typeFilter, selectedOffice, statusFilter]);
  // Fetch categories
  const { data: categories } = useFetchWithToken(async (token) => {
    const categoriesRes = await axios.get(`${API_URL}/device-categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    let categoriesArr = [];
    if (categoriesRes.data && categoriesRes.data.data && Array.isArray(categoriesRes.data.data.categories)) {
      categoriesArr = categoriesRes.data.data.categories;
    } else if (categoriesRes.data && Array.isArray(categoriesRes.data.categories)) {
      categoriesArr = categoriesRes.data.categories;
    } else if (Array.isArray(categoriesRes.data)) {
      categoriesArr = categoriesRes.data;
    } else {
      categoriesArr = [];
    }
    return categoriesArr;
  }, []);
  // Fetch types
  const { data: types } = useFetchWithToken(async (token) => {
    if (!selectedCategory) return [];
    const typesRes = await axios.get(`${API_URL}/device-categories/${selectedCategory}/types`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (typesRes.data && typesRes.data.data && Array.isArray(typesRes.data.data.types)) {
      return typesRes.data.data.types;
    } else if (Array.isArray(typesRes.data.types)) {
      return typesRes.data.types;
    } else {
      return [];
    }
  }, [selectedCategory]);
  // Fetch offices
  const { data: offices } = useFetchWithToken(async (token) => {
    const res = await axios.get(`${API_URL}/offices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data && res.data.data && Array.isArray(res.data.data.offices)) {
      return res.data.data.offices;
    } else if (Array.isArray(res.data.offices)) {
      return res.data.offices;
    } else {
      return [];
    }
  }, []);
  // Filter devices
  const filteredDevices = React.useMemo(() => {
    let filtered = Array.isArray(devices) ? devices : [];
    if (search) {
      filtered = filtered.filter(device => device.name?.toLowerCase().includes(search.toLowerCase()));
    }
    if (selectedOffice) {
      filtered = filtered.filter(device => {
        // Ensure both IDs are compared as strings and handle possible nulls
        const deviceOfficeId = device.office?.id?.toString() || device.office_id?.toString() || '';
        return deviceOfficeId === selectedOffice.toString();
      });
    }
    if (statusFilter) {
      filtered = filtered.filter(device => device.status?.toString().toLowerCase() === statusFilter.toLowerCase());
    }
    if (typeFilter) {
      filtered = filtered.filter(device => device.type && device.type.id?.toString() === typeFilter);
    }
    return Array.isArray(filtered) ? filtered : [];
  }, [devices, search, selectedOffice, statusFilter, typeFilter]);
  // Pagination
  const totalPages = Math.ceil((filteredDevices?.length || 0) / pageSize);
  const paginatedDevices = filteredDevices?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];
  // Status filter options for devices
  const statusOptions = [
    { label: "All", value: "" },
    { label: "Resolved", value: "resolved" },
    { label: "Pending", value: "pending" },
    { label: "Under Repair", value: "repair" },
    { label: "Decommissioned", value: "decommissioned" }
  ];
  return (
    <View style={{flex: 1, backgroundColor: '#f7f8fa'}}>
      <View style={[styles.container, {backgroundColor: 'transparent'}]}>
        <TouchableOpacity style={{ position: 'absolute', top: 40, left: 16, zIndex: 10, backgroundColor: '#fff', borderRadius: 24, padding: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }} onPress={async () => {
          // Get user role from AsyncStorage and redirect accordingly
          try {
            const userRole = await AsyncStorage.getItem('user_role');
            if (userRole === 'admin' || userRole === 'superadmin') {
              router.replace('/screens/adminDashboard');
            } else if (userRole === 'staff') {
              router.replace('/screens/staffDashboard');
            } else if (userRole === 'user') {
              router.replace('/screens/userDashboard');
            } else {
              router.replace('/(tabs)/index'); // fallback
            }
          } catch {
            router.replace('/(tabs)/index');
          }
        }} testID="back-btn">
          <Ionicons name="arrow-back" size={28} color="#1976d2" />
        </TouchableOpacity>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1976d2', marginTop: 48, marginBottom: 12, alignSelf: 'center', letterSpacing: 0.5 }}>Devices</Text>
        <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <TextInput
            style={{ flex: 1, height: 40, borderColor: '#e0e0e0', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fff', fontSize: 16, marginRight: 8 }}
            placeholder="Search devices..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#bdbdbd"
          />
          <TouchableOpacity style={{ backgroundColor: '#1976d2', borderRadius: 8, padding: 10 }} onPress={() => router.push('/deviceCreate')}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, width: '100%' }}>
          <TouchableOpacity style={{ flex: 1, marginRight: 6, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', padding: 8, alignItems: 'center' }} onPress={() => setShowCategoryModal(true)}>
            <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>{selectedCategory ? (categories.find(c => c.id === selectedCategory)?.name || 'Category') : 'Category'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, marginHorizontal: 3, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', padding: 8, alignItems: 'center' }} onPress={() => setShowTypeModal(true)}>
            <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>{typeFilter ? (types.find(t => t.id === typeFilter)?.name || 'Type') : 'Type'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, marginHorizontal: 3, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', padding: 8, alignItems: 'center' }} onPress={() => setShowOfficeModal(true)}>
            <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>{selectedOffice ? (offices.find(o => o.id === selectedOffice)?.name || 'Office') : 'Office'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, marginLeft: 6, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', padding: 8, alignItems: 'center' }} onPress={() => setShowStatusModal(true)}>
            <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>{statusFilter ? (statusOptions.find(s => s.value === statusFilter)?.label || 'Status') : 'Status'}</Text>
          </TouchableOpacity>
        </View>
        
        {/* Device Grid */}
        <View style={{ flex: 1, width: '100%', alignItems: 'center', marginTop: 24 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 48 }} />
          ) : error ? (
            <Text style={{ color: 'red', marginTop: 32 }}>{error}</Text>
          ) : (
            <FlashList
              data={paginatedDevices}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.deviceCard}
                  onPress={() => { setSelectedDevice(item); setShowDeviceModal(true); }}
                  activeOpacity={0.85}
                />
              )}
              keyExtractor={item => item.id?.toString()}
              numColumns={3}
              estimatedItemSize={180}
              contentContainerStyle={{ paddingBottom: 24 }}
              ListEmptyComponent={loading ? null : (
                <Text style={{ textAlign: 'center', color: '#888', marginTop: 32 }}>No devices found.</Text>
              )}
              refreshing={loading}
              onRefresh={() => {}}
            />
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
              <Button title="Prev" onPress={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} color={currentPage === 1 ? '#ccc' : '#1976d2'} />
              <Text style={{ marginHorizontal: 12 }}>{currentPage} / {totalPages}</Text>
              <Button title="Next" onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} color={currentPage === totalPages ? '#ccc' : '#1976d2'} />
            </View>
          )}
        </View>
        {/* Pagination Controls */}
        <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16}}>
          <Button title="Prev" onPress={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />
          <Text style={{marginHorizontal: 16, fontSize: 16}}>{currentPage} / {totalPages}</Text>
          <Button title="Next" onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} />
        </View>
      </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10, width: '100%' }}>
          <TouchableOpacity style={{ backgroundColor: '#1976d2', borderRadius: 8, padding: 10 }} onPress={() => router.push('/deviceCreate')}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Modals for filters and device details remain unchanged */}
      </View>
  );
};


const vibrantColors = {
  primary: '#ff6f00', // Vibrant orange
  secondary: '#00bcd4', // Cyan
  accent: '#e040fb', // Purple
  success: '#00e676', // Green
  warning: '#ffd600', // Yellow
  danger: '#ff1744', // Red
  background: 'linear-gradient(135deg, #fffde4 0%, #005bea 100%)',
  card: '#ffffff',
  shadow: '#bdbdbd',
  text: '#222',
  muted: '#757575',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    paddingTop: 24,
    paddingHorizontal: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#e3e7ee',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cfd8dc',
  },
  filterButtonActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  filterButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  searchBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cfd8dc',
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976d2',
    marginBottom: 2,
  },
  deviceMeta: {
    fontSize: 14,
    color: '#555',
    marginBottom: 1,
  },
  deviceStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  paginationButton: {
    backgroundColor: '#e3e7ee',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#cfd8dc',
  },
  paginationButtonActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  paginationButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 15,
  },
  paginationButtonTextActive: {
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 32,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 22,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1976d2',
    marginBottom: 8,
  },
  modalClose: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 0,
  },
  modalCloseText: {
    color: '#1976d2',
    fontWeight: '600',
    fontSize: 16,
  },
  modalLabel: {
    fontWeight: '600',
    color: '#444',
    marginTop: 8,
    marginBottom: 2,
    fontSize: 15,
  },
  modalValue: {
    color: '#222',
    fontSize: 15,
    marginBottom: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    marginTop: 2,
  },
});


const DeviceCard = ({ device, onPress }) => {
  if (!device || typeof device !== 'object') {
    return null;
  }
  const status = device.status;
  return (
    <TouchableOpacity style={styles.deviceCard} onPress={onPress} testID={`device-card-${device.id}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {device.image_url ? (
          <Image source={{ uri: device.image_url }} style={styles.deviceImage} />
        ) : (
          <View style={styles.deviceImagePlaceholder} />
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceType}>{device.type?.name || 'Unknown Type'}</Text>
          <Text style={[styles.deviceStatus, { color: getStatusColor(status) }]}>{status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Device card rendering logic
const renderDeviceCard = ({ item }) => (
<TouchableOpacity
  style={styles.deviceCard}
  onPress={() => {
    setSelectedDevice(item);
    setShowDeviceModal(true);
  }}
  activeOpacity={0.85}
>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Ionicons name="hardware-chip" size={32} color={getStatusColor(item.status)} style={{ marginRight: 12 }} />
    <View style={{ flex: 1 }}>
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={{ color: '#666', fontSize: 14 }}>{item.type?.name || 'Unknown Type'}</Text>
    </View>
  </View>
  <Text style={{ color: getStatusColor(item.status), fontWeight: 'bold', marginTop: 8, textTransform: 'capitalize' }}>{item.status || 'Unknown'}</Text>
</TouchableOpacity>
);

// Device detail modal
const renderDeviceModal = () => (
  <Modal
    visible={showDeviceModal && !!selectedDevice}
    animationType="slide"
    transparent={true}
    onRequestClose={() => setShowDeviceModal(false)}
  >
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxHeight: '90%' }}>
        {selectedDevice ? (
          <ScrollView>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: '#1976d2' }}>{selectedDevice.name}</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>Status: <Text style={{ fontWeight: 'normal', color: getStatusColor(selectedDevice.status) }}>{selectedDevice.status || 'Unknown'}</Text></Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>Type: <Text style={{ fontWeight: 'normal', color: '#333' }}>{selectedDevice.type?.name || selectedDevice.type_id || 'Unknown'}</Text></Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>Office: <Text style={{ fontWeight: 'normal', color: '#333' }}>{selectedDevice.office?.name || selectedDevice.office_id || 'Unknown'}</Text></Text>
            {selectedDevice.image_url && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Image:</Text>
                <View style={{ alignItems: 'center', marginTop: 4 }}>
                  <Image source={{ uri: selectedDevice.image_url }} style={{ width: 220, height: 180, borderRadius: 8 }} resizeMode="cover" />
                </View>
              </View>
            )}
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>Description:</Text>
            <Text style={{ color: '#444', fontSize: 15, marginBottom: 8 }}>{selectedDevice.description || 'No description.'}</Text>
            <View style={{ marginTop: 24, width: '100%' }}>
              <Button title="Close" color="#757575" onPress={() => setShowDeviceModal(false)} />
            </View>
          </ScrollView>
        ) : null}
      </View>
    </View>
  </Modal>
);

export default DevicesScreen;