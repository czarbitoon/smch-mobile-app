import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://api:8000/api';

const DevicesScreen = () => {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [userType, setUserType] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [types, setTypes] = useState([]);

  // Fetch devices from API
  const fetchDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      let user = null;
      if (userStr) {
        user = JSON.parse(userStr);
        setUserType(user?.type ?? null);
      }
      let url = `${API_URL}/devices`;
      let params = {};
      if (user && user.type !== 2) {
        // Assume user.office_id exists for staff/user
        params.office_id = user.office_id;
      }
      const response = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });
      setDevices(response.data.data.devices || []);
    } catch (err) {
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    // Fetch types for filter dropdown
    const fetchTypes = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const typesRes = await axios.get(`${API_URL}/device-types`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setTypes(typesRes.data.data.types || []);
      } catch (e) {
        setTypes([]);
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    // Filter devices by search, status, and type
    let filtered = devices;
    if (search) {
      filtered = filtered.filter(device => device.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (statusFilter) {
      filtered = filtered.filter(device => device.status === statusFilter);
    }
    if (typeFilter) {
      filtered = filtered.filter(device => device.type === typeFilter);
    }
    setFilteredDevices(filtered);
  }, [search, devices, statusFilter, typeFilter]);

  // Status color helper
  const getStatusColor = (status) => {
    if (status === 'Active') return '#43a047';
    if (status === 'Inactive') return '#e53935';
    return '#888';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Devices</Text>
      <View style={styles.filterRow}>
        <View style={styles.filterCol}>
          <Picker
            selectedValue={statusFilter}
            onValueChange={setStatusFilter}
            style={styles.picker}
          >
            <Picker.Item label="All Statuses" value="" />
            <Picker.Item label="Active" value="Active" />
            <Picker.Item label="Inactive" value="Inactive" />
          </Picker>
        </View>
        <View style={styles.filterCol}>
          <Picker
            selectedValue={typeFilter}
            onValueChange={setTypeFilter}
            style={styles.picker}
          >
            <Picker.Item label="All Types" value="" />
            {types.map(type => (
              <Picker.Item key={type.id} label={type.name} value={type.name} />
            ))}
          </Picker>
        </View>
        <Button title="Clear" onPress={() => { setStatusFilter(''); setTypeFilter(''); }} />
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search devices..."
        value={search}
        onChangeText={setSearch}
      />
      {loading && <ActivityIndicator size="large" color="#007bff" />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && filteredDevices.length === 0 && (
        <Text style={styles.empty}>No devices found.</Text>
      )}
      {!loading && filteredDevices.map(device => (
        <View key={device.id} style={styles.deviceCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: getStatusColor(device.status), marginRight: 8 }} />
            <Text style={styles.deviceName}>{device.name}</Text>
          </View>
          <Text style={styles.deviceStatus}>{device.status}</Text>
        </View>
      ))}
      {userType === 2 && (
        <Button title="Add Device" onPress={() => Alert.alert('Add Device', 'Feature coming soon!')} />
      )}
    </ScrollView>
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
  searchInput: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  deviceCard: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deviceStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  empty: {
    color: '#888',
    fontSize: 16,
    marginTop: 32,
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  picker: {
    height: 40,
    width: '100%',
  },
});

export default DevicesScreen;