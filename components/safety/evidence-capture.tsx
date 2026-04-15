"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSafety } from "@/lib/safety-context";
import {
  Camera,
  Mic,
  X,
  Image as ImageIcon,
  Trash2,
  Download,
  Play,
  Square,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EvidenceCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EvidenceCapture({ isOpen, onClose }: EvidenceCaptureProps) {
  const { evidence, captureEvidence, removeEvidence, logActivity } = useSafety();
  const [activeTab, setActiveTab] = useState<"capture" | "gallery">("capture");
  const [captureMode, setCaptureMode] = useState<"photo" | "audio">("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera access denied:", error);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        captureEvidence("image", imageData, `Photo captured at ${new Date().toLocaleString()}`);
        logActivity("evidence", "Photo evidence captured");
      }
    }
  }, [captureEvidence, logActivity]);

  // Start audio recording
  const startAudioRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          captureEvidence(
            "audio",
            reader.result as string,
            `Audio recorded for ${recordingTime} seconds`
          );
          logActivity("evidence", `Audio evidence captured (${recordingTime}s)`);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error("Microphone access denied:", error);
    }
  }, [captureEvidence, logActivity, recordingTime]);

  // Stop audio recording
  const stopAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Start camera when capture mode is photo
  useEffect(() => {
    if (isOpen && captureMode === "photo" && activeTab === "capture") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, captureMode, activeTab]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card rounded-xl border shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-chart-1" />
            <h2 className="text-lg font-semibold">Evidence Capture</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0">
          <button
            onClick={() => setActiveTab("capture")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === "capture"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Capture
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1",
              activeTab === "gallery"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Gallery
            {evidence.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {evidence.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "capture" && (
            <div className="space-y-4">
              {/* Mode toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCaptureMode("photo")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors",
                    captureMode === "photo"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <Camera className="w-4 h-4" />
                  Photo
                </button>
                <button
                  onClick={() => setCaptureMode("audio")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors",
                    captureMode === "audio"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <Mic className="w-4 h-4" />
                  Audio
                </button>
              </div>

              {/* Capture area */}
              {captureMode === "photo" ? (
                <div className="space-y-4">
                  <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {!cameraStream && (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <Camera className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={capturePhoto}
                    size="lg"
                    className="w-full"
                    disabled={!cameraStream}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Photo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-square max-w-64 mx-auto flex flex-col items-center justify-center bg-muted rounded-xl">
                    <div
                      className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center transition-all",
                        isRecording
                          ? "bg-destructive text-destructive-foreground animate-pulse"
                          : "bg-primary/10"
                      )}
                    >
                      <Mic
                        className={cn(
                          "w-10 h-10",
                          isRecording ? "" : "text-primary"
                        )}
                      />
                    </div>
                    {isRecording && (
                      <div className="mt-4 flex items-center gap-2 text-destructive">
                        <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                        <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={isRecording ? stopAudioRecording : startAudioRecording}
                    size="lg"
                    className={cn(
                      "w-full",
                      isRecording && "bg-destructive hover:bg-destructive/90"
                    )}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  <strong>Tip:</strong> All evidence is stored locally and encrypted.
                  Use this to document incidents for legal purposes.
                </p>
              </div>
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="space-y-3">
              {evidence.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No evidence captured yet</p>
                  <p className="text-sm">Use the Capture tab to record evidence.</p>
                </div>
              ) : (
                evidence.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border bg-card"
                  >
                    <div className="flex items-start gap-3">
                      {item.type === "image" ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img
                            src={item.data}
                            alt="Evidence"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Mic className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {item.type === "image" ? "Photo" : "Audio Recording"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(item.timestamp)}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {item.type === "audio" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const audio = new Audio(item.data);
                              audio.play();
                            }}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = item.data;
                            a.download = `evidence_${item.type}_${item.timestamp}`;
                            a.click();
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEvidence(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
