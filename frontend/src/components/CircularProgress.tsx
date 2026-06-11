import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from './Theme';

interface CircularProgressProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  fontSize?: number;
  // Dark-background mode — overrides text/track colors
  darkMode?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 12,
  fontSize = 20,
  darkMode = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  // Colour overrides for dark backgrounds
  const trackColor = darkMode ? 'rgba(255,255,255,0.2)' : COLORS.border;
  const textColor  = darkMode ? '#ffffff' : COLORS.text;
  const labelColor = darkMode ? 'rgba(255,255,255,0.7)' : COLORS.textMuted;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            {darkMode ? (
              <>
                <Stop offset="0%" stopColor="#a5b4fc" />
                <Stop offset="100%" stopColor="#e879f9" />
              </>
            ) : (
              <>
                <Stop offset="0%" stopColor={COLORS.primaryLight} />
                <Stop offset="100%" stopColor={COLORS.secondary} />
              </>
            )}
          </LinearGradient>
        </Defs>

        {/* Background Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Foreground Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center Percentage Text */}
      <View style={[styles.textOverlay, { width: size, height: size }]}>
        <Text style={[styles.text, { fontSize, color: textColor }]}>
          {clampedProgress}%
        </Text>
        <Text style={[styles.label, { color: labelColor }]}>Progress</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
});

export default CircularProgress;
