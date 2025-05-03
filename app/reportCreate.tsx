import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
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
      const formData = new FormData();
      formData.append('device_id', deviceId);
      formData.append('description', description);
      if (image) {
        formData.append('image', {
          uri: image.uri,
          name: image.fileName || 'photo.jpg',
          type: image.type ? image.type : (image.uri && image.uri.endsWith('.png') ? 'image/png' : 'image/jpeg'),
        });
      }
      await axios.post('http://192.168.1.100/api/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      Alert.alert('Success', 'Report submitted successfully');
      router.replace('/(tabs)/reports');
    } catch (err) {
      Alert.alert('Error', 'Failed to submit report');
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