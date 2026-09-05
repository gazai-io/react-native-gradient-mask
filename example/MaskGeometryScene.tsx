import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { AnimatedGradientMaskView, GradientMaskView, type MaskLength } from 'react-native-gradient-mask';

/** Deterministic, offline visual oracle: white content over black, no network assets. */
export default function MaskGeometryScene() {
  const [step, setStep] = useState(0);
  const top = useSharedValue<MaskLength>('50%');
  const bottom = useSharedValue<MaskLength>(40);
  const enabled = useSharedValue(true);
  useEffect(() => {
    const timer = setInterval(() => setStep(value => (value + 1) % 4), 4000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    top.value = step === 2 ? 60 : '50%';
    bottom.value = step === 2 ? { value: .25, unit: 'ratio' } : 40;
    enabled.value = step !== 1;
  }, [step, top, bottom, enabled]);
  const height = step === 3 ? 120 : 200;
  return <View style={styles.root}>
    <Text style={styles.label}>GEOMETRY STEP {step} · container {height}</Text>
    <Text style={styles.label}>Static: top 50% / bottom 40px</Text>
    <GradientMaskView testID="static-geometry" style={{ width: 240, height }} topMaskHeight="50%" bottomMaskHeight="40px">
      <View style={styles.white} />
    </GradientMaskView>
    <Text style={styles.label}>Animated props: {step === 1 ? 'top disabled' : step === 2 ? 'top 60px / bottom 25%' : 'top 50% / bottom 40px'}</Text>
    <AnimatedGradientMaskView testID="animated-geometry" style={{ width: 240, height }}
      topMaskHeight={top} bottomMaskHeight={bottom} topMaskEnabled={enabled}>
      <View style={styles.white} />
    </AnimatedGradientMaskView>
    <Text style={styles.label}>Legacy: direction bottom, full-height fade</Text>
    <GradientMaskView testID="legacy-geometry" style={{ width: 240, height: 100 }} direction="bottom">
      <View style={styles.white} />
    </GradientMaskView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', alignItems: 'center', paddingTop: 8 },
  label: { color: '#fff', fontSize: 12, marginVertical: 10 },
  white: { flex: 1, backgroundColor: '#fff' },
});
