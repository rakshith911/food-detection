import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import VectorBackButton from '../components/VectorBackButton';
import CustomButton from '../components/CustomButton';

export default function WithdrawParticipationScreen() {
  const navigation = useNavigation<any>();

  const handleWithdraw = async () => {
    Alert.alert(
      'Withdraw Participation',
      'Are you sure you want to withdraw from the study? This action will log you out and you will no longer be able to participate.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () => {
            // Navigate to DeleteAccount screen for OTP verification
            navigation.navigate('DeleteAccount');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <VectorBackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Withdraw Participation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Withdraw from Study</Text>
          
          <Text style={styles.description}>
            If you choose to withdraw from this study, you will:
          </Text>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Be logged out of the application
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                No longer be able to participate in the study
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Have your withdrawal recorded with the date and time
              </Text>
            </View>
          </View>

          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              Please note: Withdrawing from the study is a permanent action. If you have any concerns or questions, please contact us before withdrawing.
            </Text>
          </View>

          <View style={styles.contactContainer}>
            <Text style={styles.contactLabel}>Contact Us:</Text>
            <Text style={styles.contactText}>Email: support@example.com</Text>
            <Text style={styles.contactText}>Phone: +44 123 456 7890</Text>
          </View>
        </View>
      </ScrollView>

      {/* Withdraw Button */}
      <View style={styles.buttonContainer}>
        <CustomButton
          variant="primary"
          btnLabel="To withdraw participation, please delete your account"
          onPress={handleWithdraw}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 20,
  },
  bulletList: {
    marginBottom: 24,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: '#7BA21B',
    marginRight: 12,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#92400E',
  },
  contactContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 4,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
});

