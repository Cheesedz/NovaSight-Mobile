import { CameraView } from "expo-camera";
import { useEffect, useRef } from "react";

const DETECTION_TYPE_TO_ROUTE = {
  text: "/document_recognition",
  money: "/currency_detection",
  item: "/image_captioning",
  product: "/product_recognition",
  distance: "/distance_estimate",
  add_face: "/face_detection/register",
  face: "/face_detection/recognize",
};

export function useAutoCaptureImage({
  cameraRef,
  isFocused,
  captureInterval = 5000,
  detectionType,
}: {
  cameraRef: React.RefObject<CameraView | null>;
  isFocused: boolean;
  captureInterval?: number;
  detectionType: keyof typeof DETECTION_TYPE_TO_ROUTE;
}) {
  const hasCapturedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function sendRawImageToServer(imageUri: string) {
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: `${detectionType}.jpg`,
    } as any);

    try {
      const response = await fetch(
        `${process.env.EXPO_BASE_URL}${DETECTION_TYPE_TO_ROUTE[detectionType]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      const result = await response.json();
      console.log("Model response:", result);
    } catch (err) {
      console.error("Failed to send image:", err);
    }
  }

  useEffect(() => {
    if (isFocused && !hasCapturedRef.current) {
      hasCapturedRef.current = true;
      intervalRef.current = setInterval(async () => {
        try {
          if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({
              skipProcessing: true,
            });
            await sendRawImageToServer(photo.uri);
          }
        } catch (err) {
          console.error("Auto-capture failed:", err);
        }
      }, captureInterval);
    } else if (!isFocused) {
      hasCapturedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isFocused, cameraRef, captureInterval, detectionType]);
}
