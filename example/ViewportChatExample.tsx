import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import Animated, { useAnimatedProps, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { AnimatedViewportMaskView, type MaskLength, type MaskPercentageReference } from 'react-native-gradient-mask';
const AnimatedInput = Animated.createAnimatedComponent(TextInput);
type Message = { id: string; text: string };
const initial = Array.from({length: 200}, (_, i) => ({id: `seed-${i}`, text: `Message ${i} — Fixed offline chat content. Scroll while changing the visible window.`}));
const metrics = { mounts: 0, unmounts: 0, listLayouts: 0, renders: 0 };
const ChatList = memo(function ChatList({data, offset}: {data: Message[]; offset: {value: number}}) {
  metrics.renders++;
  const listRef = useRef<FlashListRef<Message>>(null);
  const loaded = useCallback(() => listRef.current?.scrollToOffset({offset: 120, animated: false}), []);
  useEffect(() => { metrics.mounts++; return () => { metrics.unmounts++; }; }, []);
  return <FlashList ref={listRef} onLoad={loaded} data={data} keyExtractor={item => item.id} maintainVisibleContentPosition={{disabled: true}}
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
  const containerRef = useRef<View>(null);
  const containerScreenY = useSharedValue(0);
  const measureContainer = useCallback((after?: () => void) => {
    // This Example fills the screen. pageY is relative to that root;
    // measureInWindow adds a separate Android viewport/status-bar offset.
    containerRef.current?.measure((_x, _y, _width, _height, _pageX, y) => {
      containerScreenY.value = y;
      after?.();
    });
  }, [containerScreenY]);
  const topProgress = useSharedValue(0);
  const topOverride = useSharedValue<number | null>(null);
  const [screenHeight, setScreenHeight] = useState(() => Dimensions.get('screen').height);
  useEffect(() => { const sub = Dimensions.addEventListener('change', ({screen}) => setScreenHeight(screen.height)); return () => sub.remove(); }, []);
  useEffect(() => { const frame = requestAnimationFrame(() => measureContainer()); return () => cancelAnimationFrame(frame); }, [screenHeight, measureContainer]);
  const panel = useSharedValue(0);
  const bottomRatio = useSharedValue<number | null>(null);
  const topFeather = useSharedValue<MaskLength>(40);
  const bottomFeather = useSharedValue<MaskLength>(40);
  const enabled = useSharedValue(true);
  const restricted = useSharedValue(false);
  const [restrictLabel, setRestrictLabel] = useState(false);
  const [percentageReference, setPercentageReference] = useState<MaskPercentageReference>('container');
  const topInput = useDerivedValue<MaskLength>(() => topOverride.value ?? (percentageReference === 'screen' ? topProgress.value * Math.max(0, screenHeight * .5 - containerScreenY.value) : {value: topProgress.value * .5, unit: 'ratio'}));
  const top = useDerivedValue(() => topOverride.value ?? topProgress.value * (percentageReference === 'screen' ? Math.max(0, screenHeight * .5 - containerScreenY.value) : height.value * .5));
  const bottomInput = useDerivedValue<MaskLength>(() => bottomRatio.value === null ? height.value - panel.value : percentageReference === 'screen' ? bottomRatio.value * screenHeight - containerScreenY.value : {value: bottomRatio.value, unit: 'ratio'});
  const bottom = useDerivedValue(() => bottomRatio.value === null ? height.value - panel.value : bottomRatio.value * (percentageReference === 'screen' ? screenHeight : height.value) - (percentageReference === 'screen' ? containerScreenY.value : 0));
  const offset = useSharedValue(0);
  const mid = useRef(false);
  const panelOn = useRef(false);
  const bottomMid = useRef(false);
  const toggleTop = useCallback(() => { mid.current = !mid.current; topOverride.value = null; topProgress.value = withTiming(mid.current ? 1 : 0, {duration: 800}); }, [topOverride, topProgress]);
  const togglePanel = useCallback(() => { bottomRatio.value = null; panelOn.current = !panelOn.current; panel.value = withTiming(panelOn.current ? Math.min(120, height.value * .4) : 0, {duration: 700}); }, [height, panel, bottomRatio]);
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
    const timer = setInterval(() => setData(rows => rows.map(row => row.id === 'seed-2' ? {...row, text: row.text + '字'} : row)), 80);
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
      if (step === 7) { bottomRatio.value = null; topOverride.value = height.value - 8; panel.value = 0; topFeather.value = 40; bottomFeather.value = 40; }
      if (step === 8) { bottomRatio.value = null; topOverride.value = -100; panel.value = -100; }
      if (step === 9) { topOverride.value = height.value + 100; }
      if (step === 10) { topOverride.value = 0; panel.value = 0; setStreaming(false); clearInterval(timer); }
    }, 3000);
    return () => clearInterval(timer);
  }, [automatic, toggleTop, togglePanel, append, prepend, top, panel, height, topFeather, bottomFeather, topOverride]);
  const topLine = useAnimatedStyle(() => ({transform: [{translateY: Math.max(0, Math.min(height.value, top.value))}]}));
  const bottomLine = useAnimatedStyle(() => ({transform: [{translateY: Math.max(0, Math.max(Math.min(height.value, top.value), Math.min(height.value, bottom.value)))}]}));
  const panelStyle = useAnimatedStyle(() => ({height: Math.max(0, panel.value)}));
  const info = useAnimatedProps(() => {
    const text = `${width.value.toFixed(0)} × ${height.value.toFixed(0)} · top ${top.value.toFixed(1)} / bottom ${bottom.value.toFixed(1)} · fade ${String(topFeather.value)} / ${String(bottomFeather.value)}`;
    return {text, defaultValue: text};
  });
  return <View style={styles.root}>
    <Text style={styles.title}>Fixed chat · viewport mask</Text>
    <AnimatedInput testID="chat-mask-metrics" editable={false} style={styles.info} animatedProps={info} />
    <View style={styles.controls}>
      <Button text="Top 0 ↔ 50%" action={toggleTop}/><Button text="Bottom panel" action={togglePanel}/>
      <Button text="Top 50% screen" action={() => measureContainer(() => {setPercentageReference('screen'); mid.current = true; topOverride.value = null; topProgress.value = withTiming(1, {duration: 800});})}/>
      <Button text="Bottom 100% ↔ 75%" action={() => {bottomMid.current = !bottomMid.current; if (bottomRatio.value === null) { const base = percentageReference === 'screen' ? screenHeight : height.value; bottomRatio.value = base > 0 ? (height.value - panel.value + (percentageReference === 'screen' ? containerScreenY.value : 0)) / base : 0; } bottomRatio.value = withTiming(bottomMid.current ? .75 : 1, {duration: 700});}}/>
      <Button text={streaming ? 'Stop typing' : 'Type characters'} action={() => setStreaming(!streaming)}/>
      <Button text="Append" action={append}/><Button text="Prepend" action={prepend}/>
      <Button text="Fade 0 / 40" action={() => {topFeather.value = topFeather.value === 0 ? 40 : 0; bottomFeather.value = topFeather.value;}}/>
      <Button text="Fade 50% / 40px" action={() => {topFeather.value = '50%'; bottomFeather.value = '40px';}}/>
      <Button text="8-unit window" action={() => {bottomRatio.value = null; topOverride.value = height.value - 8; panel.value = 0;}}/>
      <Button text="Out of bounds" action={() => {bottomRatio.value = null; topOverride.value = -100; panel.value = -100;}}/>
      <Button text="Reverse bounds" action={() => {bottomRatio.value = null; topOverride.value = height.value; panel.value = height.value;}}/>
      <Button text={`Touch range: ${restrictLabel ? 'visible' : 'all'}`} action={() => {restricted.value = !restricted.value; setRestrictLabel(restricted.value);}}/>
      <Button text={`%: ${percentageReference}`} action={() => measureContainer(() => setPercentageReference(percentageReference === 'container' ? 'screen' : 'container'))}/>
      <Button text="Mask on / off" action={() => {enabled.value = !enabled.value;}}/>
    </View>
    <View ref={containerRef} testID="chat-mask-container" collapsable={false} style={styles.container} onLayout={event => {height.value = event.nativeEvent.layout.height; width.value = event.nativeEvent.layout.width; measureContainer();}}>
      <AnimatedViewportMaskView style={StyleSheet.absoluteFill} top={topInput} bottom={bottomInput} topFeather={topFeather} bottomFeather={bottomFeather} enabled={enabled} restrictTouchesToVisibleArea={restricted} percentageReference={percentageReference}>
        <ChatList data={data} offset={offset}/>
      </AnimatedViewportMaskView>
      <Animated.View testID="chat-top-line" collapsable={false} pointerEvents="none" style={[styles.line, topLine]}/>
      <Animated.View testID="chat-bottom-line" collapsable={false} pointerEvents="none" style={[styles.line, styles.bottomLine, bottomLine]}/>
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
