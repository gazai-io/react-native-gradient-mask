import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LegacyExample from './App';
import EdgeMaskExample from './EdgeMaskExample';
import MaskGeometryScene from './MaskGeometryScene';

const validation = process.env.EXPO_PUBLIC_MASK_VALIDATION;
export default function ExampleApp() {
  const [legacy, setLegacy] = useState(false);
  return <SafeAreaProvider><SafeAreaView style={styles.root}>
    {!validation && <View style={styles.tabs}>
      <Pressable onPress={() => setLegacy(false)}><Text style={styles.tab}>Independent edges</Text></Pressable>
      <Pressable onPress={() => setLegacy(true)}><Text style={styles.tab}>Original example</Text></Pressable>
    </View>}
    {validation === 'geometry' ? <MaskGeometryScene /> : legacy ? <LegacyExample /> :
      <EdgeMaskExample benchmark={validation === 'benchmark'} />}
  </SafeAreaView></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101827' },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', padding: 12 },
  tab: { color: '#b5d1ff', fontWeight: '600' },
});
