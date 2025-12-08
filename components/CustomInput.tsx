import React from "react";
import { TextInput } from "react-native-paper";
import { customTheme } from "../constants/themeConstants";

interface CustomInputProps {
  maxLength?: number;
  placeholder: string;
  isSecureTextEntry?: boolean;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  onChangeText: (text: string) => void;
  value: string | number;
  error?: boolean | string;
  isDisabled?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({
  maxLength,
  placeholder,
  isSecureTextEntry,
  keyboardType = "default",
  onChangeText,
  value,
  error,
  isDisabled,
}) => {
  return (
    <TextInput
      label={placeholder}
      keyboardType={keyboardType}
      secureTextEntry={isSecureTextEntry}
      onChangeText={onChangeText}
      value={value ? value.toString() : ""}
      editable={!isDisabled}
      maxLength={maxLength}
      mode="outlined"
      outlineColor={
        isDisabled
          ? customTheme.colors.darkSecondary
          : customTheme.colors.dark
      }
      placeholderTextColor={
        isDisabled
          ? customTheme.colors.darkSecondary
          : customTheme.colors.dark
      }
      contentStyle={{
        color: isDisabled
          ? customTheme.colors.darkSecondary
          : customTheme.colors.dark,
      }}
      style={{
        height: 55,
        backgroundColor: customTheme.colors.light,
        fontSize: 16,
        marginBottom: 4,
      }}
      theme={{
        colors: {
          primary: customTheme.colors.primary,
          error: "#E32A17",
        },
      }}
      error={!!error}
    />
  );
};

export default CustomInput;

