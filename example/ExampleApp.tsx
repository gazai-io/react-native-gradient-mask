import TouchRangeScene from './TouchRangeScene';
import LegacyRegressionScene from './LegacyRegressionScene';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ViewportChatExample from './ViewportChatExample';
import LegacyExample from './App';
import EdgeMaskExample from './EdgeMaskExample';
import MaskGeometryScene from './MaskGeometryScene';

const validation = process.env.EXPO_PUBLIC_MASK_VALIDATION;
export default function ExampleApp() {
  const [tab, setTab] = useState('chat');
  return <SafeAreaProvider><SafeAreaView style={styles.root}>
    {!validation && <View style={styles.tabs}>
      <Pressable onPress={() => setTab('chat')}><Text style={styles.tab}>Chat viewport</Text></Pressable>
      <Pressable onPress={() => setTab('edges')}><Text style={styles.tab}>Independent edges</Text></Pressable>
      <Pressable onPress={() => setTab('touch')}><Text style={styles.tab}>Touch test</Text></Pressable>
      <Pressable onPress={() => setTab('legacy')}><Text style={styles.tab}>Original example</Text></Pressable>
    </View>}
    {validation === 'touch' ? <TouchRangeScene /> : validation === 'legacy-regression' ? <LegacyRegressionScene /> : validation === 'geometry' ? <MaskGeometryScene /> : validation === 'benchmark' ? <EdgeMaskExample benchmark /> :
      tab === 'touch' ? <TouchRangeScene /> : validation === 'chat-auto' ? <ViewportChatExample automatic /> : tab === 'legacy' ? <LegacyExample /> : tab === 'edges' ? <EdgeMaskExample /> : <ViewportChatExample />}
  </SafeAreaView></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101827' },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8, padding: 12 },
  tab: { color: '#b5d1ff', fontWeight: '600' },
});
