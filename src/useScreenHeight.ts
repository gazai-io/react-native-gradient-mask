import { useSyncExternalStore } from 'react';
import { Dimensions } from 'react-native';

const getHeight = () => Dimensions.get('screen').height;
const serverHeight = () => 0;
const noSubscribe = () => () => {};
const subscribe = (notify: () => void) => {
  const subscription = Dimensions.addEventListener('change', notify);
  return () => subscription.remove();
};
/** Subscribe only in screen mode (or when an animated mode can change on the UI thread). */
export function useScreenHeight(enabled: boolean): number {
  return useSyncExternalStore(enabled ? subscribe : noSubscribe, getHeight, serverHeight);
}
