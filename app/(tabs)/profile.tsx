import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Button, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import useUserRole from '../utils/useUserRole';

import { API_URL } from "../utils/api";

const Profile = () => {
  const router = useRouter();
  const userRole = useUserRole();
  const [user, setUser] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const name = await AsyncStorage.getItem('user_name');
        const email = await AsyncStorage.getItem('user_email');
        const image = await AsyncStorage.getItem('user_image');
        setUser({ name: name || '', email: email || '' });
        setProfileImage(image || null);
      } catch (e) {
        setUser({ name: '', email: '' });
        setProfileImage(null);
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
      <TouchableOpacity style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }} onPress={async () => {
        if (userRole === 'admin' || userRole === 'superadmin') {
          router.replace('/screens/adminDashboard');
        } else if (userRole === 'staff') {
          router.replace('/screens/staffDashboard');
        } else if (userRole === 'user') {
          router.replace('/screens/userDashboard');
        } else {
          router.replace('/(tabs)/index');
        }
      }} testID="back-btn">
        <Ionicons name="arrow-back" size={28} color="#1976d2" />
      </TouchableOpacity>
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={async () => {
          setImageError('');
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: false
          });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            // Validate image type and size (<10MB)
            if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
              setImageError('Image must be less than 10MB.');
              return;
            }
            if (asset.type && !['image/jpeg', 'image/png', 'image/jpg'].includes(asset.type)) {
              setImageError('Only JPG and PNG images are allowed.');
              return;
            }
            setUploading(true);
            const formData = new FormData();
            formData.append('photo', { uri: asset.uri, name: asset.fileName || 'profile.jpg', type: asset.type || 'image/jpeg' });
            try {
              const token = await AsyncStorage.getItem('token');
              const res = await axios.post(`${API_URL}/profile/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
              setProfileImage(res.data.image_url);
              await AsyncStorage.setItem('user_image', res.data.image_url);
            } catch (e) {
              setImageError('Failed to upload image.');
            } finally {
              setUploading(false);
            }
          }
        }}>
          {uploading ? (
            <ActivityIndicator size="small" color="#1976d2" style={styles.avatar} />
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} onError={() => setProfileImage(null)} />
          ) : (
            <Image source={require('../assets/default_avatar.png')} style={styles.avatar} />
          )}
        </TouchableOpacity>
        {imageError ? <Text style={{ color: 'red', marginBottom: 8 }}>{imageError}</Text> : null}
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