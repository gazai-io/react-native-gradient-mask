import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import Animated, { cancelAnimation, runOnJS, scrollTo, useAnimatedRef, useAnimatedStyle,
  useDerivedValue, useFrameCallback, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import type { AnimatedRef } from 'react-native-reanimated';
import { AnimatedViewportMaskView, AnimatedGradientMaskView, type MaskLength } from 'react-native-gradient-mask';

const ROWS = Array.from({ length: 200 }, (_, index) => ({ id: String(index), text:
  `Message ${index + 1} · Independent edge fades stay attached to the container while this FlashList scrolls.` }));
let contentRenders = 0;
const MessageList = memo(function MessageList({ scrollRef }: { scrollRef: AnimatedRef<ScrollView> }) {
  contentRenders++;
  const ref = useRef<FlashListRef<(typeof ROWS)[number]>>(null);
  const onLoad = useCallback(() => {
    const native = ref.current?.getNativeScrollRef();
    if (native) scrollRef(native as ScrollView);
  }, [scrollRef]);
  return <FlashList ref={ref} data={ROWS} onLoad={onLoad} keyExtractor={item => item.id}
    renderItem={({ item, index }) => <View style={[styles.row, index % 2 === 0 && styles.ownRow]}>
      <Text style={styles.rowText}>{item.text}</Text>
    </View>} />;
});

const PHASES = ['unmasked-scroll', 'viewport-static-scroll', 'animated-boundaries', 'switch-mask', 'overlap-feathers', 'js-block-500ms'];
type Report = { phase: string; frames: number; fps: number; p95Ms: number; maxMs: number; over25Ms: number; contentRenders: number };
function blockJS() { const end = performance.now() + 500; while (performance.now() < end) { /* controlled benchmark */ } }

export default function EdgeMaskExample({ benchmark = false }: { benchmark?: boolean }) {
  const scrollRef = useAnimatedRef<ScrollView>();
  const top = useSharedValue<MaskLength>('50%');
  const bottom = useSharedValue<MaskLength>(40);
  const topOn = useSharedValue(true);
  const bottomOn = useSharedValue(true);
  const intensity = useSharedValue(1);
  const progress = useSharedValue(0);
  const animate = useSharedValue(false);
  const containerHeight = useSharedValue(360);
  const [topEnabled, setTopEnabled] = useState(true);
  const [bottomEnabled, setBottomEnabled] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [preset, setPreset] = useState('Top 50% · Bottom 40px');
  const [reports, setReports] = useState<Report[]>([]);
  const topHeight = useDerivedValue<MaskLength>(() => animate.value
    ? { value: 0.15 + 0.5 * progress.value, unit: 'ratio' } : top.value);
  const bottomHeight = useDerivedValue<MaskLength>(() => animate.value ? 20 + 100 * progress.value : bottom.value);
  const visibleTop = useDerivedValue(() => animate.value ? 20 + 100 * progress.value : 60);
  const visibleBottom = useDerivedValue(() => animate.value ? 360 - 80 * progress.value : 320);
  const viewportEnabled = useDerivedValue(() => intensity.value > 0 && topOn.value);
  const boxStyle = useAnimatedStyle(() => ({ height: containerHeight.value }));
  const report = useCallback((value: Omit<Report, 'contentRenders'>) => {
    const complete = { ...value, contentRenders };
    console.log('MASK_BENCHMARK_RESULT ' + JSON.stringify(complete));
    setReports(previous => [...previous, complete]);
  }, []);
  const stats = useSharedValue({ phase: -1, frames: 0, total: 0, max: 0, over25: 0, hist: Array<number>(251).fill(0) });

  useFrameCallback(frame => {
    if (!benchmark) return;
    const elapsed = frame.timeSinceFirstFrame;
    if (elapsed < 3000) return; // warmup
    const phase = Math.min(PHASES.length, Math.floor((elapsed - 3000) / 5000));
    const s = stats.value;
    if (phase !== s.phase) {
      if (s.phase >= 0 && s.frames > 0) {
        let count = 0;
        let p95 = 0;
        for (let i = 0; i < s.hist.length; i++) { count += s.hist[i]; if (count >= s.frames * .95) { p95 = i + 1; break; } }
        runOnJS(report)({ phase: PHASES[s.phase], frames: s.frames,
          fps: Math.round(100000 * s.frames / s.total) / 100, p95Ms: p95,
          maxMs: Math.round(s.max * 100) / 100, over25Ms: s.over25 });
      }
      s.phase = phase; s.frames = 0; s.total = 0; s.max = 0; s.over25 = 0; s.hist.fill(0);
      if (phase === 5) runOnJS(blockJS)();
    } else if (phase < PHASES.length && frame.timeSincePreviousFrame !== null) {
      const dt = frame.timeSincePreviousFrame;
      s.frames++; s.total += dt; s.max = Math.max(s.max, dt);
      if (dt > 25) s.over25++;
      s.hist[Math.min(250, Math.floor(dt))]++;
    }
    if (phase === PHASES.length) { animate.value = false; topOn.value = true; bottomOn.value = true; intensity.value = 1; return; }
    progress.value = (Math.sin(elapsed / 400) + 1) / 2;
    animate.value = phase >= 2;
    intensity.value = phase === 0 ? 0 : phase === 2 ? .2 + .8 * progress.value : 1;
    topOn.value = phase !== 3 || Math.floor(elapsed / 100) % 2 === 0;
    bottomOn.value = phase !== 3 || Math.floor(elapsed / 100) % 3 !== 0;
    containerHeight.value = 360;
    top.value = phase === 4 ? 300 : 40; bottom.value = phase === 4 ? 300 : 40;
    scrollTo(scrollRef, 0, 80 + 80 * Math.sin(elapsed / 650), false);
  }, benchmark);

  useEffect(() => () => { cancelAnimation(progress); cancelAnimation(intensity); }, [progress, intensity]);
  const setPresetValues = (label: string, topValue: MaskLength, bottomValue: MaskLength) => {
    animate.value = false; cancelAnimation(progress); setAnimating(false);
    top.value = topValue; bottom.value = bottomValue; setPreset(label);
  };
  return <View style={styles.root}>
    <Text style={styles.title}>{benchmark ? 'Release frame benchmark' : 'Independent edge masks'}</Text>
    <Text style={styles.subtitle}>{benchmark ? '6 phases · 5 seconds each · 200 FlashList messages' : preset}</Text>
    {!benchmark && <>
      <View style={styles.controls}>
        <Button text="50% + 40px" onPress={() => setPresetValues('Top 50% · Bottom 40px', '50%', 40)} />
        <Button text="40px + 50%" onPress={() => setPresetValues('Top 40px · Bottom 50%', '40px', '50%')} />
        <Button text="Calculated" onPress={() => setPresetValues('Calculated: 360 × .3 / 64 − 24', 360 * .3, 64 - 24)} />
      </View>
      <View style={styles.controls}>
        <Button text={`Top ${topEnabled ? 'on' : 'off'}`} onPress={() => { topOn.value = !topEnabled; setTopEnabled(!topEnabled); }} />
        <Button text={`Bottom ${bottomEnabled ? 'on' : 'off'}`} onPress={() => { bottomOn.value = !bottomEnabled; setBottomEnabled(!bottomEnabled); }} />
        <Button text="Resize" onPress={() => { containerHeight.value = containerHeight.value === 360 ? 240 : 360; }} />
      </View>
      <View style={styles.controls}>
        <Button text={animating ? 'Stop height animation' : 'Animate heights'} onPress={() => {
          animate.value = !animating; setAnimating(!animating);
          if (!animating) progress.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
          else cancelAnimation(progress);
        }} />
        <Button text="Toggle mask" onPress={() => { intensity.value = withTiming(intensity.value > .5 ? 0 : 1, { duration: 400 }); }} />
      </View>
    </>}
    <Animated.View style={[styles.background, boxStyle]}>
      <View pointerEvents="none" style={styles.backgroundLabel}><Text style={styles.subtitle}>BACKGROUND · visible through transparent edges</Text></View>
      {benchmark ? <AnimatedViewportMaskView style={styles.mask} top={visibleTop} bottom={visibleBottom}
        topFeather={top} bottomFeather={bottom} enabled={viewportEnabled}>
        <MessageList scrollRef={scrollRef} />
      </AnimatedViewportMaskView> : <AnimatedGradientMaskView style={styles.mask} topMaskHeight={topHeight} bottomMaskHeight={bottomHeight}
        topMaskEnabled={topOn} bottomMaskEnabled={bottomOn} maskOpacity={intensity}>
        <MessageList scrollRef={scrollRef} />
      </AnimatedGradientMaskView>}
    </Animated.View>
    {benchmark ? <ScrollView style={styles.results}>
      {reports.map(value => <Text key={value.phase} style={styles.result} accessibilityLabel={'MASK_BENCHMARK_RESULT ' + JSON.stringify(value)}>
        {value.phase}: {value.fps} fps · p95 {value.p95Ms}ms · max {value.maxMs}ms · late {value.over25Ms} · renders {value.contentRenders}
      </Text>)}
      <Text style={styles.subtitle}>{reports.length === PHASES.length ? 'BENCHMARK COMPLETE' : 'Running… keep the app foregrounded'}</Text>
    </ScrollView> : <Text style={styles.note}>Numbers / px = logical pixels. Percentages follow this container when it resizes. Drag the list while animating.</Text>}
  </View>;
}
function Button({ text, onPress }: { text: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" style={styles.button} onPress={onPress}><Text style={styles.buttonText}>{text}</Text></Pressable>;
}
const styles = StyleSheet.create({
  root: { flex: 1, padding: 14, backgroundColor: '#101827' },
  title: { color: '#fff', fontSize: 21, fontWeight: '700' },
  subtitle: { color: '#bacbdf', fontSize: 12, marginVertical: 6 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 7 },
  button: { minHeight: 40, justifyContent: 'center', backgroundColor: '#263952', paddingHorizontal: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 12 },
  background: { backgroundColor: '#125e66', overflow: 'hidden', borderRadius: 12, marginTop: 8 },
  backgroundLabel: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  mask: { flex: 1 },
  row: { marginHorizontal: 12, marginVertical: 6, padding: 16, backgroundColor: '#e3eaf4', borderRadius: 12 },
  ownRow: { backgroundColor: '#a8caff', marginLeft: 50 },
  rowText: { color: '#142438', fontSize: 15, lineHeight: 23 },
  note: { color: '#bacbdf', fontSize: 12, lineHeight: 18, marginTop: 12 },
  results: { flex: 1, marginTop: 10 },
  result: { color: '#e6f1ff', fontSize: 10, lineHeight: 15, marginBottom: 5 },
});
