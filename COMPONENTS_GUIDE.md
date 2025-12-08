# Custom Components Guide

This guide shows you how to use the custom components from mybeats-mobile in your food-detection app.

## Installation

First, install the new packages:

```bash
cd food-detection
npm install
```

## Available Components

### 1. CustomInput

A styled text input component using react-native-paper.

```tsx
import CustomInput from '../components/CustomInput';

// Usage example
<CustomInput
  placeholder="First Name"
  value={firstName}
  onChangeText={(text) => setFirstName(text)}
  keyboardType="default"
  maxLength={50}
/>

// For numeric input
<CustomInput
  placeholder="Weight (lb)"
  value={weight}
  onChangeText={(text) => setWeight(text)}
  keyboardType="numeric"
/>

// For password
<CustomInput
  placeholder="Password"
  value={password}
  onChangeText={(text) => setPassword(text)}
  isSecureTextEntry={true}
/>
```

### 2. CustomButton

A styled button component with variants.

```tsx
import CustomButton from '../components/CustomButton';

// Primary button
<CustomButton
  variant="primary"
  btnLabel="Save Profile"
  onPress={handleSave}
/>

// Light button (outlined)
<CustomButton
  variant="light"
  btnLabel="Cancel"
  onPress={handleCancel}
/>

// Disabled button
<CustomButton
  variant="disabled"
  btnLabel="Not Available"
  onPress={() => {}}
/>
```

### 3. DatePicker

A date picker component with modal.

```tsx
import DatePicker from '../components/DatePicker';

const [dob, setDob] = useState<string>();

<DatePicker
  onConfirm={(date) => setDob(date)}
  currVal={dob}
/>
```

### 4. MultiSelect

A dropdown/multi-select component.

```tsx
import MultiSelect from '../components/MultiSelect';

// Single select (Gender)
const [gender, setGender] = useState({
  value: "",
  list: [
    { _id: "1", value: "Male" },
    { _id: "2", value: "Female" },
    { _id: "3", value: "Other" },
  ],
  selectedList: [],
});

<MultiSelect
  label="Gender"
  value={gender.value}
  onSelection={(value) =>
    setGender({
      ...gender,
      value: value.text,
      selectedList: value.selectedList,
    })
  }
  arrayList={gender.list}
  selectedArrayList={gender.selectedList}
  multiEnable={false} // Single selection
/>

// Multi select (Dietary Restrictions)
const [dietaryRestrictions, setDietaryRestrictions] = useState({
  value: "",
  list: [
    { _id: "1", value: "None" },
    { _id: "2", value: "Vegetarian" },
    { _id: "3", value: "Vegan" },
    { _id: "4", value: "Gluten-Free" },
    { _id: "5", value: "Dairy-Free" },
  ],
  selectedList: [],
});

<MultiSelect
  label="Dietary Restrictions"
  value={dietaryRestrictions.value}
  onSelection={(value) =>
    setDietaryRestrictions({
      ...dietaryRestrictions,
      value: value.text,
      selectedList: value.selectedList,
    })
  }
  arrayList={dietaryRestrictions.list}
  selectedArrayList={dietaryRestrictions.selectedList}
  multiEnable={true} // Multiple selection
/>
```

## Complete Example: Business Profile Screen

Here's how to update your BusinessProfileStep1Screen:

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import DatePicker from '../components/DatePicker';
import MultiSelect from '../components/MultiSelect';

export default function BusinessProfileStep1Screen({ navigation }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState<string>();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  
  const [gender, setGender] = useState({
    value: "",
    list: [
      { _id: "1", value: "Male" },
      { _id: "2", value: "Female" },
      { _id: "3", value: "Other" },
    ],
    selectedList: [],
  });

  const handleNext = () => {
    // Validation
    if (!firstName || !lastName || !dob || !weight || !height || !gender.value) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Save data and navigate
    navigation.navigate('BusinessProfileStep2');
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          {/* Header */}
          <View style={{
            padding: 20,
            borderBottomWidth: 2,
            borderBottomColor: '#E5E7EB'
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
              Create Profile - Step 1
            </Text>
          </View>

          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
          >
            {/* First Name */}
            <View style={{ marginBottom: 16, width: '100%' }}>
              <CustomInput
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            {/* Last Name */}
            <View style={{ marginBottom: 16, width: '100%' }}>
              <CustomInput
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            {/* Date of Birth */}
            <View style={{ marginBottom: 16, alignItems: 'center' }}>
              <DatePicker
                onConfirm={(date) => setDob(date)}
                currVal={dob}
              />
            </View>

            {/* Gender */}
            <View style={{ marginBottom: 24, height: 50 }}>
              <MultiSelect
                label="Gender"
                value={gender.value}
                onSelection={(value) =>
                  setGender({
                    ...gender,
                    value: value.text,
                    selectedList: value.selectedList,
                  })
                }
                arrayList={gender.list}
                selectedArrayList={gender.selectedList}
                multiEnable={false}
              />
            </View>

            {/* Weight */}
            <View style={{ marginBottom: 16, width: '100%' }}>
              <CustomInput
                placeholder="Weight (lb)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>

            {/* Height */}
            <View style={{ marginBottom: 16, width: '100%' }}>
              <CustomInput
                placeholder="Height (inches)"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          {/* Next Button */}
          <View style={{ padding: 20 }}>
            <CustomButton
              variant="primary"
              btnLabel="Next"
              onPress={handleNext}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
```

## Theme Customization

You can customize colors in `constants/themeConstants.ts`:

```typescript
export const customTheme = {
  colors: {
    primary: "#7BA21B", // Your brand color
    light: "#ffffff",
    dark: "#4a4a4a",
    darkSecondary: "#d9d9d9"
  }
}
```

## Notes

- All components use **react-native-paper** for consistent styling
- **MultiSelect** supports both single and multiple selections
- **DatePicker** uses a modal datetime picker
- Components follow the same pattern as mybeats-mobile for consistency

