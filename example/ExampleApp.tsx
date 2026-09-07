import TouchRangeScene from './TouchRangeScene';
import NativeStackScene from './NativeStackScene';
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
  // The native stack brings its own header and edge gesture, so it must not sit inside SafeAreaView.
  if (validation === 'native-stack' || tab === 'stack') {
    return <SafeAreaProvider>
      <NativeStackScene />
      {!validation && <Pressable style={styles.exitStack} onPress={() => setTab('chat')}><Text style={styles.tab}>← Scenes</Text></Pressable>}
    </SafeAreaProvider>;
  }
  return <SafeAreaProvider><SafeAreaView style={styles.root}>
    {!validation && <View style={styles.tabs}>
      <Pressable onPress={() => setTab('chat')}><Text style={styles.tab}>Chat viewport</Text></Pressable>
      <Pressable onPress={() => setTab('edges')}><Text style={styles.tab}>Independent edges</Text></Pressable>
      <Pressable onPress={() => setTab('legacy')}><Text style={styles.tab}>Original example</Text></Pressable>
      <Pressable onPress={() => setTab('stack')}><Text style={styles.tab}>Native stack</Text></Pressable>
    </View>}
    {validation === 'touch' ? <TouchRangeScene /> : validation === 'legacy-regression' ? <LegacyRegressionScene /> : validation === 'geometry' ? <MaskGeometryScene /> : validation === 'benchmark' ? <EdgeMaskExample benchmark /> :
      validation === 'chat-auto' ? <ViewportChatExample automatic /> : tab === 'legacy' ? <LegacyExample /> : tab === 'edges' ? <EdgeMaskExample /> : <ViewportChatExample />}
  </SafeAreaView></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101827' },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', padding: 12 },
  tab: { color: '#b5d1ff', fontWeight: '600' },
  exitStack: { position: 'absolute', left: 12, bottom: 32 },
});
