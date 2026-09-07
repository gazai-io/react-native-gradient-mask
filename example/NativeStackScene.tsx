/**
 * Native stack scene: the mask covers a screen that owns UIScreenEdgePanGestureRecognizer.
 *
 * Two questions this scene answers on a device:
 * 1. Does the mask block the iOS left-edge back gesture? Swipe from the left edge on every
 *    screen below, with the touch restriction both on and off.
 * 2. Does a recycled native view keep the previous screen's state? `Replace with gradient`
 *    unmounts a viewport mask and mounts a gradient mask in the same commit, which is when
 *    Fabric hands the same native view over. The gradient screen must stay fully visible and
 *    fully tappable; any dead or clipped band there is leaked boundary state.
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GradientMaskView, ViewportMaskView } from 'react-native-gradient-mask';

const Stack = createNativeStackNavigator();
const ROWS = 12;

/** Full-height tap targets. A row that never lights up is a rejected touch, not a layout gap. */
function TapGrid({ label }: { label: string }) {
  const [hits, setHits] = useState<Record<number, number>>({});
  const total = Object.values(hits).reduce((sum, count) => sum + count, 0);
  return (
    <View style={styles.grid}>
      <Text testID="grid-label" style={styles.gridLabel}>{label} · {total} taps</Text>
      {Array.from({ length: ROWS }, (_, row) => (
        <Pressable
          key={row}
          testID={`row-${row}`}
          style={[styles.row, hits[row] ? styles.rowHit : null]}
          onPress={() => setHits(current => ({ ...current, [row]: (current[row] ?? 0) + 1 }))}>
          <Text style={styles.rowText}>row {row}{hits[row] ? ` · ${hits[row]}` : ''}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Toggle({ label, value, onPress, testID }: { label: string; value: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={[styles.toggle, value ? styles.toggleOn : null]}>
      <Text style={styles.toggleText}>{label}：{value ? '開' : '關'}</Text>
    </Pressable>
  );
}

function HomeScreen() {
  const navigation = useNavigation<any>();
  return (
    <ScrollView contentContainerStyle={styles.home}>
      <Text style={styles.title}>Native stack · edge swipe and view recycling</Text>
      <Text style={styles.note}>
        Push a screen, then swipe from the left edge to go back. Repeat with the touch
        restriction on. Then use `Replace with gradient` to force a view recycle.
      </Text>
      <Pressable testID="push-viewport" style={styles.button} onPress={() => navigation.navigate('Viewport')}>
        <Text style={styles.buttonText}>Push viewport mask screen</Text>
      </Pressable>
      <Pressable testID="push-gradient" style={styles.button} onPress={() => navigation.navigate('Gradient')}>
        <Text style={styles.buttonText}>Push gradient mask screen</Text>
      </Pressable>
    </ScrollView>
  );
}

function ViewportScreen() {
  const navigation = useNavigation<any>();
  const [restricted, setRestricted] = useState(false);
  const [band, setBand] = useState<'full' | 'half' | 'empty'>('full');
  const bounds = band === 'full' ? { top: 0, bottom: '100%' as const }
    : band === 'half' ? { top: '25%' as const, bottom: '75%' as const }
    : { top: '50%' as const, bottom: '50%' as const };
  return (
    <View style={styles.screen}>
      <ViewportMaskView
        style={StyleSheet.absoluteFill}
        top={bounds.top}
        bottom={bounds.bottom}
        topFeather={32}
        bottomFeather={32}
        restrictTouchesToVisibleArea={restricted}>
        <ScrollView contentContainerStyle={styles.content}>
          <TapGrid label="viewport" />
        </ScrollView>
      </ViewportMaskView>
      <View style={styles.controls} pointerEvents="box-none">
        <Toggle testID="toggle-restrict" label="限制觸控" value={restricted} onPress={() => setRestricted(value => !value)} />
        <Pressable testID="toggle-band" style={styles.toggle} onPress={() => setBand(current => current === 'full' ? 'half' : current === 'half' ? 'empty' : 'full')}>
          <Text style={styles.toggleText}>可視區：{band}</Text>
        </Pressable>
        <Pressable testID="replace-gradient" style={styles.toggle} onPress={() => navigation.replace('Gradient')}>
          <Text style={styles.toggleText}>Replace with gradient</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * No boundary props at all. Before the wrappers sent the whole native prop surface, a view
 * recycled from ViewportScreen arrived here still carrying boundaryMode, the touch restriction
 * and the previous visible interval, so this screen silently clipped and rejected touches.
 */
function GradientScreen() {
  return (
    <View style={styles.screen}>
      <GradientMaskView style={StyleSheet.absoluteFill} topMaskHeight={80} bottomMaskHeight={80}>
        <ScrollView contentContainerStyle={styles.content}>
          <TapGrid label="gradient · every row must respond" />
        </ScrollView>
      </GradientMaskView>
    </View>
  );
}

export default function NativeStackScene() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTintColor: '#b5d1ff', headerStyle: { backgroundColor: '#101827' }, contentStyle: { backgroundColor: '#101827' } }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Edge swipe test' }} />
        <Stack.Screen name="Viewport" component={ViewportScreen} options={{ title: 'Viewport mask' }} />
        <Stack.Screen name="Gradient" component={GradientScreen} options={{ title: 'Gradient mask' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#101827' },
  home: { padding: 20, gap: 16 },
  content: { padding: 16, paddingTop: 24, paddingBottom: 120 },
  title: { color: '#e8eefc', fontSize: 18, fontWeight: '700' },
  note: { color: '#8fa6c8', lineHeight: 20 },
  button: { backgroundColor: '#1f3a63', padding: 16, borderRadius: 10 },
  buttonText: { color: '#e8eefc', fontWeight: '600', textAlign: 'center' },
  grid: { gap: 8 },
  gridLabel: { color: '#b5d1ff', fontWeight: '700', marginBottom: 4 },
  row: { backgroundColor: '#1c2942', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  rowHit: { backgroundColor: '#2f7d5b' },
  rowText: { color: '#e8eefc' },
  controls: { position: 'absolute', left: 12, right: 12, bottom: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toggle: { backgroundColor: '#24344f', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  toggleOn: { backgroundColor: '#3b6ea8' },
  toggleText: { color: '#e8eefc', fontWeight: '600' },
});
