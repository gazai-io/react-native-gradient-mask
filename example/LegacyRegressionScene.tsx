import React, {useEffect} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSharedValue} from 'react-native-reanimated';
import {GradientMaskView, AnimatedGradientMaskView} from 'react-native-gradient-mask';
const colors = [0, 0xff000000];
export default function LegacyRegressionScene() {
  const opacity = useSharedValue(1);
  useEffect(() => { const timer = setInterval(() => {opacity.value = opacity.value === 1 ? 0 : 1;}, 5000); return () => clearInterval(timer); }, [opacity]);
  return <View style={styles.root}>
    <Text style={styles.label}>Legacy regression · directions / opacity</Text>
    <View style={styles.grid}>{(['top','bottom','left','right'] as const).map(direction => <View key={direction}>
      <Text style={styles.label}>{direction}</Text>
      <GradientMaskView style={styles.box} direction={direction} colors={colors} locations={[0,1]}><View style={styles.white}/></GradientMaskView>
    </View>)}</View>
    <Text style={styles.label}>maskOpacity 0 · completely white</Text>
    <GradientMaskView style={styles.box} colors={colors} maskOpacity={0}><View style={styles.white}/></GradientMaskView>
    <Text style={styles.label}>Animated opacity 1 ↔ 0 every 5s</Text>
    <AnimatedGradientMaskView style={styles.box} colors={colors} direction="bottom" maskOpacity={opacity}><View style={styles.white}/></AnimatedGradientMaskView>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1,alignItems:'center',backgroundColor:'black'},grid:{flexDirection:'row',flexWrap:'wrap',width:290,gap:10},box:{width:140,height:110},white:{flex:1,backgroundColor:'white'},label:{color:'white',fontSize:12,marginVertical:10}});
