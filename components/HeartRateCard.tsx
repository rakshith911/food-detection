import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function HeartRateCard() {
  return (
    <View style={styles.container}>
      <View style={styles.borderTop} />
      <View style={styles.borderLeft} />
      
      <Text style={styles.title}>Heart Rate</Text>
      
      <View style={styles.separator} />
      
      <View style={styles.metricsContainer}>
        <View style={styles.metric}>
          <Text style={styles.dash}>-</Text>
          <Text style={styles.metricLabel}>Resting</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.metric}>
          <Text style={styles.dash}>-</Text>
          <Text style={styles.metricLabel}>Average</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.metric}>
          <Text style={styles.dash}>-</Text>
          <Text style={styles.metricLabel}>High</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FB923C',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  borderLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#FB923C',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  dash: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
});

