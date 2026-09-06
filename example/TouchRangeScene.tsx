import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Dimensions, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSharedValue} from 'react-native-reanimated';
import {AnimatedViewportMaskView, GradientMaskView, type MaskLength, type MaskPercentageReference} from 'react-native-gradient-mask';
export default function TouchRangeScene() {
  const restricted = useSharedValue(false);
  const enabled = useSharedValue(true);
  const top = useSharedValue<MaskLength>(100);
  const bottom = useSharedValue<MaskLength>(300);
  const [restrictLabel, setRestrictLabel] = useState(false);
  const [maskLabel, setMaskLabel] = useState(true);
  const [narrow, setNarrow] = useState(false);
  const [reference, setReference] = useState<MaskPercentageReference>('container');
  const boundaryReference = useSharedValue<MaskPercentageReference>('container');
  const [percentBounds, setPercentBounds] = useState(false);
  const [separate, setSeparate] = useState(false);
  const [passWrapper, setPassWrapper] = useState(true);
  const counts = useRef({content: 0, background: 0, offset: 0});
  const [status, setStatus] = useState('content=0 background=0 offset=0');
  const onPress = useCallback(() => {counts.current.content++;}, []);
  useEffect(() => {const timer = setInterval(() => {const c=counts.current; setStatus(`content=${c.content} background=${c.background} offset=${Math.round(c.offset)}`);}, 200); return () => clearInterval(timer);}, []);
  return <View style={styles.root}>
    <Pressable testID="touch-background" style={StyleSheet.absoluteFill} onPress={() => {counts.current.background++;}} />
    <Text style={styles.label}>Touch range · 300 × 400 · top {narrow ? 150 : 100} / bottom {narrow ? 250 : 300}</Text>
    <View style={styles.controls}>
      <Pressable testID="toggle-restrict" style={styles.button} onPress={() => {restricted.value=!restricted.value; setRestrictLabel(restricted.value);}}><Text>Restrict {String(restrictLabel)}</Text></Pressable>
      <Pressable testID="toggle-mask" style={styles.button} onPress={() => {enabled.value=!enabled.value; setMaskLabel(enabled.value);}}><Text>Mask {String(maskLabel)}</Text></Pressable>
      <Pressable testID="toggle-bounds" style={styles.button} onPress={() => {top.value=narrow?100:150;bottom.value=narrow?300:250;setNarrow(!narrow);}}><Text>Bounds</Text></Pressable>
    </View>
    <View style={styles.controls}>
      <Pressable testID="percent-bounds" style={styles.button} onPress={() => {top.value='25%';bottom.value='75%';setPercentBounds(true);}}><Text>Bounds 25% / 75%</Text></Pressable>
      <Pressable testID="separate-bounds" style={styles.button} onPress={() => {boundaryReference.value='container';setSeparate(!separate);}}><Text>Separate {String(separate)}</Text></Pressable>
    </View>
    <Pressable testID="toggle-wrapper" style={styles.button} onPress={() => setPassWrapper(!passWrapper)}><Text>Wrapper: {passWrapper ? 'box-none' : 'auto'}</Text></Pressable>
    <Text testID="touch-status" accessibilityLabel={status} style={styles.label}>{status}</Text>
    <View testID="touch-host" pointerEvents={passWrapper ? 'box-none' : 'auto'} collapsable={false} style={styles.host}>
      <AnimatedViewportMaskView style={StyleSheet.absoluteFill} top={top} bottom={bottom} percentageReference={percentBounds ? reference : undefined} boundaryPercentageReference={separate ? boundaryReference : undefined} topFeather={40} bottomFeather={40} enabled={enabled} restrictTouchesToVisibleArea={restricted}>
        <ScrollView testID="touch-list" scrollEventThrottle={100} onScroll={event => {counts.current.offset=event.nativeEvent.contentOffset.y;}}>
          {Array.from({length:24},(_,i)=><Pressable key={i} testID={`touch-row-${i}`} style={styles.row} onPress={onPress}><Text>Row {i}</Text></Pressable>)}
        </ScrollView>
      </AnimatedViewportMaskView>
    </View>
    <Pressable testID="toggle-reference" style={styles.button} onPress={() => setReference(reference==='container'?'screen':'container')}><Text>Percentage reference: {reference}</Text></Pressable>
    <Text style={styles.label}>Top 10% / bottom 10px · screen {Dimensions.get('screen').height}</Text>
    <GradientMaskView testID="reference-oracle" style={styles.oracle} topMaskHeight="10%" bottomMaskHeight="10px" percentageReference={reference}><View style={{flex:1,backgroundColor:'white'}}/></GradientMaskView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1,alignItems:'center',backgroundColor:'#101827'},label:{color:'white',fontSize:11,margin:6},controls:{flexDirection:'row',gap:8},button:{backgroundColor:'#c4d8ee',padding:6,marginVertical:3},host:{width:300,height:400,backgroundColor:'#12616a'},row:{height:50,backgroundColor:'#e4ecf6',borderBottomWidth:1,borderColor:'#698098',justifyContent:'center',padding:10},oracle:{width:240,height:120,backgroundColor:'black'}});
