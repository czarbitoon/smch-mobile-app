import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = ({ onPress }) => {
  const { unreadCount } = useNotifications();
  return (
    <TouchableOpacity style={styles.bell} onPress={onPress} testID="notification-bell" accessibilityLabel="Open notifications" accessibilityRole="button" activeOpacity={0.7}>
      <Ionicons name="notifications-outline" size={32} color="#1976d2" />
      {unreadCount > 0 && (
        <View style={styles.badge} accessibilityLabel={`${unreadCount} unread notifications`}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const NotificationList = ({ visible, onClose }) => {
  const { notifications, markAllAsRead } = useNotifications();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.listContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Notifications</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close notifications" accessibilityRole="button">
              <Ionicons name="close" size={28} color="#1976d2" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.markReadBtn} onPress={markAllAsRead} accessibilityLabel="Mark all as read" accessibilityRole="button">
            <Text style={styles.markReadText}>Mark all as read</Text>
          </TouchableOpacity>
          <FlatList
            data={notifications.slice(0, 30)}
            keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
            renderItem={({ item }) => (
              <View style={[styles.item, !item.read_at && styles.unread]}>
                <Text style={styles.message}>{item.message || item.data?.message || 'Notification'}</Text>
                <Text style={styles.time}>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
            style={{ maxHeight: 400 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bell: {
    marginRight: 18,
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
  },
  badge: {
    position: 'absolute',
    right: 2,
    top: 2,
    backgroundColor: '#d32f2f',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    zIndex: 2,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  listContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    width: Platform.OS === 'web' ? 340 : '90%',
    maxWidth: 400,
    maxHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'android' ? 0.15 : 0.10,
    shadowRadius: 8,
    elevation: 8,
    ...Platform.select({
      android: { elevation: 8 },
      ios: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8 },
      default: { boxShadow: '0 2px 8px rgba(0,0,0,0.10)' },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
  },
  markReadBtn: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
  },
  markReadText: {
    color: '#1976d2',
    fontSize: 15,
    fontWeight: '600',
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderRadius: 10,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  unread: {
    backgroundColor: '#e3f2fd',
  },
  message: {
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
    fontSize: 16,
  },
});

export default NotificationBell;
