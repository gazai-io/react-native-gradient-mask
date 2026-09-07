<p align="center">
  <h1 align="center">react-native-gradient-mask</h1>
</p>

<p align="center">
  <b>React Native ネイティブグラデーションマスクコンポーネント</b>
</p>

<p align="center">
  美しいフェードエフェクト、リストマスク、スムーズなグラデーショントランジションを、ネイティブパフォーマンスと Reanimated アニメーションサポートで実現。
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-gradient-mask">
    <img src="https://img.shields.io/npm/v/react-native-gradient-mask.svg" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/react-native-gradient-mask">
    <img src="https://img.shields.io/npm/dm/react-native-gradient-mask.svg" alt="npm downloads" />
  </a>
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Web-brightgreen.svg" alt="platforms" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license" />
</p>

<p align="center">
  <a href="./README.md">English</a> •
  <a href="./README.zh-TW.md">繁體中文</a>
</p>

---

## デモ

<table>
  <tr><th>iOS</th><th>Android</th></tr>
  <tr>
    <td><a href="https://github.com/gazai-io/react-native-gradient-mask/releases/download/v0.2.3/viewport-ios.mp4"><img src="https://raw.githubusercontent.com/gazai-io/react-native-gradient-mask/v0.2.3/images/viewport-ios.gif" alt="iOS viewport mask: screen boundaries and transparent background" width="280" /></a></td>
    <td><a href="https://github.com/gazai-io/react-native-gradient-mask/releases/download/v0.2.3/viewport-android.mp4"><img src="https://raw.githubusercontent.com/gazai-io/react-native-gradient-mask/v0.2.3/images/viewport-android.gif" alt="Android viewport mask: screen boundaries and transparent background" width="280" /></a></td>
  </tr>
</table>

新版 Example の実録：画面中央の上端、背景切替、75% の下端、ぼかし、マスク切替。GIF をクリックすると MP4 を開きます。12 fps の GIF は性能測定ではありません。


## 特徴

| 特徴 | 説明 |
|------|------|
| **クロスプラットフォーム** | iOS、Android、Web 対応 |
| **ネイティブパフォーマンス** | iOS: `CAGradientLayer` • Android: `Canvas.saveLayer` + `PorterDuff` • Web: CSS `mask-image` |
| **Reanimated 対応** | `AnimatedGradientMaskView` で UI スレッドのマスクアニメーション |
| **柔軟な設定** | カスタムカラー、位置、方向、マスク強度 |
| **TypeScript** | 完全な型定義付き |

## インストール

```bash
npm install react-native-gradient-mask
```

```bash
yarn add react-native-gradient-mask
```

### 必要条件

| 依存関係 | バージョン |
|----------|-----------|
| Expo SDK | 50+ |
| React Native | 0.73+ |
| react-native-reanimated | >= 3.0.0 *（オプション）* |

### セットアップ

<details>
<summary><b>iOS</b></summary>

```bash
cd ios && pod install
```
</details>

<details>
<summary><b>Android</b></summary>

追加設定不要。オートリンクが有効です。
</details>

---

## クイックスタート

```tsx
import { processColor } from 'react-native';
import { GradientMaskView } from 'react-native-gradient-mask';

const colors = [
  processColor('rgba(0,0,0,0)'),
  processColor('rgba(0,0,0,1)'),
];

export default function App() {
  return (
    <GradientMaskView
      colors={colors}
      locations={[0, 1]}
      direction="top"
      style={{ flex: 1 }}
    >
      <YourContent />
    </GradientMaskView>
  );
}
```

---

## API リファレンス

### コンポーネント

| コンポーネント | 説明 |
|----------------|------|
| `GradientMaskView` | 基本グラデーションマスクコンポーネント |
| `AnimatedGradientMaskView` | Reanimated アニメーション対応グラデーションマスク |

### Props

#### GradientMaskView

| プロパティ | 型 | 必須 | デフォルト | 説明 |
|------------|------|:----:|------------|------|
| `colors` | `(number \| null)[]` | はい | - | グラデーションカラー（`processColor()` を使用） |
| `locations` | `number[]` | はい | - | カラー位置 (0-1) |
| `direction` | `'top' \| 'bottom' \| 'left' \| 'right'` | いいえ | `'top'` | グラデーション方向 |
| `maskOpacity` | `number` | いいえ | `1` | マスク強度 (0-1) |
| `style` | `ViewStyle` | いいえ | - | コンテナスタイル |
| `children` | `ReactNode` | いいえ | - | マスクを適用するコンテンツ |

#### AnimatedGradientMaskView

`GradientMaskView` と同じですが、`maskOpacity` はアニメーション制御用の `SharedValue<number>` を受け付けます。

