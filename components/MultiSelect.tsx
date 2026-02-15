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
  /** When false, hides the "Select all" option in the dialog. Useful for single-choice fields. */
  selectAllEnable?: boolean;
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
  selectAllEnable = true,
}) => {
  // Always use multiEnable=true for PaperSelect so the dialog stays open until "Done" is clicked.
  // With multiEnable=false (radio mode), the library auto-closes the dialog on selection.
  // For single-select, limit=1 prevents checking more than one option at a time.
  const isSingleSelect = !multiEnable;
  const paperMultiEnable = true;
  const limit = isSingleSelect ? 1 : undefined;

  // For single-select, ensure we only ever pass one item to the library (so when dialog opens, only one shows selected)
  const normalizedSelectedList = isSingleSelect
    ? (selectedArrayList.length > 0 ? [selectedArrayList[selectedArrayList.length - 1]] : [])
    : selectedArrayList;

  const handleSelection = (selectionValue: { text: string; selectedList: MultiSelectItem[] }) => {
    if (isSingleSelect) {
      const list = selectionValue.selectedList;
      const chosen = list.length > 0 ? list[0] : null;
      onSelection(
        chosen
          ? { text: chosen.value, selectedList: [chosen] }
          : { text: '', selectedList: [] }
      );
    } else {
      onSelection(selectionValue);
    }
  };

  return (
    <View style={styles.container}>
      <PaperSelect
        dialogCloseButtonText="Close"
        dialogDoneButtonText="Done"
        label={label}
        textInputMode="outlined"
        value={value}
        onSelection={handleSelection}
        arrayList={arrayList}
        selectedArrayList={normalizedSelectedList}
        multiEnable={paperMultiEnable}
        limit={limit}
        limitError="Uncheck the current selection first."
        selectAllEnable={isSingleSelect ? false : selectAllEnable}
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

