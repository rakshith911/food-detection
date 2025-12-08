import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface TopFilterBarProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function TopFilterBar({ selectedFilter, onFilterChange }: TopFilterBarProps) {
  const filters = [
    { id: 'settings', icon: 'settings-outline', iconType: 'ionicons' as const },
    { id: 'heart', icon: 'heart-pulse', iconType: 'material' as const },
    { id: 'moon', icon: 'weather-night', iconType: 'material' as const },
    { id: 'running', icon: 'run', iconType: 'material' as const },
    { id: 'food', icon: 'food', iconType: 'material' as const },
  ];

  return (
    <View style={styles.container}>
      {filters.map((filter) => {
        const isSelected = selectedFilter === filter.id;
        const IconComponent = filter.iconType === 'ionicons' ? Ionicons : MaterialCommunityIcons;
        
        return (
          <TouchableOpacity
            key={filter.id}
            onPress={() => onFilterChange(filter.id)}
            style={styles.filterButton}
          >
            <IconComponent
              name={filter.icon as any}
              size={24}
              color="#FB923C"
            />
            {isSelected && <View style={styles.underline} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  filterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FB923C',
    borderRadius: 2,
  },
});

