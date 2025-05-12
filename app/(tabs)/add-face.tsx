import { ThemedText } from "@/components/ThemedText";
import { useAutoCaptureImage } from "@/hooks/useAutoCaptureImage";
import { useVoiceCommand } from "@/hooks/useVoiceCommand";
import { isSpeakingRef } from "@/utils/speechState";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Button,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function AddFaceScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const animation = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const {
    route: voiceRoute,
    startListening,
    stopListening,
  } = useVoiceCommand();
  const lastVoice = useRef<string>("/");
  const [allowedSendImage, setAllowedSendImage] = React.useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [form, setForm] = useState({
    name: "",
    hometown: "",
    relationship: "",
    date_of_birth: "",
  });

  useEffect(() => {
    if (voiceRoute && voiceRoute !== lastVoice.current) {
      router.replace(voiceRoute);
      lastVoice.current = voiceRoute;
    }
  }, [voiceRoute]);

  const { submitCapturedImage } = useAutoCaptureImage({
    cameraRef,
    isFocused,
    captureInterval: 5000,
    detectionType: "add_face",
    enabled: allowedSendImage,
    onImageCaptured: () => {
      setShowPopup(true); // Mở form điền tên
    },
  });

  const handleSubmit = async () => {
    setShowPopup(false);
    setAllowedSendImage(false);
    await submitCapturedImage(form);
    setAllowedSendImage(true);
    setForm({
      name: "",
      hometown: "",
      relationship: "",
      date_of_birth: "",
    });
  };

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

  return (
    <Pressable
      style={styles.container}
      onPressIn={() => {
        startListening();
        setAllowedSendImage(false);
        Speech.stop();
        isSpeakingRef.current = false;
      }}
      onPressOut={() => {
        stopListening();
        setAllowedSendImage(true);
      }}
    >
      {isFocused ? (
        <CameraView
          key={isFocused ? "camera-active" : "camera-inactive"}
          ref={cameraRef}
          style={styles.camera}
          facing="front"
        />
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
            Place your face inside the frame
          </ThemedText>
        </View>
      </View>

      <Modal visible={showPopup} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#00000088",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              width: "90%",
            }}
          >
            <ThemedText
              style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}
            >
              Thông tin người thân
            </ThemedText>

            {(
              ["name", "hometown", "relationship", "date_of_birth"] as Array<
                keyof typeof form
              >
            ).map((key) => (
              <View key={key} style={{ marginBottom: 12 }}>
                <ThemedText style={{ fontWeight: "500" }}>
                  {key.replaceAll("_", " ")} *
                </ThemedText>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 5,
                    padding: 8,
                    marginTop: 4,
                  }}
                  value={form[key] as string}
                  onChangeText={(text) => setForm({ ...form, [key]: text })}
                  placeholder={key}
                />
              </View>
            ))}

            <Button title="Gửi thông tin" onPress={handleSubmit} />
          </View>
        </View>
      </Modal>
    </Pressable>
  );
}

const SCAN_WIDTH = width * 0.9;
const SCAN_HEIGHT = SCAN_WIDTH * 1.3;

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
    borderRadius: SCAN_HEIGHT / 2,
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