### 方向ガイド

| 方向 | 効果 |
|------|------|
| `top` | 上部が透明 → 下部が不透明 |
| `bottom` | 下部が透明 → 上部が不透明 |
| `left` | 左側が透明 → 右側が不透明 |
| `right` | 右側が透明 → 左側が不透明 |

---

## 使用例

### 基本的なフェードエフェクト

```tsx
import { processColor } from 'react-native';
import { GradientMaskView } from 'react-native-gradient-mask';

const colors = [
  processColor('rgba(0,0,0,0)'),
  processColor('rgba(0,0,0,0.5)'),
  processColor('rgba(0,0,0,1)'),
];

function FadeExample() {
  return (
    <GradientMaskView
      colors={colors}
      locations={[0, 0.3, 1]}
      direction="top"
      style={{ flex: 1 }}
    >
      <ScrollView>
        <Text>フェードエフェクト付きコンテンツ</Text>
      </ScrollView>
    </GradientMaskView>
  );
}
```

### Reanimated アニメーションとの連携

```tsx
import { processColor } from 'react-native';
import { AnimatedGradientMaskView } from 'react-native-gradient-mask';
import { useSharedValue, withTiming } from 'react-native-reanimated';

function AnimatedExample() {
  const maskOpacity = useSharedValue(0);

  const showMask = () => {
    maskOpacity.value = withTiming(1, { duration: 600 });
  };

  const hideMask = () => {
    maskOpacity.value = withTiming(0, { duration: 400 });
  };

  return (
    <AnimatedGradientMaskView
      colors={[
        processColor('rgba(0,0,0,0)'),
        processColor('rgba(0,0,0,1)'),
      ]}
      locations={[0, 1]}
      maskOpacity={maskOpacity}
      style={{ flex: 1 }}
    >
      <YourContent />
    </AnimatedGradientMaskView>
  );
}
```

### チャットリストの動的マスク

```tsx
import { useMemo, useCallback, useRef } from 'react';
import { processColor } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { AnimatedGradientMaskView } from 'react-native-gradient-mask';
import { useSharedValue, withTiming, cancelAnimation, Easing } from 'react-native-reanimated';

function ChatList({ messages }) {
  const maskOpacity = useSharedValue(0);
  const isAtBottomRef = useRef(false);

  const maskColors = useMemo(() => [
    processColor('rgba(0,0,0,0)'),
    processColor('rgba(0,0,0,0)'),
    processColor('rgba(0,0,0,0.2)'),
    processColor('rgba(0,0,0,0.6)'),
    processColor('rgba(0,0,0,0.9)'),
    processColor('rgba(0,0,0,1)'),
  ], []);

  const handleScroll = useCallback((e) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    const isAtBottom = distanceFromBottom <= 30;

    if (isAtBottom !== isAtBottomRef.current) {
      isAtBottomRef.current = isAtBottom;
      cancelAnimation(maskOpacity);
      maskOpacity.value = withTiming(isAtBottom ? 1 : 0, {
        duration: isAtBottom ? 600 : 400,
        easing: isAtBottom ? Easing.in(Easing.quad) : Easing.out(Easing.quad),
      });
    }
  }, []);

  return (
    <AnimatedGradientMaskView
      colors={maskColors}
      locations={[0, 0.42, 0.45, 0.48, 0.5, 1]}
      direction="top"
      maskOpacity={maskOpacity}
      style={{ flex: 1 }}
    >
      <FlashList
        data={messages}
        renderItem={({ item }) => <MessageItem item={item} />}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
    </AnimatedGradientMaskView>
  );
}
```

---

## ヒントとベストプラクティス

### 必ず `processColor()` を使用

```tsx
// ✅ 正しい
const colors = [
  processColor('rgba(0,0,0,0)'),
  processColor('rgba(0,0,0,1)'),
];

// ❌ 間違い - 動作しません
const colors = [
  'rgba(0,0,0,0)',
  'rgba(0,0,0,1)',
];
```

### `useMemo` で最適化

```tsx
const maskColors = useMemo(() => [
  processColor('rgba(0,0,0,0)'),
  processColor('rgba(0,0,0,1)'),
], []);
```

### ちらつきを防ぐ

```tsx
import { cancelAnimation } from 'react-native-reanimated';

// 新しいアニメーションを開始する前に前のアニメーションをキャンセル
cancelAnimation(maskOpacity);
maskOpacity.value = withTiming(newValue, { duration: 300 });
```

---

## プラットフォームサポート

| プラットフォーム | 実装 | 状態 |
|------------------|------|:----:|
| iOS | `CAGradientLayer` | ✅ |
| Android | `Canvas.saveLayer` + `LinearGradient` + `PorterDuff` | ✅ |
| Web | CSS `mask-image` + `linear-gradient` | ✅ |

