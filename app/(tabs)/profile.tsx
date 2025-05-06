import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Button, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2/api';

const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const name = await AsyncStorage.getItem('user_name');
        const email = await AsyncStorage.getItem('user_email');
        setUser({ name: name || '', email: email || '' });
      } catch (e) {
        setUser({ name: '', email: '' });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleEditProfile = () => {
    setShowEditModal(true);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditError('');
    setEditSuccess('');
  };

  const handleProfileUpdate = async () => {
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/profile/update`,
        { name: editName, email: editEmail },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setEditSuccess('Profile updated successfully!');
      setShowEditModal(false);
      setUser({ name: editName, email: editEmail });
      await AsyncStorage.setItem('user_name', editName);
      await AsyncStorage.setItem('user_email', editEmail);
    } catch (err) {
      setEditError('Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={{ fontSize: 18, color: '#888', marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }} onPress={() => router.back()} testID="back-btn">
        <Ionicons name="arrow-back" size={28} color="#1976d2" />
      </TouchableOpacity>
      <View style={styles.profileCard}>
        <View style={styles.avatar} />
        <Text style={styles.profileName}>{user.name}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.infoSection}>
        <Text style={styles.infoLabel}>Email:</Text>
        <Text style={styles.infoValue}>{user.email}</Text>
      </View>
      {showEditModal && (
        <View style={styles.editModal}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={editName}
            onChangeText={setEditName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={editEmail}
            onChangeText={setEditEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button title="Cancel" color="#888" onPress={() => setShowEditModal(false)} />
            <Button title={editLoading ? 'Saving...' : 'Save'} onPress={handleProfileUpdate} disabled={editLoading} />
          </View>
          {editError ? <Text style={{ color: 'red', marginTop: 8 }}>{editError}</Text> : null}
          {editSuccess ? <Text style={{ color: 'green', marginTop: 8 }}>{editSuccess}</Text> : null}
        </View>
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
  profileCard: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#90caf9',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    width: '100%',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoValue: {
    marginBottom: 8,
  },
  editButton: {
    marginTop: 12,
    backgroundColor: '#1976d2',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editModal: {
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
});

export default Profile;