import { isSpeakingRef } from "@/utils/speechState";
import { CameraView } from "expo-camera";
import * as Speech from "expo-speech";
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

const MAP_DETECTION_RESULT_KEY: Partial<
  Record<keyof typeof DETECTION_TYPE_TO_ROUTE, string>
> = {
  text: "text",
  money: "total_money",
  item: "description",
  product: "description",
  distance: "description",
  add_face: "description",
  face: "description",
};

const MAP_LEADING_TEXT: Partial<
  Record<keyof typeof DETECTION_TYPE_TO_ROUTE, string>
> = {
  text: "Văn bản có nội dung như sau: ",
  money: "Tiền mặt có mệnh giá là: ",
  item: "Hình ảnh trước mặt bạn là: ",
  product: "Sản phẩm có tên là: ",
  distance: "Khoảng cách là: ",
  add_face: "Đăng ký khuôn mặt thành công. ",
  face: "Trước mặt bạn là: ",
};

export function useAutoCaptureImage({
  cameraRef,
  isFocused,
  captureInterval = 10000,
  detectionType,
  enabled = true,
  onImageCaptured,
}: {
  cameraRef: React.RefObject<CameraView | null>;
  isFocused: boolean;
  captureInterval?: number;
  detectionType: keyof typeof DETECTION_TYPE_TO_ROUTE;
  enabled?: boolean;
  onImageCaptured?: (imageUri: string) => void;
}) {
  const hasCapturedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const capturedImageRef = useRef<string | null>(null);

  async function sendRawImageToServer(
    imageUri: string,
    extraFormData?: Record<string, string>
  ) {
    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: `${detectionType}.jpg`,
    } as any);

    let endpoint = `${process.env.EXPO_PUBLIC_BASE_SERVER_URL}${DETECTION_TYPE_TO_ROUTE[detectionType]}`;

    if (extraFormData) {
      console.log("Extra form data:", extraFormData);
      endpoint = endpoint.concat("?");
      for (const key in extraFormData) {
        endpoint = endpoint.concat(`${key}=${extraFormData[key]}&`);
      }
    }

    try {
      console.log("API URL:", endpoint);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const result = await response.json();
      console.log("Model response:", result.text);
      Speech.speak(
        `${MAP_LEADING_TEXT[detectionType]} ${
          result[MAP_DETECTION_RESULT_KEY[detectionType] as string] ??
          JSON.stringify(result)
        }`,
        {
          language: "vi-VN",
          onStart: () => {
            isSpeakingRef.current = true;
          },
          onDone: () => {
            isSpeakingRef.current = false;
            isProcessingRef.current = false;
          },
          onError: () => {
            isSpeakingRef.current = false;
            isProcessingRef.current = false;
          },
        }
      );
    } catch (err) {
      console.error("Failed to send image:", err);
      isProcessingRef.current = false;
    }
  }

  const submitCapturedImage = async (extraData: Record<string, string>) => {
    if (capturedImageRef.current) {
      await sendRawImageToServer(capturedImageRef.current, extraData);
    }
  };

  useEffect(() => {
    if (isFocused && !hasCapturedRef.current && enabled) {
      hasCapturedRef.current = true;

      const interval = setInterval(async () => {
        const camera = cameraRef.current;
        if (!camera || isProcessingRef.current || isSpeakingRef.current) return;
        isProcessingRef.current = true;
        try {
          const photo = await camera.takePictureAsync({ skipProcessing: true });
          capturedImageRef.current = photo.uri;

          if (detectionType === "add_face" && onImageCaptured) {
            onImageCaptured(photo.uri);
            isProcessingRef.current = true;
          } else {
            await sendRawImageToServer(photo.uri);
          }
          console.log("Captured image", photo.uri);
        } catch (err) {
          console.error("Capture error", err);
        }
      }, captureInterval);
      return () => {
        if (interval) clearInterval(interval);
        hasCapturedRef.current = false;
      };
    }
  }, [isFocused, cameraRef, captureInterval, detectionType, enabled]);

  return {
    submitCapturedImage,
  };
}
