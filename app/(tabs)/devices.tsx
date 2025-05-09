import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TextInput, ActivityIndicator, Image, FlatList, Modal, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper to get status color
const getStatusColor = (status) => {
  switch (status) {
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

  // Render device card function
  const renderDeviceCard = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        margin: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        flex: 1,
        minWidth: 0
      }}
      onPress={() => {
        setSelectedDevice(item);
        setShowDeviceModal(true);
      }}
      activeOpacity={0.85}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={{ width: 80, height: 80, borderRadius: 8, marginBottom: 8 }} resizeMode="cover" />
      ) : (
        <View style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#e3e3e3', marginBottom: 8 }} />
      )}
      <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1976d2', marginBottom: 4 }}>{item.name}</Text>
      <Text style={{ color: '#757575', fontSize: 14 }}>{item.type?.name || 'Unknown Type'}</Text>
      <Text style={{ color: '#757575', fontSize: 13 }}>{item.office?.name || 'Unknown Office'}</Text>
      <Text style={{ color: getStatusColor(item.status), fontWeight: 'bold', marginTop: 4, textTransform: 'capitalize' }}>{item.status}</Text>
    </TouchableOpacity>
  );
  return (
    <View style={{flex: 1}}>
      <View style={styles.container}>
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }} onPress={async () => {
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
      <Text style={styles.title}>Devices</Text>
      <View style={styles.filterRow}>
        {/* Category Filter */}
        <TouchableOpacity
          style={[styles.filterButton, selectedCategory ? styles.filterButtonActive : null]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={[styles.filterButtonText, selectedCategory ? styles.filterButtonTextActive : null]}>
            {selectedCategory ? (categories.find(cat => cat.id === selectedCategory)?.name || 'Category') : 'Category'}
          </Text>
        </TouchableOpacity>
        {/* Type Filter - always clickable if category is selected */}
        <TouchableOpacity
          style={[styles.filterButton, typeFilter ? styles.filterButtonActive : null, !selectedCategory && styles.filterButtonDisabled]}
          onPress={() => {
            if (selectedCategory) setShowTypeModal(true);
          }}
          disabled={!selectedCategory}
        >
          <Text style={[styles.filterButtonText, typeFilter ? styles.filterButtonTextActive : null, !selectedCategory && styles.filterButtonTextDisabled]}>
            {typeFilter ? (types.find(type => type.id === typeFilter)?.name || 'Type') : 'Type'}
          </Text>
        </TouchableOpacity>
        {/* Office Filter */}
        <TouchableOpacity
          style={[styles.filterButton, selectedOffice ? styles.filterButtonActive : null]}
          onPress={() => setShowOfficeModal(true)}
        >
          <Text style={[styles.filterButtonText, selectedOffice ? styles.filterButtonTextActive : null]}>
            {selectedOffice ? (offices.find(office => office.id === selectedOffice)?.name || 'Office') : 'Office'}
          </Text>
        </TouchableOpacity>
        {/* Status Filter - use Picker instead of modal */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.filterLabel}>Status:</Text>
          <TouchableOpacity
            style={[styles.filterBtn, { flex: 1, marginLeft: 8 }]}
            onPress={() => setShowStatusModal(true)}
            testID="status-filter-btn"
          >
            <Text style={{ color: statusFilter ? '#1976d2' : '#888' }}>{statusOptions.find(opt => opt.value === statusFilter)?.label || 'All'}</Text>
          </TouchableOpacity>
        </View>
        <Modal
          visible={showStatusModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStatusModal(false)}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setShowStatusModal(false)}>
            <View style={styles.modalContent}>
              {statusOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalOption,
                    statusFilter === option.value && styles.selectedOption
                  ]}
                  onPress={() => {
                    setStatusFilter(option.value);
                    setShowStatusModal(false);
                    setCurrentPage(1);
                  }}
                >
                  <Text style={{ color: statusFilter === option.value ? '#1976d2' : '#333', fontWeight: statusFilter === option.value ? 'bold' : 'normal' }}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search devices..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#888"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={paginatedDevices}
          renderItem={renderDeviceCard}
          keyExtractor={(item) => item.id?.toString()}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={loading ? null : (
            <Text style={{ textAlign: 'center', color: '#888', marginTop: 32 }}>No devices found.</Text>
          )}
        />
      )}
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
          onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <Text style={styles.pageButtonText}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.pageInfo}>{`Page ${currentPage} of ${totalPages || 1}`}</Text>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
          onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <Text style={styles.pageButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSelectedCategory('');
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>All Categories</Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setTypeFilter('');
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Cancel" onPress={() => setShowCategoryModal(false)} />
          </View>
        </View>
      </Modal>
      {/* Type Modal */}
      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Type</Text>
            {selectedCategory ? (
              types.length > 0 ? (
                types.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.modalOption, typeFilter === type.id && styles.modalOptionSelected]}
                    onPress={() => {
                      setTypeFilter(type.id);
                      setShowTypeModal(false);
                    }}
                  >
                    <Text style={typeFilter === type.id ? styles.modalOptionTextSelected : styles.modalOptionText}>{type.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ color: '#888', marginVertical: 16 }}>No types available for this category.</Text>
              )
            ) : (
              <Text style={{ color: '#888', marginVertical: 16 }}>Please select a category first.</Text>
            )}
            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: '#eee', marginTop: 12 }]}
              onPress={() => {
                setTypeFilter('');
                setShowTypeModal(false);
              }}
            >
              <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>Clear Type Filter</Text>
            </TouchableOpacity>
            <Button title="Close" onPress={() => setShowTypeModal(false)} />
          </View>
        </View>
      </Modal>
      {/* Office Modal */}
      <Modal visible={showOfficeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Office</Text>
            <ScrollView>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSelectedOffice('');
                  setShowOfficeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>All Offices</Text>
              </TouchableOpacity>
              {offices.map(office => (
                <TouchableOpacity
                  key={office.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedOffice(office.id);
                    setShowOfficeModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{office.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Cancel" onPress={() => setShowOfficeModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafe',
    padding: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#222',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    elevation: 2,
  },
  filterButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    marginBottom: 8,
    flex: 1,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 16,
    color: '#333',
  },
  filterItem: {
    flexBasis: '18%',
    minWidth: 120,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
    fontWeight: '600',
  },
  picker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: 36,
    fontSize: 14,
  },
  searchInput: {
    width: '100%',
    height: 40,
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#222',
  },
  gridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  deviceCard: {
    flex: 1,
    minWidth: 120,
    maxWidth: 160,
    minHeight: 170,
    borderRadius: 16,
    padding: 12,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  deviceImageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  deviceImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceInfo: {
    alignItems: 'center',
    width: '100%',
  },
  deviceName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
  deviceType: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 2,
  },
  deviceOffice: {
    fontSize: 12,
    color: '#9e9e9e',
    marginBottom: 2,
  },
  deviceStatus: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 24,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  pageButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  disabledButton: {
    backgroundColor: '#b0b0b0',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  pageInfo: {
    fontSize: 15,
    color: '#222',
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  error: {
    fontSize: 16,
    color: '#f44336',
    marginTop: 24,
    textAlign: 'center',
  },
});

export default DevicesScreen;


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

// Device card renderer
const renderDeviceCard = ({ item }) => (
  <TouchableOpacity
    style={styles.deviceCard}
    onPress={() => {
      setSelectedDevice(item);
      setShowDeviceModal(true);
    }}
    activeOpacity={0.85}
  >
    <View style={{ alignItems: 'center' }}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.deviceImage} />
      ) : (
        <View style={[styles.deviceImage, { backgroundColor: '#e0e0e0' }]} />
      )}
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceStatus}>
        Status: <Text style={{ color: getStatusColor(item.status) }}>{item.status}</Text>
      </Text>
      {item.office && (
        <Text style={styles.deviceOffice}>Office: {item.office.name}</Text>
      )}
    </View>
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
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>Status: <Text style={{ fontWeight: 'normal', color: getStatusColor(selectedDevice.status) }}>{selectedDevice.status}</Text></Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>Type: <Text style={{ fontWeight: 'normal', color: '#333' }}>{selectedDevice.type?.name || selectedDevice.device_type_id}</Text></Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>Office: <Text style={{ fontWeight: 'normal', color: '#333' }}>{selectedDevice.office?.name || selectedDevice.office_id}</Text></Text>
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
