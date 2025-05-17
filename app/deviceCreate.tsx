import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Picker } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'react-native-image-picker';
import { Ionicons } from '@expo/vector-icons';
import useUserRole from './utils/useUserRole';
import { Snackbar } from 'react-native-paper';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

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
};

const DeviceCreateScreen = () => {
  const router = useRouter();
  const userRole = useUserRole();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [office, setOffice] = useState('');
  const [status, setStatus] = useState('resolved');
  const [image, setImage] = useState(null);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'info' });


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

  const fetchOffices = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/offices`, { headers: { Authorization: `Bearer ${token}` } });
      setOffices(res.data?.data?.offices || res.data?.offices || []);
    } catch {
      setOffices([]);
    }
  };

  const handlePickImage = async () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Image Picker Error', response.errorMessage || 'Unknown error');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setImage(response.assets[0]);
      }
    });
  };

  const handleSubmit = async () => {
    if (!name || !category || !type || !office || !description) {
      setError('Please fill all required fields.');
      setSnackbar({ visible: true, message: 'Please fill all required fields.', type: 'error' });
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('device_category_id', category);
      formData.append('device_type_id', type);
      formData.append('office_id', office);
      formData.append('status', status);
      if (image) {
        formData.append('image', {
          uri: image.uri,
          name: image.fileName || 'device.jpg',
          type: image.type || 'image/jpeg',
        });
      }
      await axios.post(`${API_URL}/devices`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setSnackbar({ visible: true, message: 'Device created successfully', type: 'success' });
      setTimeout(() => router.replace('/(tabs)/devices'), 1200);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create device');
      setSnackbar({ visible: true, message: e?.response?.data?.message || 'Failed to create device', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (

    <ScrollView contentContainerStyle={styles.container}>
      <View>
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
              router.replace('/(tabs)/index');
            }
          } catch {
            router.replace('/(tabs)/index');
          }
        }}
        testID="back-btn"
      >
        <Ionicons name="arrow-back" size={28} color="#1976d2" />
      </TouchableOpacity>
    </View>
      <Text style={styles.title}>Create Device</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput style={styles.input} placeholder="Device Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Description (required)" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
      <Text style={styles.label}>Category</Text>
       <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12 }}>
                    <Picker selectedValue={category} onValueChange={val => { setCategory(val); setSelectedCategory(val); }}>
                      <Picker.Item label="Select Category" value="" />
                      {categories.map(c => <Picker.Item key={c.id} label={c.name} value={c.id?.toString()} />)}
                    </Picker>
      </View>
      <Text style={styles.label}>Type</Text>
      <View style={styles.pickerWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {types.map((t) => (
            <TouchableOpacity key={t.id} style={[styles.pickerItem, type === t.id && styles.selectedPicker]} onPress={() => setType(t.id)}>
              <Text style={type === t.id ? styles.selectedPickerText : styles.pickerText}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <Text style={styles.label}>Office</Text>
      <View style={styles.pickerWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {offices.map((o) => (
            <TouchableOpacity key={o.id} style={[styles.pickerItem, office === o.id && styles.selectedPicker]} onPress={() => setOffice(o.id)}>
              <Text style={styles.pickerText}>{o.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <Text style={styles.label}>Status</Text>
      <View style={styles.pickerWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['pending', 'resolved', 'repair', 'decommissioned'].map((s) => (
            <TouchableOpacity key={s} style={[styles.pickerItem, status === s && styles.selectedPicker]} onPress={() => setStatus(s)}>
              <Text style={styles.pickerText}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imagePickerText}>Pick Image</Text>
        )}
      </TouchableOpacity>
      <Button title={loading ? 'Creating...' : 'Create Device'} onPress={handleSubmit} disabled={loading} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1976d2', marginBottom: 16, textAlign: 'center' },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f7f8fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontWeight: 'bold', marginTop: 12, marginBottom: 4, color: '#333' },
  pickerWrapper: { flexDirection: 'row', marginBottom: 8 },
  pickerItem: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#eee', borderRadius: 8, marginRight: 8 },
  selectedPicker: { backgroundColor: '#1976d2' },
  pickerText: { color: '#333', fontWeight: 'bold' },
  imagePicker: { marginVertical: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bbb', borderRadius: 8, height: 120 },
  imagePickerText: { color: '#888', fontSize: 16 },
  imagePreview: { width: 120, height: 120, borderRadius: 8 },
  error: { color: 'red', marginBottom: 8, textAlign: 'center' },
});

export default DeviceCreateScreen;
