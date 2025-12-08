import React from "react";
import { View, StyleSheet } from "react-native";
import { PaperSelect } from "react-native-paper-select";
import { customTheme } from "../constants/themeConstants";

interface MultiSelectItem {
  _id: string;
  value: string;
}

interface MultiSelectProps {
  label: string;
  value: string;
  onSelection: (value: { text: string; selectedList: MultiSelectItem[] }) => void;
  arrayList: MultiSelectItem[];
  selectedArrayList: MultiSelectItem[];
  multiEnable: boolean;
  toHideSearchBox?: boolean;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
});

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  value,
  onSelection,
  arrayList,
  selectedArrayList,
  multiEnable,
  toHideSearchBox,
}) => {
  // For single-select mode, we use multiEnable=true to keep dialog open
  // but handle selection to only allow one item
  const handleSelection = (selectionValue: { text: string; selectedList: MultiSelectItem[] }) => {
    if (!multiEnable) {
      // Single-select mode: only keep the last selected item
      const lastSelected = selectionValue.selectedList[selectionValue.selectedList.length - 1];
      if (lastSelected) {
        onSelection({
          text: lastSelected.value,
          selectedList: [lastSelected],
        });
      } else {
        // If nothing selected, clear selection
        onSelection({
          text: '',
          selectedList: [],
        });
      }
    } else {
      // Multi-select mode: pass through as-is
      onSelection(selectionValue);
    }
  };

  return (
    <View style={styles.container}>
      <PaperSelect
        dialogCloseButtonText="Close"
        label={label}
        textInputMode="outlined"
        value={value}
        onSelection={handleSelection}
        arrayList={arrayList}
        selectedArrayList={selectedArrayList}
        multiEnable={true}
        hideSearchBox={toHideSearchBox}
        textInputStyle={{
          height: 52,
          backgroundColor: '#FFFFFF',
          borderWidth: 0,
        }}
        textInputProps={{
          outlineColor: customTheme.colors.dark,
          mode: 'outlined',
          dense: false,
          style: {
            backgroundColor: '#FFFFFF',
            borderColor: customTheme.colors.dark,
          },
          contentStyle: {
            backgroundColor: '#FFFFFF',
            color: customTheme.colors.dark,
          },
          underlineColor: 'transparent',
          activeUnderlineColor: 'transparent',
          selectionColor: customTheme.colors.primary,
          theme: {
            colors: {
              primary: customTheme.colors.primary,
              background: '#FFFFFF',
              surface: '#FFFFFF',
              text: customTheme.colors.dark,
              placeholder: customTheme.colors.dark,
            },
            dark: false,
          },
        }}
        dialogTitleStyle={{
          color: customTheme.colors.dark,
          backgroundColor: '#FFFFFF',
        }}
        dialogStyle={{
          backgroundColor: '#FFFFFF',
        }}
        searchBarStyle={{
          backgroundColor: '#FFFFFF',
        }}
        listItemStyle={{
          backgroundColor: '#FFFFFF',
        }}
        listItemLabelStyle={{
          color: customTheme.colors.dark,
          backgroundColor: '#FFFFFF',
        }}
        errorStyle={{
          backgroundColor: '#FFFFFF',
        }}
        containerStyle={{
          backgroundColor: '#FFFFFF',
        }}
        checkboxProps={{
          checkboxColor: customTheme.colors.primary,
        }}
        theme={{
          colors: { 
            primary: customTheme.colors.primary,
            background: '#FFFFFF',
            surface: '#FFFFFF',
            onSurface: customTheme.colors.dark,
            text: customTheme.colors.dark,
            placeholder: customTheme.colors.dark,
            backdrop: 'rgba(0, 0, 0, 0.5)',
          },
          dark: false,
        }}
      />
    </View>
  );
};

export default MultiSelect;

