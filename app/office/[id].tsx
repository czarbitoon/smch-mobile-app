import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from "../../utils/api";

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with padding

const OfficeDevicesScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [devices, setDevices] = useState([]);
  const [office, setOffice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchOfficeAndDevices = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await AsyncStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Fetch office details
        const officeResponse = await axios.get(`${API_URL}/offices/${id}`, { headers });
        setOffice(officeResponse.data.data);
        
        // Fetch devices for this office
        const devicesResponse = await axios.get(`${API_URL}/devices?office_id=${id}`, { headers });
        const deviceData = devicesResponse.data.data?.data || devicesResponse.data.data || [];
        setDevices(Array.isArray(deviceData) ? deviceData : []);
      } catch (err) {
        console.error('Error fetching office devices:', err);
        setError('Failed to fetch office devices');
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchOfficeAndDevices();
    }
  }, [id]);

  const getDeviceImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/images/')) return `${API_URL}${imageUrl}`;
    return `${API_URL}/images/${imageUrl}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'repair': return '#f44336';
      case 'decommissioned': return '#9e9e9e';
      default: return '#2196f3';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 'Resolved';
      case 'pending': return 'Pending';
      case 'repair': return 'Under Repair';
      case 'decommissioned': return 'Decommissioned';
      default: return 'Unknown';
    }
  };

  // Pagination
  const totalPages = Math.ceil(devices.length / pageSize);
  const paginatedDevices = devices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const renderDeviceCard = ({ item }) => {
    const imageUrl = getDeviceImageUrl(item.image_url || item.image);
    
    return (
      <TouchableOpacity 
        style={styles.deviceCard}
        onPress={() => router.push(`/device/${item.id}`)}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.deviceImage}
              defaultSource={require('../assets/default.png')}
            />
          ) : (
            <View style={[styles.deviceImage, styles.placeholderImage]}>
              <Ionicons name="hardware-chip-outline" size={40} color="#ccc" />
            </View>
          )}
        </View>
        
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.deviceType}>{item.type?.name || 'Unknown Type'}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <Text style={styles.paginationText}>Previous</Text>
        </TouchableOpacity>
        
        <Text style={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </Text>
        
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.paginationText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color="#1976d2" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {office?.name || 'Office'} Devices
        </Text>
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Loading devices...</Text>
        </View>
      )}

      {error && (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setCurrentPage(1);
              fetchOfficeAndDevices();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <>
          {devices.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="hardware-chip-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No devices found in this office</Text>
            </View>
          ) : (
            <>
              <Text style={styles.deviceCount}>
                {devices.length} device{devices.length !== 1 ? 's' : ''} found
              </Text>
              
              <FlatList
                data={paginatedDevices}
                keyExtractor={(item) => item.id?.toString()}
                renderItem={renderDeviceCard}
                numColumns={2}
                contentContainerStyle={styles.devicesList}
                showsVerticalScrollIndicator={false}
              />
              
              {renderPagination()}
            </>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  deviceCount: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  devicesList: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 8,
    width: cardWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: cardWidth * 0.6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  deviceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfo: {
    padding: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  paginationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pageInfo: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
});

export default OfficeDevicesScreen;