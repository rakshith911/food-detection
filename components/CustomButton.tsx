import React, { ReactNode } from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";

interface CustomButtonProps {
  btnLabel: string;
  btnLeftIcon?: ReactNode;
  btnRightIcon?: ReactNode;
  variant: "primary" | "light" | "disabled";
  onPress: () => void;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  btnLabel,
  btnLeftIcon,
  btnRightIcon,
  variant,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={variant === "disabled"}
      style={[
        styles.button,
        variant === "primary" && styles.primaryButton,
        variant === "light" && styles.lightButton,
        variant === "disabled" && styles.disabledButton,
      ]}
    >
      {/* Btn left icon */}
      {btnLeftIcon}

      {/* Button Label */}
      <Text
        style={[
          styles.buttonText,
          variant === "primary" && styles.primaryText,
          variant === "light" && styles.lightText,
          variant === "disabled" && styles.disabledText,
        ]}
      >
        {btnLabel}
      </Text>

      {/* Btn right icon */}
      {btnRightIcon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56, // Fixed height
    minWidth: '100%', // Fixed width to fill container
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#7BA21B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lightButton: {
    borderWidth: 2,
    borderColor: "#7BA21B",
    backgroundColor: "#ffffff",
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  primaryText: {
    color: "#ffffff",
  },
  lightText: {
    color: "#7BA21B",
  },
  disabledText: {
    color: "#ffffff",
  },
});

export default CustomButton;

