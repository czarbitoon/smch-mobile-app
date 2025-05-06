import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    axios.get(`${API_URL}/devices/${id}`)
      .then(res => {
        if (isMounted) {
          setDevice(res.data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError('Failed to load device details.');
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [id]);

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
      <Text style={styles.label}>Office: <Text style={styles.value}>{device.office}</Text></Text>
      <Text style={styles.label}>Type: <Text style={styles.value}>{device.type}</Text></Text>
      <Text style={styles.label}>Status: <Text style={styles.value}>{device.status}</Text></Text>
      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{device.description || 'No description.'}</Text>
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