import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../constants/ThemeContext';

const SettingsScreen = () => {
  const router = useRouter();
  const { darkMode, setDarkMode, colors } = useTheme();
  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [prefSuccess, setPrefSuccess] = useState('');

  React.useEffect(() => {
    const fetchUser = async () => {
      setProfileLoading(true);
      try {
        const name = await AsyncStorage.getItem('user_name');
        const email = await AsyncStorage.getItem('user_email');
        setName(name || '');
        setEmail(email || '');
        const dark = await AsyncStorage.getItem('dark_mode');
        setDarkMode(dark === 'true');
        const notif = await AsyncStorage.getItem('email_notifications');
        setEmailNotifications(notif !== 'false');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleProfileUpdate = async () => {
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/profile/update`, { name, email }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setProfileSuccess('Profile updated!');
      await AsyncStorage.setItem('user_name', name);
      await AsyncStorage.setItem('user_email', email);
    } catch (err) {
      setProfileError('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setPasswordLoading(false);
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/password/change`,
        {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setPasswordSuccess('Password changed!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePrefChange = async (key, value) => {
    if (key === 'darkMode') setDarkMode(value);
    if (key === 'emailNotifications') setEmailNotifications(value);
    await AsyncStorage.setItem(key === 'darkMode' ? 'dark_mode' : 'email_notifications', value.toString());
    setPrefSuccess('Preferences saved!');
    setTimeout(() => setPrefSuccess(''), 1500);
  };

  if (profileLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1976d2" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.primaryDark } ]}>Settings</Text>
      {/* Profile */}
      <Text style={[styles.section, { color: colors.textPrimary }]}>Profile Information</Text>
      {profileSuccess ? <Text style={styles.success}>{profileSuccess}</Text> : null}
      {profileError ? <Text style={styles.error}>{profileError}</Text> : null}
      <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]} placeholder="Name" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />
      <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]} placeholder="Email" placeholderTextColor={colors.textSecondary} value={email} onChangeText={setEmail} />
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primaryDark }]} onPress={handleProfileUpdate} disabled={profileLoading}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>
      {/* Password */}
      <Text style={[styles.section, { color: colors.textPrimary }]}>Change Password</Text>
      {passwordSuccess ? <Text style={styles.success}>{passwordSuccess}</Text> : null}
      {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
      <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]} placeholder="Current Password" placeholderTextColor={colors.textSecondary} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
      <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]} placeholder="New Password" placeholderTextColor={colors.textSecondary} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
      <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]} placeholder="Confirm New Password" placeholderTextColor={colors.textSecondary} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primaryDark }]} onPress={handlePasswordChange} disabled={passwordLoading}>
        <Text style={styles.buttonText}>Change Password</Text>
      </TouchableOpacity>
      {/* Preferences */}
      <Text style={[styles.section, { color: colors.textPrimary }]}>Preferences</Text>
      {prefSuccess ? <Text style={styles.success}>{prefSuccess}</Text> : null}
      <View style={styles.switchRow}>
        <Text style={{ color: colors.textPrimary }}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={v => handlePrefChange('darkMode', v)} />
      </View>
      <View style={styles.switchRow}>
        <Text style={{ color: colors.textPrimary }}>Email Notifications</Text>
        <Switch value={emailNotifications} onValueChange={v => handlePrefChange('emailNotifications', v)} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  section: { fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 8 },
  success: { color: 'green', marginBottom: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default SettingsScreen;
