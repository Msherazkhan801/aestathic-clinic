"use client";

import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import { Employee, AttendanceRecord } from "@/types";
import {
  Camera,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Sparkles,
  RefreshCw,
  Search,
  Upload,
  Volume2,
  VolumeX,
  ShieldCheck,
  Zap,
  HelpCircle,
  Play,
  RotateCcw,
} from "lucide-react";

// Web Audio API Sound Generator for Real-Time Feedback
function playAudioChime(type: "success" | "error") {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "success") {
      // Pleasant double-chime (D5 -> G5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1567.98, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    } else {
      // Warning buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.log("Audio notification skipped:", e);
  }
}

interface QrAttendanceScannerProps {
  onScanSuccess?: (record: AttendanceRecord, emp: Employee) => void;
}

export function QrAttendanceScanner({ onScanSuccess }: QrAttendanceScannerProps) {
  const { employees, recordQrAttendance } = useData();
  const { showToast } = useToast();

  const [scanMode, setScanMode] = useState<"auto" | "check-in" | "check-out">("auto");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);

  // Last punch result
  const [lastPunch, setLastPunch] = useState<{
    success: boolean;
    employee?: Employee;
    message: string;
    time: string;
    actionType: "check-in" | "check-out" | "already-completed" | "error";
  } | null>(null);

  // Manual fallback search
  const [manualQuery, setManualQuery] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanContainerId = "qr-attendance-reader";
  const cooldownRef = useRef(false);

  // Load available camera devices
  const loadCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(
          devices.map((d, idx) => ({
            id: d.id,
            label:
              d.label ||
              (idx === 0 ? "Camera 1 (Main / Back)" : idx === 1 ? "Camera 2 (Front / Selfie)" : `Camera ${idx + 1}`),
          }))
        );
      }
    } catch (err) {
      console.warn("Could not list video devices initially:", err);
    }
  };

  useEffect(() => {
    loadCameras();
  }, []);

  // Handle scanned payload
  const handleScannedResult = (decodedText: string) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;

    const res = recordQrAttendance(decodedText, scanMode);

    if (res.success && res.employee) {
      if (soundEnabled) playAudioChime("success");
      setLastPunch({
        success: true,
        employee: res.employee,
        message: res.message,
        time: res.time,
        actionType: res.actionType,
      });

      showToast(
        res.actionType === "check-in" ? "Staff Checked In" : "Staff Checked Out",
        `${res.employee.name} (${res.employee.designation}) - ${res.time}`,
        "success"
      );

      if (onScanSuccess && res.record) {
        onScanSuccess(res.record, res.employee);
      }
    } else {
      if (soundEnabled) playAudioChime("error");
      setLastPunch({
        success: false,
        message: res.message,
        time: res.time,
        actionType: "error",
      });
      showToast("Scan Error", res.message, "error");
    }

    // 2.5 second cooldown between automatic scans to prevent double-punching
    setTimeout(() => {
      cooldownRef.current = false;
    }, 2500);
  };

  // Start Camera Scanner with target facingMode
  const startCamera = async (targetFacing: "environment" | "user" = cameraFacing, targetDeviceId?: string) => {
    setCameraError(null);
    setShowPermissionHelp(false);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scanContainerId);
      }

      // If already scanning, stop first
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        setIsScanning(false);
      }

      const scanConfig = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      let started = false;

      // 1. If explicit deviceId was passed or selected
      const deviceIdToUse = targetDeviceId || (selectedCameraId && selectedCameraId !== "AUTO" ? selectedCameraId : null);
      if (deviceIdToUse) {
        try {
          await scannerRef.current.start(
            deviceIdToUse,
            scanConfig,
            (decodedText) => handleScannedResult(decodedText),
            () => {}
          );
          started = true;
        } catch (devErr) {
          console.warn("DeviceId start failed, falling back to facingMode:", devErr);
        }
      }

      // 2. Try requested facingMode
      if (!started) {
        try {
          await scannerRef.current.start(
            { facingMode: targetFacing },
            scanConfig,
            (decodedText) => handleScannedResult(decodedText),
            () => {}
          );
          started = true;
        } catch (faceErr) {
          console.warn(`FacingMode ${targetFacing} failed, trying opposite:`, faceErr);
        }
      }

      // 3. Fallback to opposite facingMode (e.g. if environment failed on laptop, use user)
      if (!started) {
        const oppositeFacing = targetFacing === "environment" ? "user" : "environment";
        try {
          await scannerRef.current.start(
            { facingMode: oppositeFacing },
            scanConfig,
            (decodedText) => handleScannedResult(decodedText),
            () => {}
          );
          setCameraFacing(oppositeFacing);
          started = true;
        } catch (oppErr) {
          console.warn("Opposite facingMode failed, trying generic video:", oppErr);
        }
      }

      // 4. Last resort: simple device list first camera
      if (!started && cameras.length > 0) {
        await scannerRef.current.start(
          cameras[0].id,
          scanConfig,
          (decodedText) => handleScannedResult(decodedText),
          () => {}
        );
        started = true;
      }

      setIsScanning(true);
      loadCameras(); // refresh device list once camera access is granted
    } catch (err: any) {
      console.error("Camera start error:", err);
      const isDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError" ||
        String(err?.message || "").toLowerCase().includes("permission") ||
        String(err?.message || "").toLowerCase().includes("denied");

      const isNotFound =
        err?.name === "NotFoundError" ||
        err?.name === "OverconstrainedError" ||
        String(err?.message || "").toLowerCase().includes("not found");

      if (isDenied) {
        setCameraError("Camera permission blocked by browser. Please allow camera access in your browser address bar.");
        setShowPermissionHelp(true);
      } else if (isNotFound) {
        setCameraError("No webcam found matching this setting. Try switching between Back and Front Camera.");
      } else {
        setCameraError(err?.message || "Unable to start webcam. Please ensure no other app (e.g. Zoom/FaceTime) is using your camera.");
      }
      setIsScanning(false);
    }
  };

  // Flip Camera between Back and Front
  const handleFlipCamera = async () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    setSelectedCameraId("AUTO");

    if (isScanning) {
      await startCamera(nextFacing);
    } else {
      await startCamera(nextFacing);
    }
  };

  // Select Back Camera
  const handleSelectBackCamera = async () => {
    setCameraFacing("environment");
    setSelectedCameraId("AUTO");
    if (isScanning) {
      await startCamera("environment");
    }
  };

  // Select Front Camera
  const handleSelectFrontCamera = async () => {
    setCameraFacing("user");
    setSelectedCameraId("AUTO");
    if (isScanning) {
      await startCamera("user");
    }
  };

  // Stop Camera Scanner
  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.warn("Error stopping camera:", err);
        setIsScanning(false);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop();
          }
        } catch {}
      }
    };
  }, []);

  // Handle Image File Upload Fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-file-temp");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScannedResult(decodedText);
    } catch (err: any) {
      if (soundEnabled) playAudioChime("error");
      showToast("No QR Code Detected", "Please upload a clear image of the employee QR badge.", "error");
    } finally {
      e.target.value = "";
    }
  };

  // Manual Quick Tap
  const handleManualPunch = (emp: Employee) => {
    handleScannedResult(emp.employeeId);
    setManualQuery("");
  };

  const filteredManualEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(manualQuery.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(manualQuery.toLowerCase()) ||
      e.designation.toLowerCase().includes(manualQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-dark-card to-slate-900 border border-slate-700/80 shadow-glass-dark">
        <div>
          <div className="flex items-center gap-2 text-clinic-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Smart Attendance Scanner</span>
          </div>
          <h3 className="text-xl font-extrabold text-white font-display">
            Front Desk QR Attendance Terminal
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Scan employee QR badges via <strong>Back Camera (Rear)</strong> or <strong>Front Camera</strong>.
          </p>
        </div>

        {/* Scan Mode & Sound Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          {(
            [
              { key: "auto", label: "Auto Smart" },
              { key: "check-in", label: "Check-In" },
              { key: "check-out", label: "Check-Out" },
            ] as const
          ).map((m) => (
            <button
              key={m.key}
              onClick={() => setScanMode(m.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                scanMode === m.key
                  ? "bg-gradient-to-r from-clinic-600 to-teal-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {m.label}
            </button>
          ))}

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
            title={soundEnabled ? "Mute audio chime" : "Enable audio chime"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center Column: Camera Viewfinder & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl p-4 flex flex-col items-center justify-center min-h-[390px]">
            {/* Camera Facing Selector Pills */}
            <div className="w-full max-w-[340px] flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSelectBackCamera}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    cameraFacing === "environment"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Back Camera</span>
                </button>
                <button
                  onClick={handleSelectFrontCamera}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    cameraFacing === "user"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Front Camera</span>
                </button>
              </div>

              {/* Quick Flip Button */}
              <button
                onClick={handleFlipCamera}
                title="Flip Camera (Back ↔ Front)"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-clinic-400 hover:text-clinic-300 border border-slate-800 transition-all flex items-center gap-1 text-xs font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Flip</span>
              </button>
            </div>

            {/* Viewfinder Container */}
            <div className="relative w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700/80 flex items-center justify-center">
              <div id={scanContainerId} className="w-full h-full" />

              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 backdrop-blur-sm z-10">
                  <div className="w-16 h-16 rounded-2xl bg-clinic-500/10 border border-clinic-500/30 flex items-center justify-center mb-3 text-clinic-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    {cameraFacing === "environment" ? "Back Camera Ready" : "Front Camera Ready"}
                  </h4>
                  <p className="text-xs text-slate-400 mb-4 max-w-[240px]">
                    Click Start Camera to scan employee QR badges.
                  </p>
                  <button
                    onClick={() => startCamera(cameraFacing)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-clinic-600 via-teal-600 to-emerald-600 hover:from-clinic-500 hover:to-emerald-500 text-white text-xs font-bold shadow-glow transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start {cameraFacing === "environment" ? "Back Camera" : "Front Camera"}</span>
                  </button>
                </div>
              )}

              {/* Animated Laser Scanning Line when camera is active */}
              {isScanning && (
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 z-20">
                  {/* Corner Targets */}
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-clinic-400 rounded-tl-lg" />
                    <div className="w-6 h-6 border-t-2 border-r-2 border-clinic-400 rounded-tr-lg" />
                  </div>
                  {/* Laser Beam */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse my-auto" />
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-b-2 border-l-2 border-clinic-400 rounded-bl-lg" />
                    <div className="w-6 h-6 border-b-2 border-r-2 border-clinic-400 rounded-br-lg" />
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls & Device Dropdown */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 w-full max-w-[340px]">
              {isScanning ? (
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={stopCamera}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
                  >
                    Stop Camera
                  </button>
                  <button
                    onClick={handleFlipCamera}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Switch</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startCamera(cameraFacing)}
                  className="w-full py-2.5 rounded-xl bg-clinic-600 hover:bg-clinic-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Turn On {cameraFacing === "environment" ? "Back Camera" : "Front Camera"}</span>
                </button>
              )}

              {/* Hardware Camera Device Dropdown Selector */}
              {cameras.length > 1 && (
                <div className="w-full mt-1">
                  <label className="block text-[10px] text-slate-400 font-medium mb-1">
                    Select Camera Hardware Device:
                  </label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedCameraId(newId);
                      if (isScanning) {
                        startCamera(cameraFacing, newId === "AUTO" ? undefined : newId);
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs focus:outline-none focus:border-clinic-500"
                  >
                    <option value="AUTO">Auto Detect ({cameraFacing === "environment" ? "Back Camera" : "Front Camera"})</option>
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Error Message & Browser Permission Guide */}
            {cameraError && (
              <div className="mt-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2 max-w-[340px]">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <p className="font-bold">Camera Access Issue</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">{cameraError}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/90 border border-amber-500/30 text-[11px] text-amber-300/90 space-y-1">
                  <p className="font-bold flex items-center gap-1 text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Check Active Apps:</span>
                  </p>
                  <p>• Make sure you are <strong>not using Zoom, Microsoft Teams, Google Meet, FaceTime, or Skype</strong> in the background.</p>
                  <p>• If another app or browser tab is using your camera, close it and click <strong>Turn On Camera</strong>.</p>
                  <p>• Or tap <strong>Snap with Mobile Camera</strong> below to take a quick photo without webcam locking.</p>
                </div>

                {showPermissionHelp && (
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-rose-500/20 text-[11px] text-slate-300 space-y-1">
                    <p className="font-bold text-rose-300">How to Enable Camera Permission:</p>
                    <p>1. Look at the left side of your browser URL bar (near <code className="text-white">localhost</code>).</p>
                    <p>2. Tap/Click the <strong>Lock 🔒 / Settings / Camera 📷</strong> icon.</p>
                    <p>3. Set <strong>Camera</strong> to <strong>Allow</strong>.</p>
                    <p>4. Refresh the page and start the camera.</p>
                  </div>
                )}
              </div>
            )}

            {/* Always visible Camera in-use reminder tip */}
            {!cameraError && (
              <div className="w-full max-w-[340px] mt-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <span className="font-semibold text-slate-300">Tip:</span> Make sure your camera is not being used by <strong>Zoom, Teams, or FaceTime</strong>. If camera is occupied, use <strong>Snap with Mobile Camera</strong> or <strong>Manual Punch</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Alternative Scan Methods: Phone Camera Snap, Image Upload & Instant Simulator */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <label className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-clinic-600/20 hover:bg-clinic-600/30 border border-clinic-500/40 text-clinic-300 hover:text-white text-xs font-bold cursor-pointer transition-all shadow-sm">
                <Camera className="w-4 h-4 text-clinic-400" />
                <span>Snap with Mobile Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <label className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-dark-card border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Upload from Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Hidden container for file scan processing */}
              <div id="qr-file-temp" className="hidden" />
            </div>

            {/* One-Click QR Badge Test Simulator */}
            <div className="p-3.5 rounded-2xl bg-dark-card border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-emerald-400" />
                  <span>Instant QR Badge Simulator (One-Click Test)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">No camera needed</span>
              </div>
              <p className="text-[11px] text-slate-400 font-light mb-2.5">
                Select an employee below to test the exact QR badge scan and attendance punch:
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {employees.slice(0, 6).map((emp) => (
                  <button
                    key={emp.employeeId}
                    onClick={() => handleScannedResult(emp.employeeId)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 text-[11px] font-medium transition-all"
                  >
                    {emp.name.replace("Dr. ", "")} ({emp.employeeId.toUpperCase()})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Punch Feedback & Manual Fallback (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Real-time Punch Feedback Card */}
          <div className="rounded-3xl bg-dark-card border border-slate-700/80 p-5 shadow-glass-dark">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-clinic-400" />
              <span>Latest Attendance Punch</span>
            </h4>

            {lastPunch ? (
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  lastPunch.success
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-rose-500/10 border-rose-500/30"
                }`}
              >
                {lastPunch.success && lastPunch.employee ? (
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md">
                      {lastPunch.employee.name.replace("Dr. ", "").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="text-sm font-bold text-white truncate">
                          {lastPunch.employee.name}
                        </h5>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lastPunch.actionType === "check-in"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          }`}
                        >
                          {lastPunch.actionType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {lastPunch.employee.designation} • ID: {lastPunch.employee.employeeId.toUpperCase()}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{lastPunch.message}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 text-rose-300 text-xs">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Scan Unsuccessful</p>
                      <p className="text-slate-300 mt-0.5">{lastPunch.message}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-slate-800 rounded-2xl">
                <QrCode className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No badge scanned yet today</p>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">
                  Point employee QR card at the camera to record attendance
                </p>
              </div>
            )}
          </div>

          {/* Quick Manual Tap Fallback */}
          <div className="rounded-3xl bg-dark-card border border-slate-700/80 p-5 shadow-glass-dark">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Search className="w-4 h-4 text-clinic-400" />
                <span>Manual Punch Fallback</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">If badge missing</span>
            </div>

            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                placeholder="Search staff by name or ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-clinic-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {filteredManualEmployees.slice(0, 5).map((emp) => (
                <div
                  key={emp.employeeId}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{emp.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {emp.designation} • {emp.employeeId.toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleManualPunch(emp)}
                    className="px-2.5 py-1 rounded-lg bg-clinic-600/20 hover:bg-clinic-600 text-clinic-300 hover:text-white border border-clinic-500/30 text-[11px] font-bold transition-all shrink-0"
                  >
                    Punch
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
