import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearHistory, loadHistory } from '../store/slices/historySlice';
import { logout } from '../store/slices/authSlice';
import type { AnalysisEntry } from '../store/slices/historySlice';
import OptimizedImage from '../components/OptimizedImage';

export default function HistoryScreen() {
  const dispatch = useAppDispatch();
  const history = useAppSelector((state) => state.history.history);
  const isLoading = useAppSelector((state) => state.history.isLoading);
  const error = useAppSelector((state) => state.history.error);
  const user = useAppSelector((state) => state.auth.user);

  const handleClearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all analysis history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive', 
          onPress: async () => {
            if (user?.email) {
              const result = await dispatch(clearHistory(user.email));
              if (clearHistory.fulfilled.match(result)) {
                Alert.alert('Success', 'All analysis history has been cleared.');
              } else {
                Alert.alert('Error', 'Failed to clear history. Please try again.');
              }
            }
          }
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
      ]
    );
  };

  const handleRefreshHistory = () => {
    if (user?.email) {
      dispatch(loadHistory(user.email));
    }
  };

  // Load history when component mounts or user changes
  useEffect(() => {
    if (user?.email) {
      dispatch(loadHistory(user.email));
    }
  }, [user?.email, dispatch]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderHistoryItem = (item: AnalysisEntry) => (
    <View key={item.id} style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={styles.historyInfo}>
          <Text style={styles.historyType}>
            {item.type === 'image' ? '📸' : '🎥'} {item.type.toUpperCase()} Analysis
          </Text>
          <Text style={styles.historyDate}>{formatDate(item.timestamp)}</Text>
        </View>
      </View>

      {(item.imageUri || item.videoUri) && (
        <View style={styles.mediaContainer}>
          {item.imageUri && (
            <OptimizedImage 
              source={{ uri: item.imageUri }} 
              style={styles.mediaPreview}
              cachePolicy="memory-disk"
              priority="normal"
              resizeMode="cover"
            />
          )}
          {item.videoUri && (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoText}>🎥 Video</Text>
            </View>
          )}
        </View>
      )}

      {item.textDescription && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>Description:</Text>
          <Text style={styles.descriptionText}>{item.textDescription}</Text>
        </View>
      )}

      <View style={styles.nutritionContainer}>
        <Text style={styles.nutritionTitle}>Nutritional Info:</Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.nutritionalInfo.calories}</Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.nutritionalInfo.protein}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.nutritionalInfo.carbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{item.nutritionalInfo.fat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>📊 Analysis History</Text>
          {user && (
            <Text style={styles.userEmail}>Logged in as: {user.email}</Text>
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📝 No analysis history yet</Text>
          <Text style={styles.emptySubtext}>
            Start analyzing food to see your history here
          </Text>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefreshHistory}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefreshHistory} />
          }
        >
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRefreshHistory}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {history.map(renderHistoryItem)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  historyDate: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  mediaContainer: {
    marginBottom: 16,
  },
  mediaPreview: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  videoPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  videoText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  descriptionText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    fontWeight: '500',
  },
  nutritionContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 70,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: -0.3,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptySubtext: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 20,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 60,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorBanner: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    flex: 1,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
