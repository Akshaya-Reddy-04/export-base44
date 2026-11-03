import React, { useEffect, useRef, useState } from "react";
import { Video, VideoOff } from "lucide-react";

// Uses the browser's native BarcodeDetector where available (Chrome / Android),
// so staff can scan a student pass with the device camera. Falls back to the
// typeable pass code input when the browser cannot decode.
export default function QrCamera({ onDetect, active }) {
  const videoRef = useRef(null);
  const [supported] = useState(() => typeof window !== "undefined" && "BarcodeDetector" in window);
  const [error, setError] = useState("");
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!on || !active || !supported) return undefined;
    let stream;
    let timer;
    let cancelled = false;

    const start = async () => {
      try {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        timer = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) onDetect?.(codes[0].rawValue);
          } catch {
            /* single frame failures are normal while the camera focuses */
          }
        }, 700);
      } catch (err) {
        setError("Camera unavailable — type the pass code instead.");
      }
    };

    start();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [on, active, supported, onDetect]);

  if (!supported) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[10.5px] text-muted-foreground">
        This browser cannot read QR codes from the camera. Use a USB/Bluetooth scanner or type the pass code below.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-white">Camera scan</span>
        <button
          type="button"
          onClick={() => setOn((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-2.5 py-1 text-[10.5px] text-slate-300 hover:border-neon/40 hover:text-neon"
        >
          {on ? <VideoOff className="h-3 w-3" /> : <Video className="h-3 w-3" />}
          {on ? "Stop camera" : "Start camera"}
        </button>
      </div>
      {on && (
        <video ref={videoRef} muted playsInline className="mt-2 h-40 w-full rounded-lg border border-white/10 object-cover" />
      )}
      {error && <p className="mt-1.5 text-[10px] text-ember">{error}</p>}
      <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
        Point the camera at the student's pass. Codes are also accepted from a handheld scanner.
      </p>
    </div>
  );
}