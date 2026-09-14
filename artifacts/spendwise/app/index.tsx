import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import HomeScreen from './(tabs)/index';

export default function RootIndex() {
  return Platform.OS === 'web' ? <HomeScreen /> : <Redirect href="/(tabs)" />;
}