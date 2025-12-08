import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.75;
const CHART_RADIUS = CHART_SIZE / 2;
const SEGMENT_COUNT = 60;

export default function CircularChart() {
  // Generate segments around the circle
  const segments = Array.from({ length: SEGMENT_COUNT }, (_, i) => {
    const angle = (i * 360) / SEGMENT_COUNT - 90; // Start from top
    
    // Color distribution: mostly grey, some orange, few blue
    let color = '#E5E7EB'; // light grey
    if (i % 8 === 0) color = '#FED7AA'; // light orange
    if (i % 15 === 0) color = '#BFDBFE'; // light blue
    
    return { angle, color, index: i };
  });

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        {/* Outer circle with green border */}
        <View style={styles.outerCircle}>
          {/* Segments as small rectangles around the border */}
          <View style={styles.segmentsContainer}>
            {segments.map((segment, index) => {
              const angle = segment.angle;
              const radian = (angle * Math.PI) / 180;
              // Calculate position on the circle edge
              const x = CHART_RADIUS + (CHART_RADIUS - 4) * Math.cos(radian) - 1.5;
              const y = CHART_RADIUS + (CHART_RADIUS - 4) * Math.sin(radian) - 5;
              
              return (
                <View
                  key={index}
                  style={[
                    styles.segment,
                    {
                      left: x,
                      top: y,
                      transform: [{ rotate: `${angle}deg` }],
                      backgroundColor: segment.color,
                    },
                  ]}
                />
              );
            })}
          </View>
          
          {/* Inner circle background */}
          <View style={styles.innerCircle} />
        </View>

        {/* Icons inside the circle */}
        <View style={styles.innerIcons}>
          {/* Top Right - Heart */}
          <View style={[styles.iconPosition, styles.topRight]}>
            <MaterialCommunityIcons name="heart-pulse" size={20} color="#FB923C" />
            <Text style={styles.iconDash}>-</Text>
          </View>

          {/* Mid Left - Running */}
          <View style={[styles.iconPosition, styles.midLeft]}>
            <MaterialCommunityIcons name="run" size={20} color="#FB923C" />
            <Text style={styles.iconDash}>-</Text>
          </View>

          {/* Mid Right - Lightning */}
          <View style={[styles.iconPosition, styles.midRight]}>
            <Ionicons name="flash" size={20} color="#FB923C" />
            <Text style={styles.iconDash}>-</Text>
          </View>

          {/* Bottom Left - Water */}
          <View style={[styles.iconPosition, styles.bottomLeft]}>
            <MaterialCommunityIcons name="cup-water" size={20} color="#FB923C" />
            <Text style={styles.iconDash}>-</Text>
          </View>

          {/* Bottom Right - Food */}
          <View style={[styles.iconPosition, styles.bottomRight]}>
            <MaterialCommunityIcons name="food" size={20} color="#FB923C" />
            <Text style={styles.iconDash}>-</Text>
          </View>

          {/* Bottom Center - Moon */}
          <View style={[styles.iconPosition, styles.bottomCenter]}>
            <MaterialCommunityIcons name="weather-night" size={20} color="#FB923C" />
            <Text style={styles.iconDash}>-</Text>
          </View>
        </View>

        {/* Icons outside the circle */}
        <View style={styles.outerIcons}>
          {/* Left - Moon */}
          <View style={[styles.outerIconPosition, styles.outerLeft]}>
            <MaterialCommunityIcons name="weather-night" size={24} color="#9CA3AF" />
          </View>

          {/* Right - Water */}
          <View style={[styles.outerIconPosition, styles.outerRight]}>
            <MaterialCommunityIcons name="cup-water" size={24} color="#3B82F6" />
          </View>

          {/* Bottom - Food (Green) */}
          <View style={[styles.outerIconPosition, styles.outerBottom]}>
            <MaterialCommunityIcons name="food" size={24} color="#22C55E" />
          </View>

          {/* Top - Running (Red) */}
          <View style={[styles.outerIconPosition, styles.outerTop]}>
            <MaterialCommunityIcons name="run" size={24} color="#EF4444" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  chartWrapper: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    width: CHART_SIZE,
    height: CHART_SIZE,
    borderRadius: CHART_RADIUS,
    backgroundColor: '#FEF3C7',
    borderWidth: 8,
    borderColor: '#22C55E',
    position: 'relative',
    overflow: 'visible',
  },
  segmentsContainer: {
    position: 'absolute',
    width: CHART_SIZE,
    height: CHART_SIZE,
    top: 0,
    left: 0,
  },
  segment: {
    position: 'absolute',
    width: 3,
    height: 10,
    borderRadius: 1.5,
  },
  innerCircle: {
    position: 'absolute',
    width: CHART_SIZE - 80,
    height: CHART_SIZE - 80,
    borderRadius: (CHART_SIZE - 80) / 2,
    backgroundColor: '#FEF3C7',
    top: 40,
    left: 40,
  },
  innerIcons: {
    position: 'absolute',
    width: CHART_SIZE,
    height: CHART_SIZE,
    top: 0,
    left: 0,
  },
  iconPosition: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRight: {
    top: CHART_RADIUS * 0.3,
    right: CHART_RADIUS * 0.3,
  },
  midLeft: {
    top: CHART_RADIUS * 0.9,
    left: CHART_RADIUS * 0.2,
  },
  midRight: {
    top: CHART_RADIUS * 0.9,
    right: CHART_RADIUS * 0.2,
  },
  bottomLeft: {
    bottom: CHART_RADIUS * 0.3,
    left: CHART_RADIUS * 0.3,
  },
  bottomRight: {
    bottom: CHART_RADIUS * 0.3,
    right: CHART_RADIUS * 0.3,
  },
  bottomCenter: {
    bottom: CHART_RADIUS * 0.1,
    left: CHART_RADIUS * 0.9,
  },
  iconDash: {
    marginLeft: 4,
    fontSize: 16,
    color: '#FB923C',
    fontWeight: '600',
  },
  outerIcons: {
    position: 'absolute',
    width: CHART_SIZE,
    height: CHART_SIZE,
  },
  outerIconPosition: {
    position: 'absolute',
  },
  outerLeft: {
    left: -30,
    top: CHART_RADIUS * 0.85,
  },
  outerRight: {
    right: -30,
    top: CHART_RADIUS * 0.85,
  },
  outerBottom: {
    bottom: -30,
    left: CHART_RADIUS * 0.9,
  },
  outerTop: {
    top: -30,
    left: CHART_RADIUS * 0.9,
  },
});

