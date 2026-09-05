import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { AnimatedViewportMaskView, ViewportMaskView, GradientMaskView, type MaskLength } from 'react-native-gradient-mask';

/** Deterministic, offline visual oracle: white content over black, no network assets. */
export default function MaskGeometryScene() {
  const [step, setStep] = useState(0);
  const top = useSharedValue(50);
  const bottom = useSharedValue(160);
  const enabled = useSharedValue(true);
  useEffect(() => {
    const timer = setInterval(() => setStep(value => (value + 1) % 5), 8000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    top.value = step === 1 ? 0 : step === 3 ? 170 : step === 4 ? -40 : 50;
    bottom.value = step === 3 ? 190 : step === 4 ? 250 : 160;
    enabled.value = true;
  }, [step, top, bottom, enabled]);
  const height = 200;
  return <View style={styles.root}>
    <Text style={styles.label}>GEOMETRY STEP {step} · container {height}</Text>
    <Text style={styles.label}>Static viewport: 50..160 / feathers 40,40</Text>
    <ViewportMaskView testID="static-geometry" style={{ width: 240, height, backgroundColor: 'white' }} top={50} bottom={160} topFeather={40} bottomFeather={40}>
      <View style={styles.white} />
    </ViewportMaskView>
    <Text style={styles.label}>Animated: step {step} / fade {step === 2 ? 0 : 40}</Text>
    <AnimatedViewportMaskView testID="animated-geometry" style={{ width: 240, height, backgroundColor: 'white' }}
      top={top} bottom={bottom} topFeather={step === 2 ? 0 : 40} bottomFeather={step === 2 ? 0 : 40} enabled={enabled}>
      <View style={styles.white} />
    </AnimatedViewportMaskView>
    <Text style={styles.label}>Legacy: direction bottom, full-height fade</Text>
    <GradientMaskView testID="legacy-geometry" style={{ width: 240, height: 100, backgroundColor: 'white' }} direction="bottom">
      <View style={styles.white} />
    </GradientMaskView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', alignItems: 'center', paddingTop: 8 },
  label: { color: '#fff', fontSize: 12, marginVertical: 10 },
  white: { flex: 1, backgroundColor: '#fff' },
});
