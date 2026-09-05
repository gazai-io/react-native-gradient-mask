import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { useAnimatedProps, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { AnimatedViewportMaskView, type MaskLength } from 'react-native-gradient-mask';
const AnimatedInput = Animated.createAnimatedComponent(TextInput);
type Message = { id: string; text: string };
const initial = Array.from({length: 200}, (_, i) => ({id: `seed-${i}`, text: `Message ${i} — Fixed offline chat content. Scroll while changing the visible window.`}));
const metrics = { mounts: 0, unmounts: 0, listLayouts: 0, renders: 0 };
const ChatList = memo(function ChatList({data, offset}: {data: Message[]; offset: {value: number}}) {
  metrics.renders++;
  useEffect(() => { metrics.mounts++; return () => { metrics.unmounts++; }; }, []);
  return <FlashList data={data} keyExtractor={item => item.id} maintainVisibleContentPosition={{disabled: true}}
    onLayout={() => { metrics.listLayouts++; }} onScroll={event => { offset.value = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={100}
    renderItem={({item}) => <View style={styles.row}><Text>{item.id}</Text><Text>{item.text}</Text></View>} />;
});
export default function ViewportChatExample({automatic = false}: {automatic?: boolean}) {
  const [data, setData] = useState(initial);
  const [streaming, setStreaming] = useState(false);
  const [diagnostics, setDiagnostics] = useState('');
  const sequence = useRef(0);
  const height = useSharedValue(0);
  const width = useSharedValue(0);
  const top = useSharedValue(0);
  const panel = useSharedValue(0);
  const bottom = useDerivedValue(() => height.value - panel.value);
  const topFeather = useSharedValue<MaskLength>(40);
  const bottomFeather = useSharedValue<MaskLength>(40);
  const enabled = useSharedValue(true);
  const offset = useSharedValue(0);
  const mid = useRef(false);
  const panelOn = useRef(false);
  const toggleTop = useCallback(() => { mid.current = !mid.current; top.value = withTiming(mid.current ? height.value * .5 : 0, {duration: 800}); }, [height, top]);
  const togglePanel = useCallback(() => { panelOn.current = !panelOn.current; panel.value = withTiming(panelOn.current ? Math.min(120, height.value * .4) : 0, {duration: 700}); }, [height, panel]);
  const append = useCallback(() => { const id = `new-${++sequence.current}`; setData(rows => [...rows, {id, text: 'Appended message'}]); }, []);
  const prepend = useCallback(() => { const id = `history-${++sequence.current}`; setData(rows => [{id, text: 'Prepended history (App owns anchoring)'}, ...rows]); }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      const value = `offset ${offset.value.toFixed(1)} · list mounts ${metrics.mounts}/${metrics.unmounts} · layouts ${metrics.listLayouts} · renders ${metrics.renders}`;
      setDiagnostics(value);
      if (automatic) console.log('CHAT_GEOMETRY ' + value);
    }, 1000);
    return () => clearInterval(timer);
  }, [offset, automatic]);
  useEffect(() => {
    if (!streaming) return;
    const timer = setInterval(() => setData(rows => rows.map((row, i) => i === 2 ? {...row, text: row.text + '字'} : row)), 80);
    return () => clearInterval(timer);
  }, [streaming]);
  useEffect(() => {
    if (!automatic) return;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      console.log('CHAT_SCENARIO ' + step);
      if (step === 1) toggleTop();
      if (step === 2) togglePanel();
      if (step === 3) setStreaming(true);
      if (step === 4) append();
      if (step === 5) prepend();
      if (step === 6) { topFeather.value = 0; bottomFeather.value = 0; toggleTop(); }
      if (step === 7) { top.value = height.value - 8; panel.value = 0; topFeather.value = 40; bottomFeather.value = 40; }
      if (step === 8) { top.value = -100; panel.value = -100; }
      if (step === 9) { top.value = height.value + 100; }
      if (step === 10) { top.value = 0; panel.value = 0; setStreaming(false); clearInterval(timer); }
    }, 3000);
    return () => clearInterval(timer);
  }, [automatic, toggleTop, togglePanel, append, prepend, top, panel, height, topFeather, bottomFeather]);
  const topLine = useAnimatedStyle(() => ({transform: [{translateY: Math.max(0, Math.min(height.value, top.value))}]}));
  const bottomLine = useAnimatedStyle(() => ({transform: [{translateY: Math.max(0, Math.min(height.value, bottom.value))}]}));
  const panelStyle = useAnimatedStyle(() => ({height: Math.max(0, panel.value)}));
  const info = useAnimatedProps(() => ({text: `${width.value.toFixed(0)} × ${height.value.toFixed(0)} · top ${top.value.toFixed(1)} / bottom ${bottom.value.toFixed(1)} · fade ${String(topFeather.value)} / ${String(bottomFeather.value)}`, defaultValue: ''}));
  return <View style={styles.root}>
    <Text style={styles.title}>Fixed chat · viewport mask</Text>
    <AnimatedInput editable={false} style={styles.info} animatedProps={info} />
    <View style={styles.controls}>
      <Button text="Top 0 ↔ 50%" action={toggleTop}/><Button text="Bottom panel" action={togglePanel}/>
      <Button text={streaming ? 'Stop typing' : 'Type characters'} action={() => setStreaming(!streaming)}/>
      <Button text="Append" action={append}/><Button text="Prepend" action={prepend}/>
      <Button text="Fade 0 / 40" action={() => {topFeather.value = topFeather.value === 0 ? 40 : 0; bottomFeather.value = topFeather.value;}}/>
      <Button text="Fade 50% / 40px" action={() => {topFeather.value = '50%'; bottomFeather.value = '40px';}}/>
      <Button text="8-unit window" action={() => {top.value = height.value - 8; panel.value = 0;}}/>
      <Button text="Out of bounds" action={() => {top.value = -100; panel.value = -100;}}/>
      <Button text="Reverse bounds" action={() => {top.value = height.value; panel.value = height.value;}}/>
      <Button text="Mask on / off" action={() => {enabled.value = !enabled.value;}}/>
    </View>
    <View style={styles.container} onLayout={event => {height.value = event.nativeEvent.layout.height; width.value = event.nativeEvent.layout.width;}}>
      <AnimatedViewportMaskView style={StyleSheet.absoluteFill} top={top} bottom={bottom} topFeather={topFeather} bottomFeather={bottomFeather} enabled={enabled}>
        <ChatList data={data} offset={offset}/>
      </AnimatedViewportMaskView>
      <Animated.View pointerEvents="none" style={[styles.line, topLine]}/>
      <Animated.View pointerEvents="none" style={[styles.line, styles.bottomLine, bottomLine]}/>
      <Animated.View pointerEvents="none" style={[styles.panel, panelStyle]}><Text style={styles.info}>Simulated bottom panel</Text></Animated.View>
    </View>
    <Text style={styles.diagnostics}>{diagnostics}</Text>
    <Text style={styles.diagnostics}>Cyan: top · Pink: bottom. Rapidly tap Top to reverse mid-animation. App owns scroll anchoring and touch exclusion.</Text>
  </View>;
}
function Button({text, action}: {text: string; action: () => void}) { return <Pressable accessibilityRole="button" onPress={action} style={styles.button}><Text style={styles.buttonText}>{text}</Text></Pressable>; }
const styles = StyleSheet.create({
  root: {flex: 1, padding: 10}, title: {color: 'white', fontSize: 18, fontWeight: '600'},
  info: {color: 'white', fontSize: 11, padding: 4}, controls: {flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginVertical: 8},
  button: {backgroundColor: '#293d59', padding: 8, borderRadius: 5}, buttonText: {color: 'white', fontSize: 11},
  container: {flex: 1, backgroundColor: '#125e66', overflow: 'hidden'}, row: {margin: 6, padding: 12, backgroundColor: '#e3eaf4', borderRadius: 6},
  line: {position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: '#00ffff'}, bottomLine: {backgroundColor: '#ff55bb'},
  panel: {position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#35445bbb'}, diagnostics: {color: '#b4c4d7', fontSize: 10, marginTop: 5},
});
