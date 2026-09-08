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
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6
      osc2.frequency.exponentialRampToValueAtTime(1567.98, ctx.currentTime + 0.15); // G6

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
      // Gentle warning buzz
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);

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
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanContainerId = "qr-attendance-reader";
  const cooldownRef = useRef(false);

  // Fetch available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id}` })));
          setSelectedCameraId(devices[0].id);
        }
      })
      .catch((err) => {
        console.warn("Could not list video devices:", err);
      });
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

  // Start Camera Scanner
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scanContainerId);
      }

      const cameraIdOrConfig = selectedCameraId
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: "environment" };

      await scannerRef.current.start(
        cameraIdOrConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScannedResult(decodedText);
        },
        (errorMessage) => {
          // ignore scan frame misses
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error("Camera start error:", err);
      setCameraError(
        err?.message || "Camera permission denied or camera unavailable. Try file upload or manual search."
      );
      setIsScanning(false);
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
            Employees scan their personal QR badge to register check-in and check-out in real-time.
          </p>
        </div>

        {/* Scan Mode Toggle */}
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
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl p-4 flex flex-col items-center justify-center min-h-[380px]">
            {/* Viewfinder Container */}
            <div className="relative w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700/80 flex items-center justify-center">
              <div id={scanContainerId} className="w-full h-full" />

              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 backdrop-blur-sm z-10">
                  <div className="w-16 h-16 rounded-2xl bg-clinic-500/10 border border-clinic-500/30 flex items-center justify-center mb-3 text-clinic-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Webcam Scanner Ready</h4>
                  <p className="text-xs text-slate-400 mb-4 max-w-[220px]">
                    Click Start Camera to activate the front desk QR scanner.
                  </p>
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-clinic-600 via-teal-600 to-emerald-600 hover:from-clinic-500 hover:to-emerald-500 text-white text-xs font-bold shadow-glow transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Live Camera</span>
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

            {/* Camera Controls */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 w-full max-w-[340px]">
              {isScanning ? (
                <button
                  onClick={stopCamera}
                  className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
                >
                  Stop Camera Scanner
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="w-full py-2.5 rounded-xl bg-clinic-600 hover:bg-clinic-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Turn On Camera
                </button>
              )}

              {/* Camera Switcher Dropdown */}
              {cameras.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    if (isScanning) {
                      stopCamera().then(() => startCamera());
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Error Message */}
            {cameraError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 max-w-[340px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Alternative Scan Methods: Image Upload & Quick ID Search */}
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-dark-card border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-clinic-400" />
              <span>Scan QR from Photo File</span>
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
