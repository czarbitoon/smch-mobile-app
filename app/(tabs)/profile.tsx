import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Button } from 'react-native';

const Profile = () => {
  // Placeholder user data; replace with context/provider logic
  const user = { name: 'User', email: 'user@example.com' };
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const handleEditProfile = () => {
    setShowEditModal(true);
    setEditName(user.name);
    setEditEmail(user.email);
  };

  const handleProfileUpdate = async () => {
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      // Replace with actual token retrieval and API URL
      // const token = await AsyncStorage.getItem('token');
      // const response = await axios.post(
      //   `${API_URL}/profile/update`,
      //   { name: editName, email: editEmail },
      //   { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      // );
      setEditSuccess("Profile updated successfully!");
      setShowEditModal(false);
      // Optionally update user context/provider here
    } catch (err) {
      setEditError("Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={editEmail}
            onChangeText={setEditEmail}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button title="Cancel" color="#888" onPress={() => setShowEditModal(false)} />
            <Button title={editLoading ? "Saving..." : "Save"} onPress={handleProfileUpdate} disabled={editLoading} />
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