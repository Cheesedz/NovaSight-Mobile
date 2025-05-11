import { isSpeakingRef } from "@/utils/speechState";
import { AudioModule, RecordingPresets, useAudioRecorder } from "expo-audio";
import * as Speech from "expo-speech";
import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

type VoiceCommand =
  | "text"
  | "money"
  | "item"
  | "product"
  | "distance"
  | "add_face"
  | "face";

const COMMAND_TO_PATH = {
  text: "/",
  money: "/money",
  item: "/image",
  product: "/qr",
  distance: "/distance",
  add_face: "/add-face",
  face: "/scan-face",
} as const;

const COMMAND_TO_SPEECH = {
  text: "Nhận diện văn bản",
  money: "Nhận diện tiền mặt",
  item: "Giải thích hình ảnh",
  product: "Nhận diện sản phẩm thông qua mã vạch",
  distance: "Tìm kiếm vị trí của một vật thể và khoảng cách từ vị trí hiện tại",
  add_face: "Đăng ký nhận diện khuôn mặt với người thân, bạn bè của tôi",
  face: "Nhận diện khuôn mặt",
};

type Path = (typeof COMMAND_TO_PATH)[VoiceCommand];

export function useVoiceCommand() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const busyRef = useRef(false);
  const [route, setRoute] = useState<Path>("/");

  const speakSafely = (text: string) => {
    isSpeakingRef.current = true;
    Speech.speak(text, {
      language: "vi-VN",
      onDone: () => {
        isSpeakingRef.current = false;
      },
      onStopped: () => {
        isSpeakingRef.current = false;
      },
      onError: () => {
        isSpeakingRef.current = false;
      },
    });
  };

  const processVoiceCommand = async (uri: string): Promise<string> => {
    try {
      const transcription = await getTranscription(uri);
      return await classifyCommand(transcription);
    } catch (err) {
      console.error("Voice command processing failed", err);
      return "text";
    }
  };

  const getTranscription = async (audioUri: string): Promise<string> => {
    const apiKey = process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY;
    const fileUri = audioUri.startsWith("file://")
      ? audioUri
      : `file://${audioUri}`;

    // 1) grab the blob from the local file
    const fileRes = await fetch(fileUri);
    if (!fileRes.ok) {
      console.error(
        "DEBUG failed to fetch local file:",
        fileRes.status,
        fileRes.statusText
      );
      return "";
    }
    const blob = await fileRes.blob();
    console.log("DEBUG blob type/size:", blob.type, blob.size);

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&language=vi&smart_format=true",
      {
        method: "POST",
        headers: {
          "Content-Type": "audio/m4a",
          Authorization: `Token ${apiKey}`,
        },
        body: blob,
      }
    );

    const json = await response.json();
    console.debug(
      "Transcription response:",
      json?.results?.channels?.[0]?.alternatives?.[0]?.transcript
    );
    return json?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  };

  const classifyCommand = async (text: string): Promise<string> => {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            Bạn là trợ lý AI chuyên xử lý các yêu cầu từ văn bản chuyển đổi từ giọng nói.
            Dựa trên nội dung của yêu cầu, hãy trả về ID duy nhất của hành động phù hợp nhất từ danh sách dưới đây:

            - 'text' - Nhận diện văn bản.
            - 'money' - Nhận diện tiền mặt.
            - 'item' - Giải thích hình ảnh.
            - 'product' - Nhận diện sản phẩm thông qua mã vạch.
            - 'distance' - Tìm kiếm vị trí của một vật thể và khoảng cách từ vị trí hiện tại.
            - 'add_face' - Đăng ký nhận diện khuôn mặt với người thân, bạn bè của tôi.
            - 'face' - Nhận diện khuôn mặt.

            Quy tắc:
            - Chỉ trả về ID duy nhất. Không thêm bất kỳ văn bản nào khác.
            - Nếu yêu cầu không chắc chắn hoặc không rõ ràng, hãy trả về 'text' làm mặc định.
            - Ưu tiên trả về ID chính xác nhất dựa trên ngữ cảnh của yêu cầu.
            - Nếu không có ID phù hợp trong danh sách, hãy trả về 'text'.
          `,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.2,
      max_tokens: 50,
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.debug("AI response:", data?.choices?.[0]?.message?.content?.trim());
    return data?.choices?.[0]?.message?.content?.trim() ?? "text";
  };

  const startListening = async () => {
    if (busyRef.current || isSpeakingRef.current || audioRecorder.isRecording)
      return;
    busyRef.current = true;

    try {
      console.log("Starting recording...");
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      console.error("Start record failed", err);
      busyRef.current = false;
    }
  };

  const stopListening = async () => {
    try {
      console.log("Stopping recording...");
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) {
        const cmd = await processVoiceCommand(uri);
        if (cmd in COMMAND_TO_PATH) {
          setRoute(COMMAND_TO_PATH[cmd as VoiceCommand]);
          speakSafely(
            `Đang thực hiện chức năng ${
              COMMAND_TO_SPEECH[cmd as VoiceCommand]
            }. Hãy đưa camera về phía đối tượng cần nhận diện.`
          );
        }
      }
    } catch (err) {
      console.error("Stop record failed", err);
    } finally {
      busyRef.current = false;
    }
  };

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Microphone permission denied");
      }
    })();
  }, []);

  return { route, startListening, stopListening };
}
