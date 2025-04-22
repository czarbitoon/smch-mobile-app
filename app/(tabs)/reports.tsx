import React from 'react';
import { View, Text, StyleSheet, Button, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';

const ReportsScreen = () => {
  const router = useRouter();
  // Placeholder for reports list; replace with API data
  const reports = [
    { id: 1, title: 'Report 1', status: 'Open' },
    { id: 2, title: 'Report 2', status: 'Resolved' },
  ];
  const renderReportItem = ({ item: report }) => (
    <View style={styles.reportCard}>
      <Text style={styles.reportTitle}>{report.title}</Text>
      <Text style={styles.reportStatus}>{report.status}</Text>
      <Button title="View Details" onPress={() => Alert.alert('Report Details', `Title: ${report.title}\nStatus: ${report.status}`)} />
    </View>
  );
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports</Text>
      <FlatList
        data={reports}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        renderItem={renderReportItem}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
      <Button title="Add Report" onPress={() => router.push('/(tabs)/reportCreate')} />
    </View>
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