// smch-mobile-app/components/StatusBadge.tsx
// Enterprise status badge component with color-coded chips

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type StatusType = 'open' | 'in-progress' | 'resolved' | 'pending' | 'repair' | 'decommissioned';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const getStatusConfig = (status: StatusType) => {
  const configs: Record<StatusType, { backgroundColor: string; textColor: string; label: string }> = {
    open: { backgroundColor: '#2196F3', textColor: '#fff', label: 'Open' },
    'in-progress': { backgroundColor: '#FF9800', textColor: '#fff', label: 'In Progress' },
    resolved: { backgroundColor: '#4CAF50', textColor: '#fff', label: 'Resolved' },
    pending: { backgroundColor: '#FBC02D', textColor: '#000', label: 'Pending' },
    repair: { backgroundColor: '#1976D2', textColor: '#fff', label: 'Under Repair' },
    decommissioned: { backgroundColor: '#D32F2F', textColor: '#fff', label: 'Decommissioned' },
  };

  return configs[status] || configs.open;
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 };
    case 'large':
      return { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 };
    case 'medium':
    default:
      return { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 5 };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium', style }) => {
  const config = getStatusConfig(status);
  const sizeStyles = getSizeStyles(size);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          ...sizeStyles,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.textColor,
            fontSize: size === 'small' ? 12 : size === 'large' ? 16 : 14,
            fontWeight: size === 'small' ? '600' : '700',
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
