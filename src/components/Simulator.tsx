"use client";

import { useMemo, useState } from "react";
import { MetricBar } from "@/components/MetricBar";
import {
  calculateVehicleMetrics,
  type DriveState,
  type VehicleType,
  VEHICLE_PARAMS
} from "@/lib/physicsCore";

const VEHICLE_ORDER: VehicleType[] = ["commuter100", "duke200", "altoK10"];

function dominantLabel(metrics: ReturnType<typeof calculateVehicleMetrics>): string {
  const pairs: Array<[string, number]> = [
    ["Thermal", metrics.thermalStressPct],
    ["Mechanical", metrics.mechanicalLoadPct],
    ["Aerodynamic", metrics.aerodynamicLoadPct]
  ];
  pairs.sort((a, b) => b[1] - a[1]);
  return `Mostly ${pairs[0][0]}`;
}

export function Simulator() {
  const [speedKmh, setSpeedKmh] = useState<number>(70);
  const [state, setState] = useState<DriveState>("cruising");

  const comparisons = useMemo(
    () =>
      VEHICLE_ORDER.map((vehicleType) => ({
        vehicleType,
        label: VEHICLE_PARAMS[vehicleType].label,
        metrics: calculateVehicleMetrics(vehicleType, speedKmh, state)
      })),
    [speedKmh, state]
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
        <h1 className="text-2xl font-semibold tracking-tight">Vehicle Load Simulator</h1>
        <p className="mt-2 text-sm text-slate-300">
          Compare all vehicles side-by-side at the same speed and drive state.
        </p>

        <div className="mt-6 grid gap-5">
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Vehicle</span>
            <select
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
            >
              {VEHICLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="flex items-center justify-between text-slate-300">
              <span>Speed</span>
              <span className="font-medium tabular-nums text-slate-100">{speedKmh} km/h</span>
            </span>
            <input
              type="range"
              min={0}
              max={120}
              step={1}
              value={speedKmh}
              onChange={(e) => setSpeedKmh(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </label>

          <div className="grid gap-2 text-sm">
            <span className="text-slate-300">Drive State</span>
            <div className="flex gap-2">
              <button
                onClick={() => setState("cruising")}
                className={`rounded-lg px-3 py-2 ${
                  state === "cruising"
                    ? "bg-cyan-500 text-slate-950"
                    : "border border-slate-700 bg-slate-950 text-slate-200"
                }`}
              >
                Cruising
              </button>
              <button
                onClick={() => setState("acceleration")}
                className={`rounded-lg px-3 py-2 ${
                  state === "acceleration"
                    ? "bg-cyan-500 text-slate-950"
                    : "border border-slate-700 bg-slate-950 text-slate-200"
                }`}
              >
                Acceleration
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-300">Gear</p>
            <p className="text-lg font-semibold">{metrics.gearLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-300">Engine RPM</p>
            <p className="text-lg font-semibold tabular-nums">{metrics.rpm.toFixed(0)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <MetricBar label="Thermal Stress" valuePct={metrics.thermalStressPct} colorClass="bg-rose-500" />
          <MetricBar
            label="Mechanical Load"
            valuePct={metrics.mechanicalLoadPct}
            colorClass="bg-amber-500"
          />
          <MetricBar
            label="Aerodynamic Load"
            valuePct={metrics.aerodynamicLoadPct}
            colorClass="bg-sky-500"
          />
          <MetricBar label="Total Workload" valuePct={metrics.totalWorkloadPct} colorClass="bg-emerald-500" />
        </div>

        <p className="mt-5 text-sm text-slate-300">
          At-a-glance: <span className="font-medium text-slate-100">{dominantLabel(metrics)}</span>
        </p>
      </section>
    </main>
  );
}
