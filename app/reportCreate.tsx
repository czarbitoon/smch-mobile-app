import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'react-native-image-picker';
import axiosInstance from '../utils/axiosConfig';
import { Ionicons } from '@expo/vector-icons';
import useUserRole from './utils/useUserRole';
import { Snackbar } from 'react-native-paper';
import { StatusBadge } from '../components/StatusBadge';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useTicketManagement } from '../hooks/useTicketManagement';
import { API_URL } from '../utils/api';

export default function ReportCreate() {
  const router = useRouter();
  const userRole = useUserRole();
  const { deviceId, deviceName } = useLocalSearchParams();

  // State management
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success',
  });
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Use ticket management hook for sequential requests
  const { createTicket, loading: ticketLoading, error: ticketError } =
    useTicketManagement();

  // CRITICAL: Fetch token on mount (sequential initialization)
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        setIsLoading(true);
        const storedToken = await AsyncStorage.getItem('token');

        if (!storedToken) {
          setError('Authentication required. Please log in.');
          setSnackbar({
            visible: true,
            message: 'Session expired. Please log in again.',
            type: 'error',
          });
          // Redirect to login after a short delay
          setTimeout(() => router.replace('/auth/login'), 1500);
          return;
        }

        setToken(storedToken);

        // Validate device params
        if (!deviceId) {
          setError('Device information is missing.');
          setSnackbar({
            visible: true,
            message: 'Device ID is required',
            type: 'error',
          });
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeScreen();
  }, []);
  // Image picker handler
  const handlePickImage = async () => {
    try {
      ImagePicker.launchImageLibrary(
        { mediaType: 'photo', quality: 0.7 },
        (response) => {
          if (response.didCancel) return;
          if (response.errorCode) {
            Alert.alert(
              'Image Picker Error',
              response.errorMessage || 'Unknown error'
            );
            return;
          }
          if (response.assets && response.assets.length > 0) {
            setImage(response.assets[0]);
          }
        }
      );
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  // Sequential ticket submission handler
  const handleSubmit = async () => {
    // Validation
    if (!description.trim()) {
      setError('Description is required');
      setSnackbar({
        visible: true,
        message: 'Description is required',
        type: 'error',
      });
      return;
    }

    if (!deviceId) {
      setError('Device is required');
      setSnackbar({
        visible: true,
        message: 'Device is required',
        type: 'error',
      });
      return;
    }

    setUploading(true);
    setError('');

    try {
      let reportImagePath = null;

      // STEP 1: Upload image sequentially (if present)
      if (image) {
        try {
          const imgForm = new FormData();
          imgForm.append('image', {
            uri: image.uri,
            name: image.fileName || 'photo.jpg',
            type: image.type || 'image/jpeg',
          });
          imgForm.append('folder', 'report_images');

          const imgRes = await axiosInstance.post('/images/upload', imgForm, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'ngrok-skip-browser-warning': 'true',
            },
          });

          reportImagePath = imgRes.data?.path || imgRes.data?.data?.path;
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr);
          // Continue without image if upload fails
          setSnackbar({
            visible: true,
            message: 'Warning: Could not upload image, proceeding without it.',
            type: 'success',
          });
        }
      }

      // STEP 2: Create ticket sequentially after image upload
      const ticketPayload = {
        title: `Issue Report - ${deviceName || 'Device'}`,
        device_id: deviceId,
        description,
        status: 'pending',
      };

      if (reportImagePath) {
        ticketPayload.report_image = reportImagePath;
      }

      // Use the sequential hook for ticket creation
      await createTicket(ticketPayload);

      // Success feedback
      setSnackbar({
        visible: true,
        message: 'Ticket created successfully!',
        type: 'success',
      });

      // Reset form
      setDescription('');
      setImage(null);

      // Navigate back after brief delay
      setTimeout(() => {
        if (userRole === 'admin' || userRole === 'superadmin') {
          router.replace('/screens/adminDashboard');
        } else if (userRole === 'staff') {
          router.replace('/screens/staffDashboard');
        } else if (userRole === 'user') {
          router.replace('/screens/userDashboard');
        } else {
          router.replace('/(tabs)/index');
        }
      }, 1500);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Error submitting report';

      setError(errorMessage);
      setSnackbar({
        visible: true,
        message: errorMessage,
        type: 'error',
      });

      console.error('Ticket submission error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleEditDevice = () => {
    router.push({
      pathname: '/deviceEdit',
      params: { deviceId, deviceName },
    });
  };

  const handleGoBack = async () => {
    if (userRole === 'admin' || userRole === 'superadmin') {
      router.replace('/screens/adminDashboard');
    } else if (userRole === 'staff') {
      router.replace('/screens/staffDashboard');
    } else if (userRole === 'user') {
      router.replace('/screens/userDashboard');
    } else {
      router.replace('/(tabs)/index');
    }
  };

  // Loading state skeleton
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SkeletonLoader width={120} height={28} borderRadius={4} />
        </View>
        <SkeletonLoader width="100%" height={100} borderRadius={8} style={{ marginBottom: 16 }} />
        <SkeletonLoader width="100%" height={120} borderRadius={8} style={{ marginBottom: 16 }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          testID="back-btn"
        >
          <Ionicons name="arrow-back" size={28} color="#1976d2" />
        </TouchableOpacity>
        <Text style={styles.title}>Report Issue</Text>
      </View>

      {/* Device Info Card */}
      <View style={styles.deviceInfoCard}>
        <Text style={styles.deviceLabel}>Device</Text>
        <Text style={styles.deviceName}>{deviceName || 'Unknown Device'}</Text>
        <View style={styles.deviceIdContainer}>
          <Ionicons name="information-circle" size={16} color="#757575" />
          <Text style={styles.deviceId}>ID: {deviceId}</Text>
        </View>
      </View>

      {/* Error message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Description input */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe the issue you encountered..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          editable={!uploading}
          testID="description-input"
          placeholderTextColor="#999"
        />
        <Text style={styles.charCount}>
          {description.length} characters
        </Text>
      </View>

      {/* Image picker */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Attach Image (Optional)</Text>
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={handlePickImage}
          disabled={uploading}
          testID="pick-image-btn"
          activeOpacity={0.7}
        >
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: image.uri }}
                style={styles.imagePreview}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImage(null)}
              >
                <Ionicons name="close-circle" size={24} color="#d32f2f" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePickerContent}>
              <Ionicons name="image" size={32} color="#1976d2" />
              <Text style={styles.imagePickerText}>Tap to select image</Text>
              <Text style={styles.imagePickerSubtext}>JPG, PNG (Optional)</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Submit button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (uploading || ticketLoading) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={uploading || ticketLoading}
        activeOpacity={0.8}
        testID="submit-btn"
      >
        {uploading || ticketLoading ? (
          <View style={styles.submitButtonContent}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.submitButtonText}>Submitting...</Text>
          </View>
        ) : (
          <View style={styles.submitButtonContent}>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Submit Report</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Admin edit button */}
      {userRole === 'admin' && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleEditDevice}
          testID="edit-device-btn"
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={18} color="#1976d2" />
          <Text style={styles.secondaryButtonText}>Edit Device</Text>
        </TouchableOpacity>
      )}

      {/* Snackbar notification */}
      {snackbar.visible && (
        <View
          style={[
            styles.snackbar,
            snackbar.type === 'error'
              ? styles.snackbarError
              : styles.snackbarSuccess,
          ]}
        >
          <View style={styles.snackbarContent}>
            <Ionicons
              name={snackbar.type === 'error' ? 'close-circle' : 'checkmark-circle'}
              size={20}
              color="#fff"
            />
            <Text style={styles.snackbarText}>{snackbar.message}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setSnackbar({ ...snackbar, visible: false })}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    marginLeft: -8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    flex: 1,
  },
  deviceInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  deviceIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceId: {
    fontSize: 13,
    color: '#757575',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#212121',
    textAlignVertical: 'top',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  imagePicker: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imagePickerContent: {
    alignItems: 'center',
    gap: 8,
  },
  imagePickerText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePickerSubtext: {
    color: '#999',
    fontSize: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdbdbd',
    opacity: 0.7,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderColor: '#1976d2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#1976d2',
    fontWeight: '600',
    fontSize: 16,
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 8,
    zIndex: 1000,
  },
  snackbarError: {
    backgroundColor: '#d32f2f',
  },
  snackbarSuccess: {
    backgroundColor: '#388e3c',
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  snackbarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});