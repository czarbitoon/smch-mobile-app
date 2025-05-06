import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Modal, TouchableOpacity } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

const CustomPickerModal = ({ visible, onClose, options, selectedValue, onValueChange }) => (
  <Modal visible={visible} transparent={true} animationType="slide">
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        {options.map((option) => (
          <TouchableOpacity key={option.value} onPress={() => { onValueChange(option.value); onClose(); }}>
            <Text style={styles.modalOption}>{option.label}</Text>
          </TouchableOpacity>
        ))}
        <Button title="Close" onPress={onClose} />
      </View>
    </View>
  </Modal>
);

const DeviceCreateScreen = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [officeModalVisible, setOfficeModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const handleSubmit = async () => {
    if (!name || !type || !officeId || !status) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/devices`, {
        name,
        type,
        office_id: officeId,
        status
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      Alert.alert('Success', 'Device created successfully!');
      setName('');
      setType('');
      setOfficeId('');
      setStatus('');
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Device</Text>
      <TextInput
        style={styles.input}
        placeholder="Device Name"
        value={name}
        onChangeText={setName}
      />
      <TouchableOpacity onPress={() => setCategoryModalVisible(true)} style={styles.input}>
        <Text>{selectedCategory ? categories.find(cat => cat.id === selectedCategory).name : 'Select Category'}</Text>
      </TouchableOpacity>
      <CustomPickerModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
        selectedValue={selectedCategory}
        onValueChange={setSelectedCategory}
      />
      <TouchableOpacity onPress={() => setTypeModalVisible(true)} style={styles.input} disabled={!selectedCategory}>
        <Text>{selectedType ? types.find(type => type.id === selectedType).name : 'Select Type'}</Text>
      </TouchableOpacity>
      <CustomPickerModal
        visible={typeModalVisible}
        onClose={() => setTypeModalVisible(false)}
        options={types.map(type => ({ label: type.name, value: type.id }))}
        selectedValue={selectedType}
        onValueChange={setSelectedType}
      />
      <TouchableOpacity onPress={() => setOfficeModalVisible(true)} style={styles.input}>
        <Text>{officeId ? offices.find(office => office.id === officeId).name : 'Select Office'}</Text>
      </TouchableOpacity>
      <CustomPickerModal
        visible={officeModalVisible}
        onClose={() => setOfficeModalVisible(false)}
        options={offices.map(office => ({ label: office.name, value: office.id }))}
        selectedValue={officeId}
        onValueChange={setOfficeId}
      />
      <TouchableOpacity onPress={() => setStatusModalVisible(true)} style={styles.input}>
        <Text>{status || 'Select Status'}</Text>
      </TouchableOpacity>
      <CustomPickerModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        options={[
          { label: 'Resolved', value: 'resolved' },
          { label: 'Pending', value: 'pending' },
          { label: 'Repair', value: 'repair' },
          { label: 'Decommissioned', value: 'decommissioned' }
        ]}
        selectedValue={status}
        onValueChange={setStatus}
      />
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalOption: {
    padding: 10,
    fontSize: 18,
  },
});

export default DeviceCreateScreen;

// Confirmed: No subcategory-related state, props, or logic present in the first 60 lines. No further action needed unless found in later lines.
