import { ThemedText } from "@/components/ThemedText";
import { useAutoCaptureImage } from "@/hooks/useAutoCaptureImage";
import { useVoiceCommand } from "@/hooks/useVoiceCommand";
import { isSpeakingRef } from "@/utils/speechState";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function DocumentScannerScreen() {
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

  useEffect(() => {
    Speech.speak(
      `Chào mừng bạn đến với NovaSight. 
      Ứng dụng hỗ trợ bạn với các chức năng như: 
      Đọc tài liệu, nhận diện tiền mặt, mô tả hình ảnh, nhận diện sản phẩm, nhận diện khuôn mặt, nhận diện hình ảnh, đăng ký khuôn mặt người thân. 
      Để ra lệnh bằng giọng nói, hãy nhấn giữ vào màn hình`,
      {
        language: "vi-VN",
        onStart: () => {
          setAllowedSendImage(false);
        },
        onDone: () => {
          setAllowedSendImage(true);
        },
        onError: () => {
          setAllowedSendImage(true);
        },
      }
    );
  }, []);

  useEffect(() => {
    if (voiceRoute && voiceRoute !== lastVoice.current) {
      router.replace(voiceRoute);
      lastVoice.current = voiceRoute;
    }
  }, [voiceRoute]);

  useAutoCaptureImage({
    cameraRef,
    isFocused,
    captureInterval: 10000,
    detectionType: "text",
    enabled: allowedSendImage,
  });

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
          facing="back"
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
            Place your document inside the frame
          </ThemedText>
        </View>
      </View>
    </Pressable>
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
