import { Tabs } from "expo-router";
import React from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const { width: screenWidth } = Dimensions.get("window");
const TAB_COUNT_VISIBLE = 6; // Limit to 6 tabs visible at a time
const TAB_WIDTH = screenWidth / TAB_COUNT_VISIBLE; // Equal width for each tab

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const CustomTabBar = ({
    state,
    descriptors,
    navigation,
  }: {
    state: any;
    descriptors: any;
    navigation: any;
  }) => {
    const totalTabs = state.routes.length;
    const contentWidth = totalTabs * TAB_WIDTH; // Ensure content width exceeds screen width when needed

    return (
      <View style={styles.tabBarContainer}>
        <TabBarBackground />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              minWidth: Math.max(contentWidth, screenWidth * 0.95),
              justifyContent: "flex-start", // Keep items aligned left
            },
          ]} // Ensure enough scrollable width
          scrollEnabled={true} // Always enable scrolling
          bounces={false}
          decelerationRate="fast"
          overScrollMode="always" // Disable overscroll bounce on Android
          nestedScrollEnabled={true} // Handle nested scrolling on Android
          style={{ width: "100%", height: 70 }}
        >
          {state.routes.map(
            (
              route: { key: React.Key | null | undefined; name: any },
              index: any
            ) => {
              const { options } = descriptors[route.key as string] || {};
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: "tabLongPress",
                  target: route.key,
                });
              };

              return (
                <HapticTab
                  key={route.key}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={[styles.tabItem, { width: TAB_WIDTH }]}
                >
                  {options.tabBarIcon({
                    color: isFocused
                      ? Colors[colorScheme ?? "light"].tint
                      : "#888",
                    focused: isFocused,
                  })}
                </HapticTab>
              );
            }
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name="document-scanner"
              color={focused ? Colors[colorScheme ?? "light"].tint : "#888"}
              style={focused ? styles.activeIcon : styles.inactiveIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="money"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name="money"
              color={focused ? Colors[colorScheme ?? "light"].tint : "#888"}
              style={focused ? styles.activeIcon : styles.inactiveIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name="qr-code-scanner"
              color={focused ? Colors[colorScheme ?? "light"].tint : "#888"}
              style={focused ? styles.activeIcon : styles.inactiveIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan-face"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name="tag-faces"
              color={focused ? Colors[colorScheme ?? "light"].tint : "#888"}
              style={focused ? styles.activeIcon : styles.inactiveIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="image"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name="image"
              color={focused ? Colors[colorScheme ?? "light"].tint : "#888"}
              style={focused ? styles.activeIcon : styles.inactiveIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="distance"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name="social-distance"
              color={focused ? Colors[colorScheme ?? "light"].tint : "#888"}
              style={focused ? styles.activeIcon : styles.inactiveIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add-face"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={28}
              name="face-retouching-natural"
              color={focused ? Colors[colorScheme ?? "light"].tint : "#888"}
              style={focused ? styles.activeIcon : styles.inactiveIcon}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "relative",
    bottom: 10,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    width: "95%",
    alignSelf: "center",
  },
  scrollContent: {
    paddingBottom: Platform.OS === "ios" ? 10 : 5,
    flexDirection: "row",
    alignItems: "center",
  },
  tabItem: {
    marginHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIcon: {
    backgroundColor: Colors.light.tint + "20",
    padding: 12,
    borderRadius: 16,
    transform: [{ scale: 1.25 }],
  },
  inactiveIcon: {
    padding: 8,
  },
});
