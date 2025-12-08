import { NavigationProp } from '@react-navigation/native';

/**
 * Safely navigate back, or to a fallback screen if there's no previous screen
 */
export const safeGoBack = (
  navigation: NavigationProp<any>,
  fallbackScreen?: string
) => {
  const state = navigation.getState();
  
  // Check if we can go back (more than one screen in the stack)
  if (state && state.routes && state.routes.length > 1) {
    navigation.goBack();
  } else if (fallbackScreen) {
    // Navigate to fallback screen if provided
    navigation.navigate(fallbackScreen as never);
  } else {
    // Try to navigate to a default screen
    // Check if Consent screen exists in the stack
    const hasConsent = state?.routes?.some((route: any) => route.name === 'Consent');
    if (hasConsent) {
      navigation.navigate('Consent' as never);
    } else {
      // Last resort: try to navigate to Tutorial or Results
      const hasTutorial = state?.routes?.some((route: any) => route.name === 'Tutorial');
      if (hasTutorial) {
        navigation.navigate('Tutorial' as never);
      } else {
        // If nothing works, just log and don't navigate
        console.warn('[Navigation] Cannot go back and no fallback screen available');
      }
    }
  }
};

