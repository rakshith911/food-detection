# Setup Instructions - MyBeats Components Integration

## What Was Done ✅

I've integrated the same libraries and components used in **mybeats-mobile** into your **food-detection** app:

### 1. **Updated Dependencies** (package.json)
Added these packages:
- `react-native-paper` - Material Design components
- `react-native-paper-select` - Dropdown/Multi-select component
- `react-native-modal-datetime-picker` - Date picker modal
- `@react-native-community/datetimepicker` - Native date/time picker
- `moment` - Date manipulation library
- `nativewind` - Tailwind CSS for React Native
- `react-native-gesture-handler` - Gesture support
- `tailwindcss` - CSS framework

### 2. **Created Configuration Files**
- `babel.config.js` - Babel configuration with NativeWind support
- `tailwind.config.js` - Tailwind CSS configuration
- Updated `metro.config.js` - Added CSS support

### 3. **Created Constants**
- `constants/themeConstants.ts` - Theme colors matching your app style

### 4. **Created Custom Components**
All components use the same API as mybeats-mobile:

- **CustomInput.tsx** - Styled text input using react-native-paper
- **CustomButton.tsx** - Styled button with primary/light/disabled variants
- **MultiSelect.tsx** - Dropdown with single/multi-selection support
- **DatePicker.tsx** - Date picker with modal

### 5. **Created Documentation**
- `COMPONENTS_GUIDE.md` - Complete usage guide with examples

---

## What You Need to Do 🚀

### Step 1: Install Packages

Open PowerShell in the food-detection folder and run:

```powershell
cd food-detection
npm install
```

This will install all the new packages.

### Step 2: Clear Cache and Restart

After installation, clear the cache and restart:

```powershell
npx expo start -c
```

Or if that doesn't work:

```powershell
npm start -- --clear
```

### Step 3: Test on Your Mobile

Once the server starts:
1. Use URL: `exp://192.168.1.170:8081` (or whatever port it shows)
2. Open Expo Go on your phone
3. Enter the URL manually
4. The app should now use the new components!

---

## Using the Components

### Example: Update BusinessProfileStep1Screen

Here's a quick example of how to use the components:

```tsx
import React, { useState } from 'react';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import DatePicker from '../components/DatePicker';
import MultiSelect from '../components/MultiSelect';

export default function BusinessProfileStep1Screen() {
  const [firstName, setFirstName] = useState('');
  const [dob, setDob] = useState<string>();
  
  const [gender, setGender] = useState({
    value: "",
    list: [
      { _id: "1", value: "Male" },
      { _id: "2", value: "Female" },
      { _id: "3", value: "Other" },
    ],
    selectedList: [],
  });

  return (
    <View>
      {/* Text Input */}
      <CustomInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />

      {/* Date Picker */}
      <DatePicker
        onConfirm={(date) => setDob(date)}
        currVal={dob}
      />

      {/* Dropdown */}
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

      {/* Button */}
      <CustomButton
        variant="primary"
        btnLabel="Next"
        onPress={() => console.log('Next clicked')}
      />
    </View>
  );
}
```

For complete examples and all component props, see **COMPONENTS_GUIDE.md**.

---

## Troubleshooting

### If npm install fails:
```powershell
# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### If app crashes after installation:
```powershell
# Clear all caches
npx expo start -c
# Or
npm start -- --reset-cache
```

### If components don't show correctly:
- Make sure you've restarted the Expo server after npm install
- Check that babel.config.js exists and has nativewind/babel plugin
- Verify all imports are correct

---

## Next Steps

1. ✅ Install packages
2. ✅ Test the components with a simple example
3. ✅ Update BusinessProfileStep1Screen to use new components
4. ✅ Update BusinessProfileStep2Screen to use new components
5. ✅ Test the complete profile flow

All components are now ready to use! They follow the exact same patterns as mybeats-mobile for consistency. 🎉

