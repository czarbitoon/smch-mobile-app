import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const ReportsScreen = () => {
  const router = useRouter();

  // Placeholder for reports list; replace with API data
  const reports = [
    { id: 1, title: 'Report 1', status: 'Open' },
    { id: 2, title: 'Report 2', status: 'Resolved' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reports</Text>
      {reports.map(report => (
        <View key={report.id} style={styles.reportCard}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportStatus}>{report.status}</Text>
        </View>
      ))}
      <Button title="Add Report" onPress={() => Alert.alert('Add Report', 'Feature coming soon!')} />
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
  reportCard: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reportStatus: {
    fontSize: 14,
    color: '#666',
  },
});

export default ReportsScreen;