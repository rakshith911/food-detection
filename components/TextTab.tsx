import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ScrollView 
} from 'react-native';

export default function TextTab() {
  const [textInput, setTextInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const analyzeText = () => {
    if (textInput.trim()) {
      // Simulate analysis
      const result = `Analysis of: "${textInput}"\n\nDetected food items:\n• ${textInput.split(' ').slice(0, 3).join(', ')}\n\nNutritional information:\n• Calories: ~${textInput.length * 10}\n• Protein: ~${textInput.length * 2}g\n• Carbs: ~${textInput.length * 5}g\n• Fat: ~${textInput.length * 1}g`;
      setAnalysisResult(result);
      Alert.alert('Analysis Complete', 'Text analysis completed successfully!');
    } else {
      Alert.alert('Please enter text', 'Add some text to analyze the food.');
    }
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setTextInput('');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Input Section */}
        <View style={styles.inputContainer}>
          <Text style={styles.title}>Text-Based Food Analysis</Text>
          <Text style={styles.subtitle}>Describe the food you want to analyze</Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="Enter food description here...\n\nExample: Grilled chicken breast with steamed broccoli and brown rice"
            value={textInput}
            onChangeText={setTextInput}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          
          <TouchableOpacity 
            style={styles.analyzeButton}
            onPress={analyzeText}
          >
            <Text style={styles.buttonText}>🔍 Analyze Food Text</Text>
          </TouchableOpacity>
        </View>

        {/* Analysis Result Section */}
        {analysisResult && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Analysis Results</Text>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearAnalysis}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{analysisResult}</Text>
            </View>
          </View>
        )}

        {/* Quick Examples */}
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>Quick Examples:</Text>
          <TouchableOpacity 
            style={styles.exampleButton}
            onPress={() => setTextInput('Grilled salmon with quinoa and roasted vegetables')}
          >
            <Text style={styles.exampleText}>🐟 Grilled salmon with quinoa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.exampleButton}
            onPress={() => setTextInput('Caesar salad with grilled chicken and croutons')}
          >
            <Text style={styles.exampleText}>🥗 Caesar salad with chicken</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.exampleButton}
            onPress={() => setTextInput('Vegetarian pasta with marinara sauce and parmesan')}
          >
            <Text style={styles.exampleText}>🍝 Vegetarian pasta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  scrollContainer: {
    flex: 1,
  },
  inputContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    minHeight: 120,
  },
  analyzeButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultBox: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  examplesContainer: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
  },
  examplesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  exampleButton: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  exampleText: {
    fontSize: 16,
    color: '#1976D2',
  },
});










