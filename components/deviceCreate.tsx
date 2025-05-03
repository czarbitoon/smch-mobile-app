// The file now includes dynamic dropdowns for device type, category, subcategory, and office.
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

const DeviceCreateScreen = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const handleSubmit = async () => {
    if (!name || !type || !officeId) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/devices`, {
        name,
        type,
        office_id: officeId
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      Alert.alert('Success', 'Device created successfully!');
      setName('');
      setType('');
      setOfficeId('');
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to create device.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${API_URL}/device-categories`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setCategories(res.data.data.categories || []);
      } catch (err) {
        setCategories([]);
      }
    };
    const fetchOffices = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${API_URL}/offices`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setOffices(res.data.data.offices || []);
      } catch (err) {
        setOffices([]);
      }
    };
    fetchCategories();
    fetchOffices();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      if (!selectedCategory) { setTypes([]); return; }
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${API_URL}/device-categories/${selectedCategory}/types`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setTypes(res.data.data.types || []);
      } catch (err) {
        setTypes([]);
      }
    };
    fetchTypes();
    setSelectedType('');
  }, [selectedCategory]);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedCategory) { setSubcategories([]); return; }
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${API_URL}/device-categories/${selectedCategory}/subcategories`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setSubcategories(res.data.data.subcategories || []);
      } catch (err) {
        setSubcategories([]);
      }
    };
    fetchSubcategories();
    setSelectedSubcategory('');
  }, [selectedCategory]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Device</Text>
      <TextInput
        style={styles.input}
        placeholder="Device Name"
        value={name}
        onChangeText={setName}
      />
      <Picker
        selectedValue={selectedCategory}
        onValueChange={setSelectedCategory}
        style={styles.input}
      >
        <Picker.Item label="Select Category" value="" />
        {categories.map((cat) => (
          <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
        ))}
      </Picker>
      <Picker
        selectedValue={selectedType}
        onValueChange={setSelectedType}
        style={styles.input}
        enabled={!!selectedCategory}
      >
        <Picker.Item label="Select Type" value="" />
        {types.map((type) => (
          <Picker.Item key={type.id} label={type.name} value={type.id} />
        ))}
      </Picker>
      <Picker
        selectedValue={selectedSubcategory}
        onValueChange={setSelectedSubcategory}
        style={styles.input}
        enabled={!!selectedCategory}
      >
        <Picker.Item label="Select Subcategory" value="" />
        {subcategories.map((sub) => (
          <Picker.Item key={sub.id} label={sub.name} value={sub.id} />
        ))}
      </Picker>
      <Picker
        selectedValue={officeId}
        onValueChange={setOfficeId}
        style={styles.input}
      >
        <Picker.Item label="Select Office" value="" />
        {offices.map((office) => (
          <Picker.Item key={office.id} label={office.name} value={office.id} />
        ))}
      </Picker>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <Button title="Create Device" onPress={handleSubmit} color="#007bff" />
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
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
});

export default DeviceCreateScreen;