import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const OfficesScreen = () => {
  const router = useRouter();

  // Placeholder for office list; replace with API data
  const offices = [
    { id: 1, name: 'Main Office', location: 'Building A' },
    { id: 2, name: 'Branch Office', location: 'Building B' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Offices</Text>
      {offices.map(office => (
        <View key={office.id} style={styles.officeCard}>
          <Text style={styles.officeName}>{office.name}</Text>
          <Text style={styles.officeLocation}>{office.location}</Text>
        </View>
      ))}
      <Button title="Add Office" onPress={() => Alert.alert('Add Office', 'Feature coming soon!')} />
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
  officeCard: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  officeName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  officeLocation: {
    fontSize: 14,
    color: '#666',
  },
});

export default OfficesScreen;