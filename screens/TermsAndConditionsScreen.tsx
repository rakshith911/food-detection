import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import VectorBackButton from '../components/VectorBackButton';

interface TermsAndConditionsScreenProps {
  navigation?: any;
}

export default function TermsAndConditionsScreen({ navigation }: TermsAndConditionsScreenProps) {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By downloading, accessing, or using the UKcal mobile application ("App"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms"). If you do not agree with these Terms, you must not use the App.',
    },
    {
      title: '2. Purpose and Research Context',
      content: 'The UKcal App is developed as part of a research study to evaluate artificial intelligence (AI) models for estimating calorie content from images or videos of meals. The App is not a commercial product and is provided solely for research and evaluation purposes. By participating, you agree to allow anonymized data from your interactions to be used for academic research and improvement of AI performance.',
    },
    {
      title: '3. Changes to Terms',
      content: 'We reserve the right to update or modify these Terms at any time. Any changes will be effective upon posting within the App. Continued use of the App after such changes constitutes your acceptance of the revised Terms.',
    },
    {
      title: '4. User Eligibility',
      content: 'You must be at least 18 years old to use this App. By using the App, you represent that you are of legal age and eligible to participate in this research study.',
    },
    {
      title: '5. Data Collection and Use',
      content: 'The UKcal App collects images or short videos of food dishes, along with optional text descriptions (e.g., dish name, ingredients, or menu items). By using the App, you consent to:\n• The collection and storage of these images and associated metadata.\n• The use of anonymized data for research, statistical analysis, and AI model improvement.\n• The storage of feedback data (e.g., ratings or corrections) to refine AI performance.\nThe data collected will not include any personal identifiers and will be used only for research purposes related to calorie estimation and AI development.',
    },
    {
      title: '6. Privacy and Data Security',
      content: 'We employ appropriate administrative, technical, and physical safeguards to protect collected data against unauthorized access, loss, or misuse. However, no system is completely secure, and you acknowledge that participation involves minimal inherent digital risk. Data will be anonymized before analysis, and identifying information (such as names or contact details) will never be publicly disclosed.',
    },
    {
      title: '7. Research Nature and Disclaimer',
      content: 'The App provides AI-generated calorie and nutrient estimates for informational and research purposes only. These estimates:\n• Are not intended for medical, dietary, or regulatory use.\n• May not always be accurate or precise.\n• Should not replace professional nutritional or medical advice.\nParticipants use the App voluntarily and at their own discretion.',
    },
    {
      title: '8. Intellectual Property',
      content: 'All content, materials, algorithms, and software used in the App—including AI models, graphics, and design elements—remain the intellectual property of the research team.',
    },
    {
      title: '9. Acceptable Use',
      content: 'You agree not to:\n• Upload images containing people\'s faces, personal documents, or sensitive information.\n• Use the App for any commercial or unlawful purpose.\n• Attempt to reverse engineer, copy, or modify any part of the App.\n• Interfere with the App\'s operation or security features.',
    },
    {
      title: '10. Termination',
      content: 'Your access to the App may be suspended or terminated at any time for research, ethical, or technical reasons. You may withdraw from the study at any time by uninstalling the App.',
    },
    {
      title: '11. No Warranties',
      content: 'The App is provided "as is" for research purposes. No express or implied warranties are made regarding the accuracy, reliability, or suitability of the AI-generated information. We disclaim all liability for any direct or indirect consequences resulting from use of the App or its outputs.',
    },
    {
      title: '12. Limitation of Liability',
      content: 'To the maximum extent permitted by law, the research team shall not be liable for any direct, indirect, incidental, or consequential damages arising from your participation or use of the App.',
    },
    {
      title: '13. Indemnification',
      content: 'By using the App, you agree to indemnify and hold harmless the research team and affiliated entities from any claims, damages, or liabilities arising from your participation or misuse of the App.',
    },
    {
      title: '14. Governing Law',
      content: 'These Terms are governed by and construed in accordance with applicable laws of the jurisdiction where the research is conducted.',
    },
    {
      title: '15. Entire Agreement',
      content: 'These Terms, together with the UKcal Research Consent Form and Privacy Statement, constitute the entire agreement governing your use of the App and participation in the study.',
    },
    {
      title: '16. Electronic Consent',
      content: 'Your use of the App and digital acceptance of these Terms constitute your consent and agreement to participate under these conditions.',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <VectorBackButton onPress={() => navigation?.goBack()} />
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ScrollView with content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.effectiveDate}>
            Effective Date: November 2, 2025
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionText}>{section.content}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'web' ? 0 : 40,
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
    zIndex: 10,
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  effectiveDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
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
