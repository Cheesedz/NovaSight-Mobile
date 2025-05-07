import { ThemedText } from "@/components/ThemedText";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width } = Dimensions.get("window");

export default function DocumentScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const animation = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<CameraView>(null);
  const hasCapturedRef = useRef(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (isFocused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isFocused]);

  useEffect(() => {
    if (isFocused && !hasCapturedRef.current) {
      hasCapturedRef.current = true;
      const interval = setInterval(async () => {
        try {
          if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({
              skipProcessing: true,
            });
            await sendRawImageToServer(photo.uri);
          }
        } catch (err) {
          console.error("Capture failed:", err);
        }
      }, 5000); // wait 5 seconds after screen is focused

      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (!isFocused) {
      hasCapturedRef.current = false;
    }
  }, [isFocused]);

  if (permission === null) return <View />;
  if (permission?.status == "denied")
    return (
      <View>
        <ThemedText>No access to camera</ThemedText>
      </View>
    );

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_HEIGHT - 2], // Height of scanning box
  });

  async function sendRawImageToServer(imageUri: string) {
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "document.jpg",
    } as any);

    try {
      const response = await fetch(
        "https://huy-vincent.app.n8n.cloud/webhook-test/test-image",
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      const result = await response.json();
      console.log("AI response:", result);
    } catch (err) {
      console.error("Failed to send image:", err);
    }
  }

  return (
    <View style={styles.container}>
      {isFocused ? (
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      ) : null}

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY }],
              },
            ]}
          />
        </View>

        {/* Instruction Message */}
        <View style={styles.messageContainer}>
          <ThemedText style={styles.messageText}>
            Place your document inside the frame
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const SCAN_WIDTH = width * 0.9;
const SCAN_HEIGHT = SCAN_WIDTH * 1.5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(53, 53, 53, 0.3)",
  },
  scanArea: {
    width: SCAN_WIDTH,
    height: SCAN_HEIGHT,
    borderColor: "#87fbff",
    borderWidth: 5,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  scanLine: {
    width: "100%",
    height: 1,
    backgroundColor: "#87fbff",
    position: "absolute",
    top: 0,
  },
  messageContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
