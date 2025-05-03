import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TextInput, ActivityIndicator, Image, FlatList, TouchableOpacity, Modal } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

const DevicesScreen = () => {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [types, setTypes] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const pageSize = 9;
  const [userRole, setUserRole] = useState("");

  // Fetch devices
  useEffect(() => {
    const fetchDevices = async () => {
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
        const params = {};
        if (selectedCategory) params.device_category_id = selectedCategory;
        if (typeFilter) params.device_type_id = typeFilter;
        if (selectedSubcategory) params.device_subcategory_id = selectedSubcategory;
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
        setDevices(deviceArray);
      } catch (e) {
        if (e.response && e.response.status === 401) {
          setError('Session expired. Please login again.');
          await AsyncStorage.removeItem('token');
          router.replace('/auth/login');
        } else {
          setError('Failed to fetch devices');
        }
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, [selectedCategory, typeFilter, selectedSubcategory, selectedOffice, statusFilter]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setCategories([]);
          return;
        }
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
        setCategories(categoriesArr);
      } catch (e) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch types
  useEffect(() => {
    const fetchTypes = async () => {
      if (!selectedCategory) {
        setTypes([]);
        setTypeFilter('');
        return;
      }
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setTypes([]);
          setTypeFilter('');
          return;
        }
        const typesRes = await axios.get(`${API_URL}/device-categories/${selectedCategory}/types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (typesRes.data && typesRes.data.data && Array.isArray(typesRes.data.data.types)) {
          setTypes(typesRes.data.data.types);
        } else if (Array.isArray(typesRes.data.types)) {
          setTypes(typesRes.data.types);
        } else {
          setTypes([]);
        }
        setTypeFilter('');
      } catch (e) {
        setTypes([]);
        setTypeFilter('');
      }
    };
    fetchTypes();
  }, [selectedCategory]);

  // Fetch subcategories
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedCategory) {
        setSubcategories([]);
        setSelectedSubcategory('');
        return;
      }
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setSubcategories([]);
          setSelectedSubcategory('');
          return;
        }
        const res = await axios.get(`${API_URL}/device-categories/${selectedCategory}/subcategories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && res.data.data && Array.isArray(res.data.data.subcategories)) {
          setSubcategories(res.data.data.subcategories);
        } else if (Array.isArray(res.data.subcategories)) {
          setSubcategories(res.data.subcategories);
        } else {
          setSubcategories([]);
        }
        setSelectedSubcategory('');
      } catch (e) {
        setSubcategories([]);
        setSelectedSubcategory('');
      }
    };
    fetchSubcategories();
  }, [selectedCategory]);

  // Filter devices
  useEffect(() => {
    let filtered = Array.isArray(devices) ? devices : [];
    if (search) {
      filtered = filtered.filter(device => device.name?.toLowerCase().includes(search.toLowerCase()));
    }
    if (selectedOffice) {
      filtered = filtered.filter(device => device.office && device.office.id?.toString() === selectedOffice);
    }
    if (statusFilter) {
      filtered = filtered.filter(device => device.status?.toString().toLowerCase() === statusFilter.toLowerCase());
    }
    if (typeFilter) {
      filtered = filtered.filter(device => device.type && device.type.id?.toString() === typeFilter);
    }
    if (selectedSubcategory) {
      filtered = filtered.filter(device => device.subcategory && device.subcategory.id?.toString() === selectedSubcategory);
    }
    setFilteredDevices(Array.isArray(filtered) ? filtered : []);
  }, [devices, search, selectedOffice, statusFilter, typeFilter, selectedSubcategory]);

  // Pagination
  const totalPages = Math.ceil((filteredDevices?.length || 0) / pageSize);
  const paginatedDevices = filteredDevices?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'working':
        return '#4caf50'; // Green
      case 'defective':
        return '#f44336'; // Red
      case 'for repair':
        return '#ff9800'; // Orange
      case 'condemned':
        return '#bdbdbd'; // Grey
      default:
        return '#bdbdbd'; // Grey
    }
  };

  return (
    <>
      <View style={styles.container}>
      <Text style={styles.title}>Devices</Text>
      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowCategoryModal(true)}>
          <Text style={styles.filterButtonText}>
            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name || 'Category' : 'Category'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowTypeModal(true)} disabled={!selectedCategory}>
          <Text style={styles.filterButtonText}>
            {typeFilter ? types.find(t => t.id === typeFilter)?.name || 'Type' : 'Type'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowSubcategoryModal(true)} disabled={!typeFilter}>
          <Text style={styles.filterButtonText}>
            {selectedSubcategory ? subcategories.find(s => s.id === selectedSubcategory)?.name || 'Subcategory' : 'Subcategory'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowOfficeModal(true)}>
          <Text style={styles.filterButtonText}>
            {selectedOffice ? offices.find(o => o.id === selectedOffice)?.name || 'Office' : 'Office'}
          </Text>
        </TouchableOpacity>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Status</Text>
          <Picker
            selectedValue={statusFilter}
            onValueChange={setStatusFilter}
            style={styles.picker}
          >
            <Picker.Item label="All Statuses" value="" />
            <Picker.Item label="Working" value="working" />
            <Picker.Item label="Defective" value="defective" />
            <Picker.Item label="For Repair" value="for repair" />
            <Picker.Item label="Condemned" value="condemned" />
          </Picker>
        </View>
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
          keyExtractor={item => item.id?.toString()}
          renderItem={({ item }) => (
            <View style={styles.deviceCard}>
              <TouchableOpacity onPress={() => router.push({ pathname: '/reportCreate', params: { deviceId: item.id, deviceName: item.name } })}>
                <Image source={{ uri: item.image_url || undefined }} style={styles.deviceImage} resizeMode="cover" />
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.deviceMeta}>{item.type?.name || ''} | {item.office?.name || ''}</Text>
                <Text style={[styles.deviceStatus, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </TouchableOpacity>
            </View>
          )}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No devices found.</Text>}
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
            <ScrollView>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setTypeFilter('');
                  setShowTypeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>All Types</Text>
              </TouchableOpacity>
              {types.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setTypeFilter(type.id);
                    setShowTypeModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Cancel" onPress={() => setShowTypeModal(false)} />
          </View>
        </View>
      </Modal>

      {/* Subcategory Modal */}
      <Modal visible={showSubcategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Subcategory</Text>
            <ScrollView>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSelectedSubcategory('');
                  setShowSubcategoryModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>All Subcategories</Text>
              </TouchableOpacity>
              {subcategories.map(sub => (
                <TouchableOpacity
                  key={sub.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedSubcategory(sub.id);
                    setShowSubcategoryModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{sub.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
    </>
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
    minWidth: 110,
    maxWidth: '30%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    margin: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#e0e0e0',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  deviceMeta: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    textAlign: 'center',
  },
  deviceStatus: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
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

// Wrap all root-level JSX in a single React Fragment
<>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
    <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Devices</Text>
    {userRole === 'admin' && (
      <TouchableOpacity style={{ backgroundColor: '#1976d2', padding: 10, borderRadius: 8 }} onPress={() => router.push('/deviceCreate')} testID="create-device-btn">
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Create Device</Text>
      </TouchableOpacity>
    )}
  </View>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
</>
</>
  {/* Subcategory Modal */}
  <Modal visible={showSubcategoryModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select Subcategory</Text>
        <ScrollView>
          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setSelectedSubcategory('');
              setShowSubcategoryModal(false);
            }}
          >
            <Text style={styles.modalOptionText}>All Subcategories</Text>
          </TouchableOpacity>
          {subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={styles.modalOption}
              onPress={() => {
                setSelectedSubcategory(sub.id);
                setShowSubcategoryModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button title="Cancel" onPress={() => setShowSubcategoryModal(false)} />
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
              <Text style