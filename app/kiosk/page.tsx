"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Delete, ScanFace, Utensils, X } from "lucide-react";
import { useRestro } from "@/lib/store";
import { Avatar, cx } from "@/components/ui";
import { ExperienceSwitcher } from "@/components/shell/AppShell";

type Phase = "idle" | "scanning" | "matched" | "pin" | "result";

export default function KioskPage() {
  const employees = useRestro((s) => s.employees);
  const attendance = useRestro((s) => s.attendance);
  const punchIn = useRestro((s) => s.punchIn);
  const punchOut = useRestro((s) => s.punchOut);

  const [phase, setPhase] = useState<Phase>("idle");
  const [matched, setMatched] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; name: string; action: "in" | "out" } | null>(null);
  const [clock, setClock] = useState("");
  const scanIdx = useRef(0);

  const today = new Date().toISOString().slice(0, 10);
  const active = employees.filter((e) => e.status === "active" && e.role !== "Owner");
  const isOnClock = (id: string) => attendance.some((a) => a.employeeId === id && a.date === today && a.clockIn && !a.clockOut);

  useEffect(() => {
    const t = setInterval(
      () =>
        setClock(
          new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        ),
      500,
    );
    return () => clearInterval(t);
  }, []);

  const startScan = () => {
    setPhase("scanning");
    // "recognize" a rotating employee for the demo
    const pool = active.filter((e) => !isOnClock(e.id));
    const target = (pool.length ? pool : active)[scanIdx.current % Math.max(1, (pool.length ? pool : active).length)];
    scanIdx.current++;
    setTimeout(() => {
      setMatched(target?.id ?? null);
      setPhase("matched");
    }, 2200);
  };

  const confirmPunch = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    const out = isOnClock(empId);
    const res = out ? punchOut(empId) : punchIn(empId, phase === "pin" ? "kiosk" : "face");
    setResult({ ok: res.ok, message: res.message, name: emp.name, action: out ? "out" : "in" });
    setPhase("result");
    setPin("");
    setTimeout(() => {
      setPhase("idle");
      setMatched(null);
      setResult(null);
    }, 3500);
  };

  const tryPin = (value: string) => {
    const emp = employees.find((e) => e.pin === value);
    if (emp) {
      confirmPunch(emp.id);
    } else {
      setPinError(true);
      setTimeout(() => {
        setPinError(false);
        setPin("");
      }, 700);
    }
  };

  const pressKey = (k: string) => {
    if (k === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) setTimeout(() => tryPin(next), 200);
  };

  const matchedEmp = matched ? employees.find((e) => e.id === matched) : null;

  return (
    <div className="min-h-dvh bg-inverse-surface flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 h-16 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-lg text-white/60 hover:bg-white/10 transition-colors" title="Back to dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white leading-tight">RestroOS Kiosk</p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Attendance Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ExperienceSwitcher compact />
          <p className="text-title-lg font-bold text-white tabular-nums hidden sm:block">{clock}</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-stretch min-h-0 overflow-y-auto custom-scrollbar">
        {/* Face scan area */}
        <section className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 gap-6 min-h-[420px]">
          {phase === "idle" && (
            <>
              <p className="text-white/60 text-body-lg text-center">Stand in front of the camera and tap to scan</p>
              <button
                onClick={startScan}
                className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-dashed border-white/20 flex items-center justify-center group hover:border-primary transition-colors"
              >
                <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <ScanFace className="w-20 h-20 text-white/40 group-hover:text-inverse-primary transition-colors" />
                </div>
              </button>
              <p className="text-white text-headline-md font-semibold text-center">Tap to Scan Face</p>
              <p className="text-white/40 text-body-md tabular-nums sm:hidden">{clock}</p>
            </>
          )}

          {phase === "scanning" && (
            <>
              <p className="text-inverse-primary text-body-lg font-semibold animate-pulse">Scanning…</p>
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-primary flex items-center justify-center overflow-hidden">
                <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-primary/10 flex items-center justify-center">
                  <ScanFace className="w-20 h-20 text-inverse-primary" />
                </div>
                <div className="absolute inset-x-0 h-1 bg-inverse-primary/80 shadow-[0_0_20px_4px_rgba(195,192,255,0.6)] animate-[scanline_1.1s_ease-in-out_infinite]" />
                <style>{`@keyframes scanline { 0%,100% { top: 12%; } 50% { top: 84%; } }`}</style>
              </div>
              <p className="text-white/50 text-body-md">Hold still — matching against staff profiles</p>
            </>
          )}

          {phase === "matched" && matchedEmp && (
            <div className="flex flex-col items-center gap-5 pop-in">
              <Avatar name={matchedEmp.name} color={matchedEmp.avatarColor} size="xl" />
              <div className="text-center">
                <p className="text-white text-headline-lg font-bold">{matchedEmp.name}</p>
                <p className="text-white/50 text-body-md">
                  {matchedEmp.role} • {matchedEmp.code}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => confirmPunch(matchedEmp.id)}
                  className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-body-lg flex items-center gap-2 active:scale-95 transition-transform shadow-xl shadow-primary/30"
                >
                  <Check className="w-5 h-5" />
                  {isOnClock(matchedEmp.id) ? "Clock Out" : "Clock In"}
                </button>
                <button
                  onClick={() => {
                    setPhase("idle");
                    setMatched(null);
                  }}
                  className="px-6 py-4 bg-white/10 text-white rounded-2xl font-bold flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <X className="w-5 h-5" /> Not me
                </button>
              </div>
            </div>
          )}

          {phase === "result" && result && (
            <div className="flex flex-col items-center gap-5 pop-in">
              <div
                className={cx(
                  "w-28 h-28 rounded-full flex items-center justify-center",
                  result.ok ? "bg-emerald-500/20" : "bg-red-500/20",
                )}
              >
                {result.ok ? <Check className="w-14 h-14 text-emerald-400" /> : <X className="w-14 h-14 text-red-400" />}
              </div>
              <p className="text-white text-headline-lg font-bold text-center max-w-md">{result.message}</p>
              {result.ok && (
                <p className="text-white/50 text-body-md">
                  {result.action === "in" ? "Have a great shift!" : "See you next time!"}
                </p>
              )}
            </div>
          )}

          {phase === "pin" && (
            <div className="flex flex-col items-center gap-6 w-full max-w-xs pop-in">
              <p className="text-white text-headline-md font-semibold">Enter your PIN</p>
              <div className={cx("flex gap-3", pinError && "animate-[shake_0.4s]")}>
                <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }`}</style>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cx(
                      "w-4 h-4 rounded-full border-2 transition-colors",
                      pinError ? "border-red-400 bg-red-400" : pin.length > i ? "border-inverse-primary bg-inverse-primary" : "border-white/30",
                    )}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 w-full">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, i) =>
                  k === "" ? (
                    <div key={i} />
                  ) : (
                    <button
                      key={i}
                      onClick={() => pressKey(k)}
                      className="h-16 rounded-2xl bg-white/5 hover:bg-white/15 text-white text-headline-md font-bold flex items-center justify-center active:scale-95 transition-all"
                    >
                      {k === "del" ? <Delete className="w-6 h-6" /> : k}
                    </button>
                  ),
                )}
              </div>
              <button onClick={() => setPhase("idle")} className="text-white/50 text-label-md font-semibold hover:text-white transition-colors">
                Back to face scan
              </button>
            </div>
          )}

          {(phase === "idle" || phase === "scanning") && (
            <button
              onClick={() => {
                setPhase("pin");
                setPin("");
              }}
              className="text-inverse-primary text-label-md font-bold hover:underline"
            >
              Use PIN instead
            </button>
          )}
        </section>

        {/* On-clock roster */}
        <aside className="lg:w-[340px] bg-black/20 border-t lg:border-t-0 lg:border-l border-white/10 p-5 sm:p-6 shrink-0">
          <h3 className="text-white font-bold text-title-lg mb-1">On the Clock</h3>
          <p className="text-white/40 text-label-md mb-5">
            {active.filter((e) => isOnClock(e.id)).length} of {active.length} staff working
          </p>
          <div className="space-y-2.5 max-h-[50vh] lg:max-h-none overflow-y-auto custom-scrollbar">
            {active.map((e) => {
              const on = isOnClock(e.id);
              const rec = attendance.find((a) => a.employeeId === e.id && a.date === today);
              return (
                <div key={e.id} className={cx("flex items-center gap-3 p-2.5 rounded-xl", on ? "bg-white/10" : "opacity-45")}>
                  <Avatar name={e.name} color={e.avatarColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-label-md font-semibold truncate">{e.name}</p>
                    <p className="text-white/40 text-label-sm truncate">{e.role}</p>
                  </div>
                  {on ? (
                    <span className="text-emerald-400 text-label-sm font-bold whitespace-nowrap">{rec?.clockIn}</span>
                  ) : (
                    <span className="text-white/30 text-label-sm">off</span>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </main>
    </div>
  );
}
