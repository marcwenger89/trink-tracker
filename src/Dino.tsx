import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

type Mood = 0 | 1 | 2 | 3 | 4;

/** 0 = sad … 4 = goal reached. */
export function moodFor(progress: number): Mood {
  if (progress >= 1) return 4;
  if (progress >= 0.75) return 3;
  if (progress >= 0.5) return 2;
  if (progress >= 0.25) return 1;
  return 0;
}

// Body colour gets more vivid the happier the dino is.
const BODY = ['#A7B5A2', '#8FBF84', '#6CC36A', '#4DBF5A', '#2EBD58'];
const SPIKES = ['#8A9786', '#6E9E64', '#4F9E4E', '#379A44', '#1E9A44'];
const BELLY = '#E8F5D9';

const MESSAGES = [
  'Ich hab sooo Durst… 🥺',
  'Ein bisschen mehr bitte!',
  'Schon besser! 😊',
  'Fast geschafft! 💪',
  'Juhu, Ziel erreicht! 🎉',
];

const BOUNCE = [1, 2, 4, 6, 10];
const BOUNCE_MS = [1600, 1200, 900, 700, 450];

type Props = { progress: number; size?: number; hasAlcohol?: boolean };

export function Dino({ progress, size = 130, hasAlcohol = false }: Props) {
  const mood = moodFor(progress);
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const useNativeDriver = Platform.OS !== 'web';
    const half = BOUNCE_MS[mood] / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: half,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: half,
          easing: Easing.in(Easing.quad),
          useNativeDriver,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [mood, bounce]);

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -BOUNCE[mood]],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{MESSAGES[mood]}</Text>
        {hasAlcohol && <Text style={styles.bubbleHint}>Hicks! Alkohol zählt nicht 🍺</Text>}
      </View>
      <View style={styles.bubbleTail} />
      <Animated.View style={{ transform: [{ translateY }] }}>
        <DinoSvg mood={mood} size={size} />
      </Animated.View>
    </View>
  );
}

function DinoSvg({ mood, size }: { mood: Mood; size: number }) {
  const body = BODY[mood];
  const spikes = SPIKES[mood];

  return (
    <Svg width={size} height={size * (125 / 140)} viewBox="0 0 140 125">
      {/* Spikes (behind body) */}
      <G fill={spikes}>
        <Polygon points="34,70 38,56 46,66" />
        <Polygon points="44,62 50,48 57,60" />
        <Polygon points="56,57 63,44 68,56" />
        <Polygon points="74,26 80,13 86,24" />
        <Polygon points="86,22 93,10 98,22" />
      </G>

      {/* Tail */}
      <Path d="M38 88 C20 90 8 84 3 68 C14 78 26 78 40 72 Z" fill={body} />

      {/* Legs */}
      <Rect x={41} y={98} width={14} height={20} rx={6} fill={spikes} />
      <Rect x={66} y={98} width={14} height={20} rx={6} fill={spikes} />

      {/* Body, neck, head */}
      <Ellipse cx={58} cy={84} rx={30} ry={25} fill={body} />
      <Ellipse cx={76} cy={62} rx={14} ry={17} fill={body} />
      <Ellipse cx={92} cy={42} rx={28} ry={22} fill={body} />
      <Ellipse cx={63} cy={90} rx={17} ry={14} fill={BELLY} />

      {/* Arm */}
      <Rect x={80} y={73} width={13} height={6} rx={3} fill={spikes} transform="rotate(30 86 76)" />

      {/* Nostril */}
      <Circle cx={114} cy={38} r={1.6} fill="#2B3A2A" />

      {/* Cheek */}
      {mood >= 2 && <Ellipse cx={106} cy={49} rx={5} ry={3} fill="#FF8A9A" opacity={0.6} />}

      <Eye mood={mood} />
      <Mouth mood={mood} />

      {/* Tear */}
      {mood === 0 && <Path d="M93 45 Q90 51 93 53 Q96 51 93 45 Z" fill="#64B5F6" />}

      {/* Celebration */}
      {mood === 4 && (
        <G>
          <Path
            d="M122 14 C122 10 128 10 128 14 C128 10 134 10 134 14 C134 19 128 22 128 24 C128 22 122 19 122 14 Z"
            fill="#FF5C8A"
          />
          <Path d="M20 30 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 Z" fill="#FFC107" />
          <Path d="M118 64 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 Z" fill="#FFC107" />
        </G>
      )}
    </Svg>
  );
}

function Eye({ mood }: { mood: Mood }) {
  if (mood === 4) {
    // Closed, happy "^" eye
    return (
      <Path d="M91 39 Q97 31 103 39" stroke="#2B3A2A" strokeWidth={3} fill="none" strokeLinecap="round" />
    );
  }
  return (
    <G>
      <Circle cx={97} cy={37} r={6} fill="#fff" />
      <Circle cx={98} cy={mood === 0 ? 39 : 37} r={3.2} fill="#2B3A2A" />
      <Circle cx={99} cy={mood === 0 ? 38 : 36} r={1} fill="#fff" />
      {mood === 0 && (
        <Path d="M89 27 L103 31" stroke="#2B3A2A" strokeWidth={2.5} strokeLinecap="round" />
      )}
    </G>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  const stroke = { stroke: '#2B3A2A', strokeWidth: 2.5, strokeLinecap: 'round' as const, fill: 'none' };
  switch (mood) {
    case 0:
      return <Path d="M96 56 Q104 50 112 56" {...stroke} />;
    case 1:
      return <Path d="M97 54 L111 54" {...stroke} />;
    case 2:
      return <Path d="M95 52 Q104 59 112 52" {...stroke} />;
    default:
      // Open smile with tongue, bigger when the goal is reached
      return (
        <G>
          <Path
            d={mood === 4 ? 'M93 50 Q104 68 115 50 Z' : 'M95 51 Q104 63 113 51 Z'}
            fill="#5D1F2A"
            stroke="#2B3A2A"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <Ellipse cx={104} cy={mood === 4 ? 58 : 56} rx={4.5} ry={2.5} fill="#FF7A90" />
        </G>
      );
  }
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#DDE5EE',
    maxWidth: 160,
  },
  bubbleText: { fontSize: 12, fontWeight: '700', color: '#0D1B2A', textAlign: 'center' },
  bubbleHint: { fontSize: 10, color: '#6B7C93', textAlign: 'center', marginTop: 2 },
  bubbleTail: {
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DDE5EE',
    transform: [{ rotate: '45deg' }],
    marginTop: -6,
    marginBottom: 2,
  },
});
