import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, ActivityIndicator, Image, FlatList, Modal, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import {Picker} from '@react-native-picker/picker';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import useUserRole from '../utils/useUserRole';

import { API_URL } from "../../utils/api";

// Helper to convert status code to readable text
const getStatusText = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'resolved': return 'Resolved';
    case 'pending': return 'Pending';
    case 'repair': return 'Under Repair';
    case 'decommissioned': return 'Decommissioned';
    default: return 'Unknown';
  }
};

// Add types for Device, Category, Type, Office
interface DeviceType {
  id: string | number;
  name: string;
}
interface DeviceCategory {
  id: string | number;
  name: string;
  types?: DeviceType[];
}
interface Office {
  id: string | number;
  name: string;
}
interface Device {
  id: string | number;
  name: string;
  image_url?: string;
  image?: string;
  type?: DeviceType;
  device_type_id?: string | number;
  category?: DeviceCategory;
  device_category_id?: string | number;
  office?: Office;
  office_id?: string | number;
  status?: string;
  description?: string;
}

// Custom hook for fetching with token and error handling
const useFetchWithToken = <T = any>(fetchFn: (token: string) => Promise<T>, deps: any[] = []) => {
  const router = useRouter();
  const [data, setData] = useState<T>([] as unknown as T);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      } catch (e: any) {
        if (e?.response?.status === 401) {
          setError('Session expired. Please login again.');
          await AsyncStorage.removeItem('token');
          router.replace('/auth/login');
        } else {
          setError('Failed to fetch data');
        }
        if (isMounted) setData([] as unknown as T);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, deps);
  return { data, loading, error };
};

