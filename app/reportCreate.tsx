import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function ReportCreate() {
  const router = useRouter();
  const { deviceId, deviceName } = useLocalSearchParams();
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [priority, setPriority] = useState('Low');

  useEffect(() => {
    AsyncStorage.getItem('user_role').then(role => {
      if (role) setUserRole(role);
    });
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };


  const handleSubmit = async () => {
    if (!description) {
      Alert.alert('Validation', 'Description is required');
      return;
    }
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Unauthorized', 'Session expired. Please login again.');
        setUploading(false);
        router.replace('/auth/login');
        return;
      }
      const formData = new FormData();
      formData.append('title', `Issue Report - ${deviceName || 'Device'}`);
      formData.append('device_id', deviceId);
      formData.append('description', description);
      formData.append('priority', priority);
      formData.append('status', 'pending');
      if (image) {
        formData.append('report_image', {
          uri: image.uri,
          name: image.fileName || 'photo.jpg',
          type: image.type ? image.type : (image.uri && image.uri.endsWith('.png') ? 'image/png' : 'image/jpeg'),
        });
      }
      const getApiUrl = () => {
        if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
        if (Platform.OS === 'android') return 'http://10.0.2.2/api';
        if (Platform.OS === 'ios') return 'http://127.0.0.1/api';
        if (Platform.OS === 'web') return 'http://localhost:8000/api';
        return 'http://192.168.1.100/api';
      };
      console.log('Submitting report:', { deviceId, description, image, priority, api: getApiUrl() });
      const response = await axios.post(`${getApiUrl()}/reports`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Report submit response:', response.data);
      Alert.alert('Success', 'Report submitted successfully');
      router.replace('/(tabs)/reports');
    } catch (err) {
      console.error('Report submit error:', err, err?.response?.data);
      Alert.alert('Error', 'Failed to submit report: ' + (err?.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleEditDevice = () => {
    router.push({ pathname: '/deviceEdit', params: { deviceId, deviceName } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Issue for {deviceName}</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe the issue..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        testID="description-input"
      />
      <View style={{ marginBottom: 16 }}>
        <Text style={{ marginBottom: 4 }}>Priority:</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {['Low','Medium','High','Critical'].map((level) => (
            <TouchableOpacity
              key={level}
              style={{
                backgroundColor: priority === level ? '#1976d2' : '#e3e3e3',
                padding: 8,
                borderRadius: 8,
                marginRight: 8
              }}
              onPress={() => setPriority(level)}
              testID={`priority-btn-${level}`}
            >
              <Text style={{ color: priority === level ? '#fff' : '#333' }}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage} testID="pick-image-btn">
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#1976d2',
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
    width: 100,
    height: 100,
    borderRadius: 8,
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
});