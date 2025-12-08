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

interface PrivacyPolicyScreenProps {
  navigation?: any;
}

export default function PrivacyPolicyScreen({ navigation }: PrivacyPolicyScreenProps) {
  const sections = [
    {
      title: 'Introduction',
      content: 'We value your privacy and are committed to protecting the confidentiality and security of the information you provide while using the UKcal mobile application ("App"). This Privacy Policy explains how we collect, use, store, and protect your data as part of this research study. By using the UKcal App, you consent to the practices described below.',
    },
    {
      title: '1. Purpose of the App',
      content: 'The UKcal App is part of a research study evaluating artificial intelligence (AI)-based calorie estimation from food images or videos. The App is designed for small and medium food businesses (SMEs) to help test AI accuracy, user experience, and feasibility in real-world settings. It is not a commercial product and is used solely for research and data analysis purposes.',
    },
    {
      title: '2. Information We Collect',
      content: 'The UKcal App collects limited information necessary to enable its AI functionality and research objectives.\n' +
        'a. Information You Provide\n' +
        '• Dish Images or Videos: Photos or short clips of meals captured or uploaded by you.\n' +
        '• Optional Text Inputs: Dish names, menu descriptions, or recipes entered manually.\n' +
        '• Feedback Data: Star ratings, correction inputs, or written comments on AI results.\n' +
        '• Business Metadata (optional): Non-personal business identifiers such as cuisine type or serving style, if provided during registration.\n' +
        'b. Automatically Collected Information\n' +
        '• Device Information: Basic device type, operating system, and non-identifiable technical data.\n' +
        '• Usage Data: App usage logs, timestamps, and anonymized interaction patterns.\n' +
        'The App does not collect personally identifying information such as names, personal photos, financial details, or contact lists.',
    },
    {
      title: '3. How We Use the Information',
      content: 'The data you provide helps improve AI performance and supports research in food analysis, nutrition estimation, and technology usability. Specifically, your data may be used to:\n' +
        '• Train and validate AI models for calorie and nutrient estimation.\n' +
        '• Evaluate and enhance the accuracy of food recognition algorithms.\n' +
        '• Analyze user interactions and experience for research reporting.\n' +
        '• Generate anonymized research insights and statistical summaries.\n' +
        '• Improve the usability and reliability of our app.\n' +
        'All data analysis is performed in aggregate and anonymized form. No individual or business will be personally identified in any research outputs or publications.',
    },
    {
      title: '4. Data Sharing and Disclosure',
      content: 'We do not share your identifiable data with any third parties. Anonymized data may be shared only:\n' +
        '• With authorized research collaborators for technical analysis.\n' +
        '• When required by applicable law, regulation, or ethics review.\n' +
        '• To protect the integrity, rights, or safety of participants or the research team.\n' +
        'All collaborators are bound by confidentiality and data protection agreements.',
    },
    {
      title: '5. Data Security',
      content: 'We use secure servers, encrypted storage, and access controls to safeguard all uploaded content and feedback. While no system is completely secure, all reasonable administrative, technical, and physical measures are taken to minimize the risk of unauthorized access, disclosure, or loss.',
    },
    {
      title: '6. Data Retention',
      content: 'Your data will be retained only for the duration necessary to complete the research study and associated data analysis. Afterward, the data will either be securely deleted or permanently anonymized for use in aggregated research findings.',
    },
    {
      title: '7. Your Rights and Choices',
      content: 'You have control over your participation and data:\n' +
        '• Opt Out: You may stop using the App or withdraw from the study at any time.\n' +
        '• Access: You may review your uploaded dishes and feedback within the App.\n' +
        '• Delete Data: You may request the deletion of your data at any time by uninstalling the App or contacting the research team.\n' +
        '• Withdraw Consent: Withdrawal will not affect any data already anonymized for research use.',
    },
    {
      title: '8. Children\'s Privacy',
      content: 'This App is intended for adults (18 years and older) participating in the study. We do not knowingly collect or retain data from individuals under 18. If such data is identified, it will be deleted promptly.',
    },
    {
      title: '9. Updates to This Privacy Policy',
      content: 'We may update this Privacy Policy periodically to reflect changes in research protocols, data practices, or regulatory requirements. All updates will be posted within the App. Continued use after an update indicates your acceptance of the revised policy.',
    },
    {
      title: '10. Contact Information',
      content: 'If you have questions, concerns, or requests regarding this Privacy Policy or data handling practices, please contact the UKcal research team at: prabodh@nyu.edu',
    },
    {
      title: 'Conclusion',
      content: 'Your privacy and data security are central to this research. By using the UKcal App, you acknowledge that you have read and understood this Privacy Policy and voluntarily consent to the collection and use of anonymized data for research purposes only.',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <VectorBackButton onPress={() => navigation?.goBack()} />
        <Text style={styles.headerTitle}>Privacy Policy</Text>
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
