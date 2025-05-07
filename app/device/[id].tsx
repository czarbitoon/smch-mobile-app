import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView, Button, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const fetchDevice = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${API_URL}/devices/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (isMounted) {
          setDevice(res.data?.data || res.data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load device details.');
          setLoading(false);
        }
      }
    };
    fetchDevice();
    return () => { isMounted = false; };
  }, [id]);

  const handleReportDevice = async () => {
    if (!device) return;
    setReportLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/reports`, {
        device_id: device.id,
        description: `Reported from mobile app for device: ${device.name}`
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      Alert.alert('Success', 'Report created successfully!');
      router.push('/(tabs)/reports');
    } catch (err) {
      Alert.alert('Error', 'Failed to create report.');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }
  if (!device) {
    return (
      <View style={styles.centered}>
        <Text>No device found.</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {device.image_url ? (
        <Image source={{ uri: device.image_url }} style={styles.image} />
      ) : null}
      <Text style={styles.title}>{device.name}</Text>
      <Text style={styles.label}>Office: <Text style={styles.value}>{device.office?.name || device.office || 'N/A'}</Text></Text>
      <Text style={styles.label}>Type: <Text style={styles.value}>{device.type?.name || device.type || 'N/A'}</Text></Text>
      <Text style={styles.label}>Status: <Text style={styles.value}>{device.status || 'N/A'}</Text></Text>
      <Text style={styles.label}>Description:</Text>
      <Text style={styles.desc}>{device.description || 'No description.'}</Text>
      <View style={{ marginTop: 24, width: '100%' }}>
        <Button title={reportLoading ? 'Reporting...' : 'Report Device'} color="#d32f2f" onPress={handleReportDevice} disabled={reportLoading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 24,
    resizeMode: 'cover',
    backgroundColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1976d2',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
});