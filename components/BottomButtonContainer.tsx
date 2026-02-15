// import React, { ReactNode } from 'react';
// import { View, StyleSheet } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// interface BottomButtonContainerProps {
//   children: ReactNode;
//   paddingHorizontal?: number;
//   /** When true, use minimal bottom padding (e.g. when keyboard is visible) so the button sits just above the keyboard */
//   compactBottom?: boolean;
//   /** When set (e.g. to keyboard height), position the bar this many px from the bottom so it sits on top of the keyboard */
//   keyboardHeight?: number;
// }

// /**
//  * Container for buttons that should be fixed at the bottom
//  * and stay below the keyboard (doesn't move above keyboard)
//  */
// const BottomButtonContainer: React.FC<BottomButtonContainerProps> = ({
//   children,
//   paddingHorizontal = 32,
//   compactBottom = false,
//   keyboardHeight = 0,
// }) => {
//   const insets = useSafeAreaInsets();
//   // When keyboard is visible, use minimal padding so button sits just above keyboard
//   const bottomPadding = compactBottom ? 0 : Math.max(insets.bottom, 16);
//   const topPadding = compactBottom ? 0 : 16;
//   const bottomPosition = keyboardHeight > 0 ? keyboardHeight : 0;

//   return (
//     <View style={[styles.container, compactBottom && styles.containerCompact, bottomPosition > 0 && { bottom: bottomPosition }]}>
//       <View
//         style={[
//           styles.buttonContainer,
//           { paddingBottom: bottomPadding, paddingTop: topPadding, paddingHorizontal },
//         ]}
//       >
//         {children}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#FFFFFF',
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: -2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   containerCompact: {
//     borderTopWidth: 0,
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   buttonContainer: {
//     paddingTop: 16,
//   },
// });

// export default BottomButtonContainer;

import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

interface BottomButtonContainerProps {
  children: ReactNode;
  paddingHorizontal?: number;
}

const BottomButtonContainer: React.FC<BottomButtonContainerProps> = ({
  children,
  paddingHorizontal = 32,
}) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.buttonContainer,
          { paddingHorizontal },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 5,
  },
  buttonContainer: {
    paddingTop: 16,
    paddingBottom: 16, // 🔥 FIXED padding (no dynamic safe area)
  },
});

export default BottomButtonContainer;
