import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import {Picker} from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'react-native-image-picker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import useUserRole from './utils/useUserRole';
import { Snackbar } from 'react-native-paper';
import { API_URL } from "../utils/api";

export default function ReportCreate() {
  const router = useRouter();
  const userRole = useUserRole();
  const { deviceId, deviceName } = useLocalSearchParams();
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'success' });

  // const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2/api' : 'http://192.168.1.100/api');

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
    if (!description) {
      setError('Description is required');
      setSnackbar({ visible: true, message: 'Description is required', type: 'error' });
      return;
    }
    if (!deviceId) {
      setError('Device is required');
      setSnackbar({ visible: true, message: 'Device is required', type: 'error' });
      return;
    }
    setUploading(true);
    setError('');
    try {
      let reportImagePath = null;
      if (image) {
        const imgForm = new FormData();
        imgForm.append('image', {
          uri: image.uri,
          name: image.fileName || 'photo.jpg',
          type: image.type || 'image/jpeg',
        });
        imgForm.append('folder', 'report_images');
        const imgRes = await axios.post(`${API_URL}/images/upload`, imgForm, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
        reportImagePath = imgRes.data.path;
      }
      const formData = new FormData();
      formData.append('title', `Issue Report - ${deviceName || 'Device'}`);
      formData.append('device_id', deviceId);
      formData.append('description', description);
      formData.append('status', 'pending');
      if (reportImagePath) {
        formData.append('report_image', reportImagePath);
      }
      await axios.post(`${API_URL}/reports`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setSnackbar({ visible: true, message: 'Report submitted successfully!', type: 'success' });
      setDescription('');
      setImage(null);
      navigation.goBack();
    } catch (err) {
      const errorMessage = err?.response?.data?.error === 'User not authenticated'
        ? 'Please log in to submit a report'
        : err?.response?.data?.error || err?.response?.data?.message || 'Error submitting report';
      setError(errorMessage);
      setSnackbar({ visible: true, message: errorMessage, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleEditDevice = () => {
    router.push({ pathname: '/deviceEdit', params: { deviceId, deviceName } });
  };

  return (
    <View style={styles.container}>
      <View>
      <TouchableOpacity
        style={styles.backButton}
        onPress={async () => {
          if (userRole === 'admin' || userRole === 'superadmin') {
            router.replace('/screens/adminDashboard');
          } else if (userRole === 'staff') {
            router.replace('/screens/staffDashboard');
          } else if (userRole === 'user') {
            router.replace('/screens/userDashboard');
          } else {
            router.replace('/(tabs)/index');
          }
        }}
        testID="back-btn"
      >
        <Ionicons name="arrow-back" size={28} color="#1976d2" />
      </TouchableOpacity>
    </View>
      <Text style={styles.title}>Report Issue for {deviceName}</Text>
      {error ? <Text style={{color:'red',marginBottom:8}}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Describe the issue..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        testID="description-input"
      />
      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} testID="pick-image-btn">
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imagePickerText}>Pick Image</Text>
        )}
      </TouchableOpacity>
      <Button title={uploading ? 'Submitting...' : 'Submit Report'} onPress={handleSubmit} disabled={uploading} testID="submit-btn" />
      {userRole === 'admin' && (
        <TouchableOpacity style={styles.editBtn} onPress={handleEditDevice} testID="edit-device-btn">
          <Text style={styles.editBtnText}>Edit Device</Text>
        </TouchableOpacity>
      )}
      {snackbar.visible && (
        <View style={{
          position: 'absolute',
          bottom: 32,
          left: 16,
          right: 16,
          backgroundColor: snackbar.type === 'error' ? '#d32f2f' : '#388e3c',
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
          zIndex: 1000
        }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{snackbar.message}</Text>
          <TouchableOpacity onPress={() => setSnackbar({ ...snackbar, visible: false })} style={{ marginTop: 8 }}>
            <Text style={{ color: '#fff', textDecorationLine: 'underline' }}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
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
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 120,
    justifyContent: 'center',
  },
  imagePickerText: {
    color: '#1976d2',
    fontSize: 16,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  editBtn: {
    marginTop: 24,
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 8,
    textAlign: 'center',
  },
});