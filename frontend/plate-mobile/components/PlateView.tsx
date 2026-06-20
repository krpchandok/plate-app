import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import Svg, { Circle, Path, Line, Text as SvgText, G } from "react-native-svg";

const FOOD_GROUP_COLORS: Record<string, string> = {
  protein: "#C4856A",
  grains: "#C4A882",
  vegetables: "#7BC67E",
  dairy: "#82B4C8",
  joy: "#C482B4"
};

const FOOD_GROUP_ICONS: Record<string, string> = {
  protein: "🥩",
  grains: "🌾",
  vegetables: "🥦",
  dairy: "🥛",
  joy: "✨"
};

type Props = {
  foodGroups: Record<string, boolean>;
  annotations: Record<string, string>;
};

export default function PlateView({ foodGroups, annotations }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = Object.entries(foodGroups).filter(([_, v]) => v).map(([k]) => k);
  if (active.length === 0) return null;

  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 110;
  const innerR = 35;
  const sliceAngle = (2 * Math.PI) / active.length;

  const polarToCartesian = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle - Math.PI / 2),
    y: cy + radius * Math.sin(angle - Math.PI / 2)
  });

  const describeSlice = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle, r);
    const end = polarToCartesian(endAngle, r);
    const innerStart = polarToCartesian(startAngle, innerR);
    const innerEnd = polarToCartesian(endAngle, innerR);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return [
      `M ${innerStart.x} ${innerStart.y}`,
      `L ${start.x} ${start.y}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      "Z"
    ].join(" ");
  };

  const getMidPoint = (i: number) => {
    const midAngle = i * sliceAngle + sliceAngle / 2;
    return polarToCartesian(midAngle, (r + innerR) / 2);
  };

  return (
  <View style={styles.container}>
    <View style={styles.plateWrapper}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r + 18} fill="#EEE8E0" />
        <Circle cx={cx} cy={cy} r={r + 12} fill="#FFF" />

        {active.map((group, i) => {
          const startAngle = i * sliceAngle;
          const endAngle = (i + 1) * sliceAngle;
          const isSelected = selected === group;
          const mid = getMidPoint(i);

          return (
            <G key={group}>
              <Path
                d={describeSlice(startAngle, endAngle)}
                fill={FOOD_GROUP_COLORS[group] || "#C4A882"}
                opacity={isSelected ? 1 : 0.7}
                stroke="#FFF"
                strokeWidth={2}
              />
              <SvgText
                x={mid.x}
                y={mid.y + 4}
                fontSize={18}
                textAnchor="middle"
              >
                {FOOD_GROUP_ICONS[group]}
              </SvgText>
            </G>
          );
        })}

        <Circle cx={cx} cy={cy} r={innerR} fill="#FFF" />
        <Circle cx={cx} cy={cy} r={innerR - 6} fill="#F5F0EB" />
      </Svg>

      {/* tap overlays positioned over each slice */}
      <View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, overflow: "hidden" }]}>
        {active.map((group, i) => {
          const midAngle = i * sliceAngle + sliceAngle / 2;
          const mid = polarToCartesian(midAngle, (r + innerR) / 2);
          return (
            <TouchableOpacity
              key={group}
              style={{
                position: "absolute",
                left: mid.x - 30,
                top: mid.y - 30,
                width: 60,
                height: 60,
                borderRadius: 30,
              }}
              onPress={() => setSelected(selected === group ? null : group)}
            />
          );
        })}
      </View>
    </View>

    {!selected && <Text style={styles.hint}>tap a section to learn more ✨</Text>}

    {selected && (
      <View style={[styles.popup, { borderColor: FOOD_GROUP_COLORS[selected] }]}>
        <View style={styles.popupHeader}>
          <Text style={styles.popupIcon}>{FOOD_GROUP_ICONS[selected]}</Text>
          <Text style={[styles.popupGroup, { color: FOOD_GROUP_COLORS[selected] }]}>
            {selected}
          </Text>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.popupClose}>
            <Text style={styles.popupCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.popupText}>
          {annotations?.[selected] || `This dish contains ${selected}.`}
        </Text>
      </View>
    )}
  </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 16 },
  plateWrapper: { alignItems: "center" },
  hint: { fontSize: 13, color: "#BBB", fontStyle: "italic" },
  popup: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  popupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8
  },
  popupIcon: { fontSize: 24 },
  popupGroup: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
    flex: 1
  },
  popupClose: { padding: 4 },
  popupCloseText: { fontSize: 14, color: "#BBB" },
  popupText: {
    fontSize: 14,
    color: "#8B6F4E",
    lineHeight: 22
  }
});