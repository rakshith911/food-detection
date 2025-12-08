import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
} from 'react-native';
import VectorBackButton from '../components/VectorBackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export default function ViewConsentScreen({ navigation }: { navigation: any }) {
  const [consentDate, setConsentDate] = useState<string | null>(null);

  useEffect(() => {
    const loadConsentDate = async () => {
      try {
        const date = await AsyncStorage.getItem('consent_date');
        setConsentDate(date);
      } catch (error) {
        console.error('[ViewConsent] Error loading consent date:', error);
      }
    };
    loadConsentDate();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <VectorBackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>View Consent</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Consent Date */}
        {consentDate && (
          <View style={styles.consentDateContainer}>
            <Text style={styles.consentDateLabel}>Consent Date:</Text>
            <Text style={styles.consentDateValue}>{formatDate(consentDate)}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By downloading, accessing, or using the UKcal mobile application ("App"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms"). If you do not agree with these Terms, you must not use the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Purpose and Research Context</Text>
          <Text style={styles.sectionText}>
            The UKcal App is developed as part of a research study to evaluate artificial intelligence (AI) models for estimating calorie content from images or videos of meals. The App is not a commercial product and is provided solely for research and evaluation purposes. By participating, you agree to allow anonymized data from your interactions to be used for academic research and improvement of AI performance.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Changes to Terms</Text>
          <Text style={styles.sectionText}>
            We reserve the right to update or modify these Terms at any time. Any changes will be effective upon posting within the App. Continued use of the App after such changes constitutes your acceptance of the revised Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Eligibility</Text>
          <Text style={styles.sectionText}>
            You must be at least 18 years old to use this App. By using the App, you represent that you are of legal age and eligible to participate in this research study.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Collection and Use</Text>
          <Text style={styles.sectionText}>
            The UKcal App collects images or short videos of food dishes, along with optional text descriptions (e.g., dish name, ingredients, or menu items). By using the App, you consent to:{'\n'}
            • The collection and storage of these images and associated metadata.{'\n'}
            • The use of anonymized data for research, statistical analysis, and AI model improvement.{'\n'}
            • The storage of feedback data (e.g., ratings or corrections) to refine AI performance.{'\n'}
            The data collected will not include any personal identifiers and will be used only for research purposes related to calorie estimation and AI development.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Privacy and Data Security</Text>
          <Text style={styles.sectionText}>
            We employ appropriate administrative, technical, and physical safeguards to protect collected data against unauthorized access, loss, or misuse. However, no system is completely secure, and you acknowledge that participation involves minimal inherent digital risk. Data will be anonymized before analysis, and identifying information (such as names or contact details) will never be publicly disclosed.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Research Nature and Disclaimer</Text>
          <Text style={styles.sectionText}>
            The App provides AI-generated calorie and nutrient estimates for informational and research purposes only. These estimates:{'\n'}
            • Are not intended for medical, dietary, or regulatory use.{'\n'}
            • May not always be accurate or precise.{'\n'}
            • Should not replace professional nutritional or medical advice.{'\n'}
            Participants use the App voluntarily and at their own discretion.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
          <Text style={styles.sectionText}>
            All content, materials, algorithms, and software used in the App—including AI models, graphics, and design elements—remain the intellectual property of the research team.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Acceptable Use</Text>
          <Text style={styles.sectionText}>
            You agree not to:{'\n'}
            • Upload images containing people's faces, personal documents, or sensitive information.{'\n'}
            • Use the App for any commercial or unlawful purpose.{'\n'}
            • Attempt to reverse engineer, copy, or modify any part of the App.{'\n'}
            • Interfere with the App's operation or security features.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Termination</Text>
          <Text style={styles.sectionText}>
            Your access to the App may be suspended or terminated at any time for research, ethical, or technical reasons. You may withdraw from the study at any time by uninstalling the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. No Warranties</Text>
          <Text style={styles.sectionText}>
            The App is provided "as is" for research purposes. No express or implied warranties are made regarding the accuracy, reliability, or suitability of the AI-generated information. We disclaim all liability for any direct or indirect consequences resulting from use of the App or its outputs.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            To the maximum extent permitted by law, the research team shall not be liable for any direct, indirect, incidental, or consequential damages arising from your participation or use of the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Indemnification</Text>
          <Text style={styles.sectionText}>
            By using the App, you agree to indemnify and hold harmless the research team and affiliated entities from any claims, damages, or liabilities arising from your participation or misuse of the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Governing Law</Text>
          <Text style={styles.sectionText}>
            These Terms are governed by and construed in accordance with applicable laws of the jurisdiction where the research is conducted.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Entire Agreement</Text>
          <Text style={styles.sectionText}>
            These Terms, together with the UKcal Research Consent Form and Privacy Statement, constitute the entire agreement governing your use of the App and participation in the study.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>16. Electronic Consent</Text>
          <Text style={styles.sectionText}>
            Your use of the App and digital acceptance of these Terms constitute your consent and agreement to participate under these conditions.
          </Text>
        </View>

        {/* Extra padding at bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  consentDateContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#7BA21B',
  },
  consentDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  consentDateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333333',
    textAlign: 'justify',
  },
});

