import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { StyleSheet, View } from "react-native";

export default function TabBarBackground() {
  const colorScheme = useColorScheme();

  return (
    <View
      pointerEvents="none"
      style={[
        styles.tabBarBackground,
        {
          backgroundColor: Colors[colorScheme ?? "light"].background || "#fff",
        },
      ]}
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}

const styles = StyleSheet.create({
  tabBarBackground: {
    position: "absolute",
    top: -10,
    left: 0,
    right: 0,
    bottom: -5,
    // borderTopWidth: 3,
    // borderTopColor: "#E0E0E0",
    borderRadius: 20,
    elevation: 5,
  },
});