---

## Anini のために開発

このライブラリは [**Anini**](https://play.google.com/store/apps/details?id=com.gazai.aichat) のために開発されました — スムーズでネイティブ品質のユーザー体験を提供する AI チャットコンパニオンアプリです。

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=com.gazai.aichat">
    <img src="https://img.shields.io/badge/Google_Play-Anini-414141?style=for-the-badge&logo=google-play&logoColor=white" alt="Google Play で Anini をダウンロード" />
  </a>
</p>

---

## Example の検証環境

主要な Example 環境はアプリと同じ Expo 56.0.17 / React Native 0.85.3 です。
[アップグレードと検証記録](https://github.com/gazai-io/react-native-gradient-mask/blob/v0.2.5/docs/validation/expo-56-upgrade.md)および
[Expo 54 のビルド基準](https://github.com/gazai-io/react-native-gradient-mask/blob/v0.2.5/docs/validation/expo-54-baseline.md)（繁体字中国語）を参照してください。
環境の更新と機能の変更は別々に記録します。

## スポンサー

このプロジェクトは [**GAZAI**](https://gazai.io/EN/services) がスポンサーです — 革新的な AI 駆動アプリケーションを構築しています。

<p align="center">
  <a href="https://github.com/sponsors/CS6">
    <img src="https://img.shields.io/badge/スポンサー-GitHub_Sponsors-ea4aaa?style=for-the-badge&logo=github-sponsors&logoColor=white" alt="GitHub でスポンサーになる" />
  </a>
</p>

---

## ライセンス

MIT © [DaYuan Lin (CS6)](https://github.com/CS6)

---

<p align="center">
  <sub>React Native コミュニティのために ❤️ を込めて作りました</sub>
</p>

## Native chat viewport mask

See [opt-in viewport API, coordinate rules and Example](https://github.com/gazai-io/react-native-gradient-mask/blob/v0.2.5/docs/viewport-mask.md) and [validation checklist](https://github.com/gazai-io/react-native-gradient-mask/blob/v0.2.5/docs/validation/viewport-checklist.md).

### 0.2.0: タッチ範囲と画面基準の割合

`restrictTouchesToVisibleArea` は既定で `false`。有効時は表示範囲内からのみ操作を開始でき、開始済みのドラッグは範囲外でも継続します。
`percentageReference` は既定で `"container"`、`"screen"` で画面の高さを基準に割合を計算します。top/bottom も割合を指定でき、境界とぼかしに同じ基準を適用します。数値・px とコンテナ原点は変わりません。任意の `boundaryPercentageReference` で境界だけ別の基準にできます。

[API](https://github.com/gazai-io/react-native-gradient-mask/blob/v0.2.5/docs/viewport-mask.md) · [0.2.0 validation](https://github.com/gazai-io/react-native-gradient-mask/blob/v0.2.5/docs/validation/release-0.2.0.md)

画面中央に合わせる場合はコンテナ位置を差し引きます（Example 実装済み）。コンテナを透明にすると背面のページが見えます。[座標変換と透明背景](https://github.com/gazai-io/react-native-gradient-mask/blob/v0.2.5/docs/viewport-mask.md#transparent-backgrounds-and-the-023-demo) を参照してください。

### 背面へのタッチ透過（0.2.4）

`restrictTouchesToVisibleArea={true}` を有効にし、タッチを受け取らない祖先コンテナに `pointerEvents="box-none"` を指定すると、可視範囲外のタッチが背面の兄弟要素に届きます。Chat viewport で `Top 50% screen` を押し、`背景穿透：關` を `背景穿透：開` に切り替えて背面ボタンを押してください。[統合と両プラットフォームの検証結果](https://github.com/gazai-io/react-native-gradient-mask/blob/v0.2.5/docs/validation/pass-through-retest.md)。

### Navigation stack と view recycling（0.2.5）

マスクは iOS の左端バックジェスチャーを妨げません。そのレコグナイザーは navigation controller のビュー、つまりマスクの祖先に属しており、タッチの拒否は飲み込みではなく通過です。実際に画面を壊していたのは、Fabric が viewport マスクと gradient マスクの間でネイティブビューを再利用する場合でした。各ラッパーが自分の prop しか送らないため、再利用されたビューが前の要素の境界・タッチ制限・グラデーション状態を保持していました。現在はすべてのラッパーがネイティブ prop 一式を送信します。[native stack と再利用の検証記録](https://github.com/gazai-io/react-native-gradient-mask/blob/v0.2.5/docs/validation/native-stack-edge-swipe.md)（繁体字中国語）を参照してください。