const DevicesScreen = () => {
  const router = useRouter();
   // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [selectedOffice, setSelectedOffice] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 9;
  // Modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [editDeviceData, setEditDeviceData] = useState<Device | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  // Admin role state
  const userRole = useUserRole();
  // Refresh state for FlatList
  const [refreshing, setRefreshing] = useState(false);
  // User office state
  const [userOfficeId, setUserOfficeId] = useState<string>("");
  const [orderByCreated, setOrderByCreated] = useState<string>('latest');

  // DEBUG: Show current userRole
  // Remove or comment out after debugging
  const DebugUserRole = () => (
    <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 100 }}>
      <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 12 }}>Role: {userRole || 'unknown'}</Text>
    </View>
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let role = "";
        let officeId = "";
        // Always check direct user_role key first for persistence
        const directRole = await AsyncStorage.getItem('user_role');
        if (directRole) {
          role = directRole;
        } else {
          // Fallback to user object if user_role is not found
          const userStr = await AsyncStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            role = user?.role ?? user?.user_role ?? "";
            officeId = user?.office_id?.toString() || user?.office?.id?.toString() || "";
          }
        }
        // Try to get office_id directly if not found above
        if (!officeId) {
          const officeIdStr = await AsyncStorage.getItem('office_id');
          if (officeIdStr) officeId = officeIdStr;
        }
        if (isMounted) {
          setUserRole(role);
          setUserOfficeId(officeId);
          // If not admin, set office filter and prevent changing
          if (role !== 'admin' && role !== 'superadmin' && officeId) {
            setSelectedOffice(officeId);
          }
        }
      } catch {}
    })();
    return () => { isMounted = false; };
  }, []);
  // Calculate card size for responsive grid
  const windowWidth = Dimensions.get('window').width;
  const isSmallScreen = windowWidth < 600;
  const horizontalPadding = 12;
  const cardSpacing = 10;
  const numColumns = 1; // Always 1 column for mobile
  const cardWidth = windowWidth - horizontalPadding * 2;

  // Helper functions
  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'resolved': return '#388e3c';
      case 'pending': return '#fbc02d';
      case 'repair': return '#1976d2';
      case 'decommissioned': return '#d32f2f';
      default: return '#757575';
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate re-fetch by triggering a state change
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, []);



  // Helper to get full image URL from storage path
  const getDeviceImageUrl = (imgPath: string) => {
    if (!imgPath || imgPath === 'default.png' || imgPath === 'default_device.jpg') {
      let apiBase = API_URL.replace(/\/?api\/?$/, '');
      apiBase = apiBase.replace(/^https:\/\/localhost:8000/i, 'http://localhost:8000');
      return `${apiBase}/storage/devices/default.png`;
    }
    if (/^https?:\/\//i.test(imgPath)) {
      return imgPath.replace(/^https:\/\/localhost:8000/i, 'http://localhost:8000');
    }
    let cleanPath = imgPath.replace(/^\/+/, '');
    cleanPath = cleanPath.replace(/^devices\/?/, '');
    let apiBase = API_URL.replace(/\/?api\/?$/, '');
    apiBase = apiBase.replace(/^https:\/\/localhost:8000/i, 'http://localhost:8000');
    return `${apiBase}/storage/${cleanPath}`;
  };

  // Fetch devices
  const { data: devices, loading, error } = useFetchWithToken<Device[]>(async (token: string) => {
    const params: any = {};
    if (selectedCategory) params.device_category_id = selectedCategory;
    if (typeFilter) params.device_type_id = typeFilter;
    if (selectedOffice) params.office_id = selectedOffice;
    if (statusFilter) params.status = statusFilter;
    params.per_page = 200;
    params.order_by_created = orderByCreated;
    const res = await axios.get(`${API_URL}/devices`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    let deviceArray: Device[] = [];
    if (res.data && res.data.data && Array.isArray(res.data.data.data)) {
      deviceArray = res.data.data.data;
    } else if (Array.isArray(res.data.data)) {
      deviceArray = res.data.data;
    } else {
      deviceArray = [];
    }
    return deviceArray;
  }, [selectedCategory, typeFilter, selectedOffice, statusFilter, orderByCreated]);

  // Fetch categories
  const { data: categories } = useFetchWithToken<DeviceCategory[]>(async (token: string) => {
    const categoriesRes = await axios.get(`${API_URL}/device-categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    let categoriesArr: DeviceCategory[] = [];
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
  const { data: types } = useFetchWithToken<DeviceType[]>(async (token: string) => {
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
  const { data: offices } = useFetchWithToken<Office[]>(async (token: string) => {
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
    if (selectedOffice) {
      filtered = filtered.filter(device => {
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
  }, [devices, selectedOffice, statusFilter, typeFilter]);

  // Pagination
  const totalPages = Math.ceil((filteredDevices?.length || 0) / pageSize);
  const paginatedDevices = filteredDevices?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

  // Status filter options
  const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Pending', value: 'pending' },
    { label: 'Under Repair', value: 'repair' },
    { label: 'Decommissioned', value: 'decommissioned' },
  ];

  const sortOptions = [
    { label: 'Latest', value: 'latest' },
    { label: 'Earliest', value: 'earliest' },
  ];

  // Device card rendering (inside FlatList renderItem or similar)
  const renderFilterBar = () => (
    <View style={{ flexDirection: 'column', gap: 10, paddingHorizontal: 8, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
        <TouchableOpacity style={styles.filterButtonMobile} onPress={() => setShowCategoryModal(true)}>
          <Text style={styles.filterButtonText}>{selectedCategory ? (categories.find(c => c.id === selectedCategory)?.name || 'Category') : 'Category'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButtonMobile} onPress={() => setShowTypeModal(true)}>
          <Text style={styles.filterButtonText}>{typeFilter ? (types.find(t => t.id === typeFilter)?.name || 'Type') : 'Type'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
        {(userRole === 'admin' || userRole === 'superadmin') && (
          <TouchableOpacity style={styles.filterButtonMobile} onPress={() => setShowOfficeModal(true)}>
            <Ionicons name="business" size={18} color="#1976d2" style={{ marginRight: 6 }} />
            <Text style={styles.filterButtonText} numberOfLines={1}>{selectedOffice ? (offices.find(o => o.id?.toString() === selectedOffice?.toString())?.name || 'Office') : 'Office'}</Text>
            <Ionicons name="chevron-down" size={16} color="#1976d2" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.filterButtonMobile} onPress={() => setShowStatusModal(true)}>
          <Text style={styles.filterButtonText}>{statusFilter ? (statusOptions.find(s => s.value === statusFilter)?.label || 'Status') : 'Status'}</Text>
        </TouchableOpacity>
        <View style={styles.filterButtonMobile}>
          <Picker
            selectedValue={orderByCreated}
            style={{ width: 110, height: 36, color: '#1976d2' }}
            onValueChange={setOrderByCreated}
            mode="dropdown"
          >
            {sortOptions.map(opt => (
              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderDeviceCard = ({ item }) => {
    const imageUrl = getDeviceImageUrl(item.image_url || item.image);
    return (
      <TouchableOpacity
        style={[styles.deviceCardMobile, { width: cardWidth, minHeight: cardWidth * 0.7 }]}
        onPress={() => {
          setSelectedDevice(item);
          setShowDeviceModal(true);
        }}
        activeOpacity={0.85}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.deviceImageMobile}
              defaultSource={require('../assets/default.png')}
              onError={() => console.log('Image load error for device:', item.name)}
            />
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={styles.deviceNameMobile} numberOfLines={2}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusBadgeText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.deviceTypeMobile} numberOfLines={1}>{item.type?.name || 'Unknown Type'}</Text>
        <Text style={styles.deviceOfficeMobile} numberOfLines={1}>{item.office?.name || 'Unknown Office'}</Text>
      </TouchableOpacity>
    );
  };

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Category</Text>
          <ScrollView>
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => {
                setSelectedCategory('');
                setTypeFilter('');
                setShowCategoryModal(false);
              }}
            >
              <Text style={styles.pickerItemText}>All</Text>
            </TouchableOpacity>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={styles.pickerItem}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setTypeFilter('');
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.pickerItemText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowCategoryModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderTypeModal = () => (
    <Modal
      visible={showTypeModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTypeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Type</Text>
          {!selectedCategory ? (
            <Text style={{ color: '#888', fontSize: 16, marginVertical: 16, textAlign: 'center' }}>Select a category first.</Text>
          ) : types.length === 0 ? (
            <Text style={{ color: '#888', fontSize: 16, marginVertical: 16, textAlign: 'center' }}>No types available for this category.</Text>
          ) : (
            <ScrollView>
              {types.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.pickerItem, typeFilter === type.id && { backgroundColor: '#e3f2fd' }]}
                  onPress={() => {
                    setTypeFilter(type.id.toString());
                    setShowTypeModal(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setTypeFilter("");
                  setShowTypeModal(false);
                }}
              >
                <Text style={[styles.pickerItemText, { color: '#1976d2' }]}>Clear Type Filter</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowTypeModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderOfficeModal = () => (
    <Modal
      visible={showOfficeModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowOfficeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Office</Text>
          <ScrollView>
            <TouchableOpacity
              style={styles.pickerItem}
              onPress={() => {
                setSelectedOffice('');
                setShowOfficeModal(false);
              }}
            >
              <Text style={styles.pickerItemText}>All</Text>
            </TouchableOpacity>
            {offices.map(office => (
              <TouchableOpacity
                key={office.id}
                style={styles.pickerItem}
                onPress={() => {
                  setSelectedOffice(office.id);
                  setShowOfficeModal(false);
                }}
              >
                <Text style={styles.pickerItemText}>{office.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowOfficeModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Device modal rendering
  const renderDeviceModal = () => (
    <Modal
      visible={showDeviceModal && !!selectedDevice}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDeviceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }} onPress={() => setShowDeviceModal(false)}>
            <Ionicons name="close" size={28} color="#1976d2" />
          </TouchableOpacity>
          {selectedDevice ? (
            <>
              <Image
                source={{ uri: getDeviceImageUrl(selectedDevice.image_url || selectedDevice.image) }}
                style={{ width: 180, height: 130, borderRadius: 12, alignSelf: 'center', marginBottom: 16, backgroundColor: '#f0f0f0' }}
                resizeMode="cover"
              />
              <Text style={styles.modalTitle}>{selectedDevice.name}</Text>
              <Text style={[styles.deviceStatus, { color: getStatusColor(selectedDevice.status), marginBottom: 8 }]}>{getStatusText(selectedDevice.status)}</Text>
              <Text style={{ fontSize: 16, color: '#555', marginBottom: 8 }}>Type: {selectedDevice.type?.name || 'Unknown'}</Text>
              <Text style={{ fontSize: 16, color: '#555', marginBottom: 8 }}>Office: {selectedDevice.office?.name || 'Unknown'}</Text>
              <Text style={{ fontSize: 15, color: '#888', marginBottom: 8 }}>ID: {selectedDevice.id}</Text>
              <Text style={{ fontSize: 15, color: '#888', marginBottom: 8 }}>Description: {selectedDevice.description || 'No description.'}</Text>
              <TouchableOpacity style={[styles.editBtn, { marginTop: 12 }]} onPress={() => { setShowDeviceModal(false); navigation.navigate('ReportCreate', { device: selectedDevice }); }}>
  <Text style={styles.editBtnText}>Report Device</Text>
</TouchableOpacity>
{userRole === 'admin' || userRole === 'superadmin' ? (
  <TouchableOpacity style={[styles.editBtn, { marginTop: 12 }]} onPress={() => { setEditDeviceData(selectedDevice); setShowEditModal(true); setShowDeviceModal(false); }}>
    <Text style={styles.editBtnText}>Edit Device</Text>
  </TouchableOpacity>
) : null}
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
const renderEditModal = () => {
  const [name, setName] = React.useState(editDeviceData?.name || "");
  const [categoryId, setCategoryId] = React.useState(editDeviceData?.device_category_id?.toString() || editDeviceData?.category?.id?.toString() || "");
  const [typeId, setTypeId] = React.useState(editDeviceData?.device_type_id?.toString() || editDeviceData?.type?.id?.toString() || "");
  const [status, setStatus] = React.useState(editDeviceData?.status || "");
  const [officeId, setOfficeId] = React.useState(editDeviceData?.office?.id?.toString() || editDeviceData?.office_id?.toString() || "");
  const [modalTypes, setModalTypes] = React.useState([]);
  const [typesLoading, setTypesLoading] = React.useState(false);
  React.useEffect(() => {
    setName(editDeviceData?.name || "");
    setCategoryId(editDeviceData?.device_category_id?.toString() || editDeviceData?.category?.id?.toString() || "");
    setTypeId(editDeviceData?.device_type_id?.toString() || editDeviceData?.type?.id?.toString() || "");
    setStatus(editDeviceData?.status || "");
    setOfficeId(editDeviceData?.office?.id?.toString() || editDeviceData?.office_id?.toString() || "");
    // Fetch types for the selected category in the modal when modal opens
    const fetchTypes = async () => {
      if (!editDeviceData?.device_category_id && !editDeviceData?.category?.id) { setModalTypes([]); return; }
      setTypesLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const catId = editDeviceData?.device_category_id || editDeviceData?.category?.id;
        const res = await axios.get(`${API_URL}/device-categories/${catId}/types`, { headers: { Authorization: `Bearer ${token}` } });
        let typesArr = [];
        if (res.data && res.data.data && Array.isArray(res.data.data.types)) {
          typesArr = res.data.data.types;
        } else if (Array.isArray(res.data.types)) {
          typesArr = res.data.types;
        }
        setModalTypes(typesArr);
        // If current typeId is not in new types, reset
        if (!typesArr.some(t => t.id?.toString() === typeId)) {
          setTypeId("");
        }
      } catch {
        setModalTypes([]);
      } finally {
        setTypesLoading(false);
      }
    };
    fetchTypes();
  }, [editDeviceData]);
  const handleSave = async () => {
    setEditLoading(true);
    setEditError("");
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/devices/${editDeviceData.id}`, {
        name,
        device_category_id: categoryId,
        device_type_id: typeId,
        status,
        office_id: officeId,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowEditModal(false);
      setEditDeviceData(null);
      if (typeof window !== 'undefined') window.location.reload();
    } catch (e) {
      setEditError(e?.response?.data?.message || 'Failed to update device');
    } finally {
      setEditLoading(false);
    }
  };
  return (
    <Modal
      visible={showEditModal && !!editDeviceData}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%', maxHeight: '90%' }}>
          <ScrollView>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1976d2' }}>Edit Device</Text>
            {editError ? <Text style={{ color: 'red', marginBottom: 8 }}>{editError}</Text> : null}
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Name</Text>
            <TextInput value={name} onChangeText={setName} style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 12 }} />
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Category</Text>
            <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12 }}>
              <Picker selectedValue={categoryId} onValueChange={val => setCategoryId(val)}>
                <Picker.Item label="Select Category" value="" />
                {categories.map(c => <Picker.Item key={c.id} label={c.name} value={c.id?.toString()} />)}
              </Picker>
            </View>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Type</Text>
            <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12 }}>
              <Picker selectedValue={typeId} onValueChange={setTypeId} enabled={!!categoryId}>
                <Picker.Item label="Select Type" value="" />
                {types.map(t => <Picker.Item key={t.id} label={t.name} value={t.id?.toString()} />)}
              </Picker>
            </View>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Status</Text>
            <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12 }}>
              <Picker selectedValue={status} onValueChange={setStatus}>
                <Picker.Item label="Select Status" value="" />
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="Resolved" value="resolved" />
                <Picker.Item label="Repair" value="repair" />
                <Picker.Item label="Decommissioned" value="decommissioned" />
              </Picker>
            </View>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Office</Text>
            <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12 }}>
              <Picker selectedValue={officeId} onValueChange={setOfficeId}>
                <Picker.Item label="Select Office" value="" />
                {offices.map(o => <Picker.Item key={o.id} label={o.name} value={o.id?.toString()} />)}
              </Picker>
            </View>
            <Button title={editLoading ? "Saving..." : "Save"} onPress={handleSave} disabled={editLoading} color="#1976d2" />
            <Button title="Cancel" onPress={() => setShowEditModal(false)} color="#757575" style={{ marginTop: 8 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Status</Text>
          <ScrollView>
            {statusOptions.map(status => (
              <TouchableOpacity
                key={status.value}
                style={styles.pickerItem}
                onPress={() => {
                  setStatusFilter(status.value);
                  setShowStatusModal(false);
                }}
              >
                <Text style={styles.pickerItemText}>{status.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowStatusModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Helper to get device type name robustly
const getDeviceTypeName = (device: Device) => {
  // Try to find type in types array (current category)
  let typeId = device.device_type_id?.toString() || device.type?.id?.toString();
  let foundType = types.find(t => t.id?.toString() === typeId);
  if (foundType) return foundType.name;
  // Fallback: search all categories' types if available
  if (Array.isArray(categories)) {
    for (const cat of categories) {
      if (Array.isArray(cat.types)) {
        const t = cat.types.find(tt => tt.id?.toString() === typeId);
        if (t) return t.name;
      }
    }
  }
  // Fallback: check device.type.name
  if (device.type && device.type.name) return device.type.name;
  return 'Unknown Type';
};



  return (
    <View style={{ flex: 1, backgroundColor: '#f7f8fa' }}>
      <DebugUserRole />
      <TouchableOpacity
        style={styles.backButton}
        onPress={async () => {
          try {
            const userRole = await AsyncStorage.getItem('user_role');
            if (userRole === 'admin' || userRole === 'superadmin') {
              router.replace('/screens/adminDashboard');
            } else if (userRole === 'staff') {
              router.replace('/screens/staffDashboard');
            } else if (userRole === 'user') {
              router.replace('/screens/userDashboard');
            } else {
              router.replace('/screens/userDashboard');
            }
          } catch {
            router.replace('/screens/userDashboard');
          }
        }}
        testID="back-btn"
      >
        <Ionicons name="arrow-back" size={28} color="#1976d2" />
      </TouchableOpacity>
      <Text style={styles.title}>Devices</Text>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/deviceCreate')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      {renderFilterBar()}
      <View style={styles.deviceGrid}>
        {loading ? (
          <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 48 }} />
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : (
          <FlatList
            data={paginatedDevices}
            keyExtractor={item => item.id?.toString() || Math.random().toString()}
            renderItem={renderDeviceCard}
            contentContainerStyle={{ paddingBottom: 32, paddingTop: 8, paddingHorizontal: 4 }}
            numColumns={numColumns}
            {...(numColumns > 1 ? { columnWrapperStyle: { justifyContent: 'space-between', marginBottom: 16 } } : {})}
            ListEmptyComponent={<Text style={{ color: '#888', fontSize: 16, marginTop: 32, textAlign: 'center' }}>No devices found.</Text>}
            refreshing={refreshing}
            onRefresh={onRefresh}
            showsVerticalScrollIndicator={false}
          />
        )}
        {totalPages > 1 && (
          <View style={styles.paginationRowMobile}>
            <TouchableOpacity
              style={[styles.pageButtonMobile, currentPage === 1 && styles.disabledButtonMobile]}
              onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <Text style={styles.pageButtonTextMobile}>{'< Prev'}</Text>
            </TouchableOpacity>
            <Text style={styles.pageInfoMobile}>{`${currentPage} / ${totalPages}`}</Text>
            <TouchableOpacity
              style={[styles.pageButtonMobile, currentPage === totalPages && styles.disabledButtonMobile]}
              onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <Text style={styles.pageButtonTextMobile}>{'Next >'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {renderDeviceModal()}
      {renderCategoryModal()}
      {renderTypeModal()}
      {renderOfficeModal()}
      {renderStatusModal()}
      {renderEditModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    paddingTop: 24,
    paddingHorizontal: 8,
  },
  backButton: {
    position: 'absolute',
    top: 40,
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
    color: '#1976d2',
    marginTop: 48,
    marginBottom: 12,
    alignSelf: 'center',
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    width: '100%',
  },
  addButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    padding: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginHorizontal: 2,
    minWidth: 70,
    marginBottom: 2,
  },
  filterButtonMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginHorizontal: 2,
    minWidth: 90,
    marginBottom: 2,
    marginTop: 2,
    elevation: 1,
  },
  deviceGrid: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 2,
  },
  deviceCardMobile: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 2,
  },
  deviceImageMobile: {
    width: '98%',
    height: 160,
    borderRadius: 14,
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  statusBadge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976d2',
    marginBottom: 2,
  },
  deviceNameMobile: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1976d2',
    marginBottom: 2,
    marginTop: 6,
  },
  deviceType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  deviceTypeMobile: {
    fontSize: 15,
    color: '#666',
    marginBottom: 2,
  },
  deviceOffice: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  deviceOfficeMobile: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
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
  deviceStatusMobile: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  paginationRowMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 8,
    gap: 6,
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
  pageButtonMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#b0b0b0',
  },
  disabledButtonMobile: {
    backgroundColor: '#f0f0f0',
    borderColor: '#b0b0b0',
  },
  pageButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,
    marginHorizontal: 2,
  },
  pageButtonTextMobile: {
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
  pageInfoMobile: {
    fontSize: 16,
    marginHorizontal: 8,
    color: '#222',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 18,
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    width: '92%',
    maxHeight: '90%',
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
    marginTop: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  editBtn: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 8,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DevicesScreen;

