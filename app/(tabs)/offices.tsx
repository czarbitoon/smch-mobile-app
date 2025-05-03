import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

const OfficesScreen = () => {
  const router = useRouter();
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddOffice, setShowAddOffice] = useState(false);
  const [officeName, setOfficeName] = useState("");
  const [addingOffice, setAddingOffice] = useState(false);
  const [addOfficeError, setAddOfficeError] = useState("");
  const [addOfficeSuccess, setAddOfficeSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    const fetchOffices = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${API_URL}/offices`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setOffices(response.data.data.offices || []);
      } catch (err) {
        setError('Failed to fetch offices');
        setOffices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOffices();
  }, []);

  const handleAddOffice = async () => {
    setAddingOffice(true);
    setAddOfficeError("");
    setAddOfficeSuccess("");
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/offices`,
        { name: officeName },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setAddOfficeSuccess("Office added successfully!");
      setOfficeName("");
      setShowAddOffice(false);
      setTimeout(() => setAddOfficeSuccess(""), 2000);
      // Refresh office list
      const refreshed = await axios.get(`${API_URL}/offices`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setOffices(refreshed.data.data.offices || []);
    } catch (err) {
      setAddOfficeError(err.response?.data?.error || "Failed to add office");
    } finally {
      setAddingOffice(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(offices.length / pageSize);
  const paginatedOffices = offices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const renderOfficeCard = ({ item }) => (
    <View style={styles.officeCardGrid}>
      <Text style={styles.officeName}>{item.name}</Text>
      <Button title="View Devices" onPress={() => router.push(`/office/${item.id}`)} color="#1976d2" />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offices</Text>
      {loading && <ActivityIndicator size="large" color="#007bff" />}
      {error && <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>}
      <FlatList
        data={paginatedOffices}
        keyExtractor={item => item.id?.toString()}
        renderItem={renderOfficeCard}
        numColumns={3}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={!loading && <Text>No offices found.</Text>}
      />
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
      <Button title="Add Office" onPress={() => setShowAddOffice(true)} />
      {showAddOffice && (
        <View style={styles.addOfficeModal}>
          <Text style={styles.modalTitle}>Add Office</Text>
          <TextInput
            style={styles.input}
            placeholder="Office Name"
            value={officeName}
            onChangeText={setOfficeName}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button title="Cancel" color="#888" onPress={() => setShowAddOffice(false)} />
            <Button title={addingOffice ? "Adding..." : "Add"} onPress={handleAddOffice} disabled={addingOffice} />
          </View>
          {addOfficeError ? <Text style={{ color: 'red', marginTop: 8 }}>{addOfficeError}</Text> : null}
          {addOfficeSuccess ? <Text style={{ color: 'green', marginTop: 8 }}>{addOfficeSuccess}</Text> : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
  },
  gridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  officeCardGrid: {
    flex: 1,
    minWidth: 100,
    maxWidth: '30%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    margin: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  officeCard: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  officeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  officeLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  addOfficeModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    width: '100%',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1976d2',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  disabledButton: {
    backgroundColor: '#b0b0b0',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pageInfo: {
    fontSize: 16,
    marginHorizontal: 8,
  },
});

export default OfficesScreen;