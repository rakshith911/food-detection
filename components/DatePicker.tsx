import React, { useState } from "react";
import { View, Keyboard } from "react-native";
import { TextInput } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import { customTheme } from "../constants/themeConstants";

interface DatePickerProps {
  currVal?: string;
  onConfirm: (date: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ currVal, onConfirm }) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => {
    Keyboard.dismiss();
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    hideDatePicker();
    const dateArray = date.toString().split(" ");
    onConfirm(dateArray[1] + " " + dateArray[2] + ", " + dateArray[3]);
  };

  return (
    <View>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        maximumDate={new Date(moment().format("YYYY-MM-DD"))}
      />
      <View>
        <TextInput
          label="Date Of Birth"
          value={currVal || ""}
          outlineColor={customTheme.colors.dark}
          onFocus={showDatePicker}
          mode="outlined"
          theme={{
            colors: { primary: customTheme.colors.primary, error: "#E32A17" },
          }}
          contentStyle={{
            color: customTheme.colors.dark,
          }}
          style={{
            height: 55,
            width: 325,
            backgroundColor: customTheme.colors.light,
          }}
          editable={false}
        />
      </View>
    </View>
  );
};

export default DatePicker;

