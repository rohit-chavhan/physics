export type VehicleType = "commuter100" | "duke200" | "altoK10";
export type DriveState = "cruising" | "acceleration";

export const PHYSICS_CONSTANTS = { g: 9.81, rho: 1.225 } as const;

type VehicleParams = {
  label: string;
  massKerbKg: number;
  occupantKg: number;
  idleRpm: number;
  rpmAtMaxPower: number;
  pMaxKW: number;
  cdA_m2: number;
  crr: number;
  drivetrainEff: number;
  bte: number;
  bteLowLoadPenalty: number;
  parasiticKW: number;
  pEngineFloorW: number;
  accel_mps2: number;
  friction: { k0_W: number; k1_W_per_rpm: number; k2_W_per_rpm2: number };
  cooling: { baseW: number; slopeW: number; vExp: number };
};

export const VEHICLE_PARAMS: Record<VehicleType, VehicleParams> = {
  commuter100: {
    label: "100cc Air-Cooled Commuter",
    massKerbKg: 112,
    occupantKg: 75,
    idleRpm: 1200,
    rpmAtMaxPower: 8000,
    pMaxKW: 5.9,
    cdA_m2: 0.65,
    crr: 0.015,
    drivetrainEff: 0.96,
    bte: 0.2,
    bteLowLoadPenalty: 0.2,
    parasiticKW: 0.12,
    pEngineFloorW: 900,
    accel_mps2: 1.2,
    friction: { k0_W: 240, k1_W_per_rpm: 0.035, k2_W_per_rpm2: 0.00001 },
    cooling: { baseW: 2800, slopeW: 900, vExp: 0.8 }
  },
  duke200: {
    label: "200cc KTM Duke (Liquid-Cooled)",
    massKerbKg: 159,
    occupantKg: 75,
    idleRpm: 1500,
    rpmAtMaxPower: 10000,
    pMaxKW: 18.4,
    cdA_m2: 0.55,
    crr: 0.015,
    drivetrainEff: 0.96,
    bte: 0.24,
    bteLowLoadPenalty: 0.1,
    parasiticKW: 0.2,
    pEngineFloorW: 1100,
    accel_mps2: 1.6,
    friction: { k0_W: 180, k1_W_per_rpm: 0.015, k2_W_per_rpm2: 0.000002 },
    cooling: { baseW: 8500, slopeW: 1600, vExp: 0.75 }
  },
  altoK10: {
    label: "Maruti Alto K10 (AC ON)",
    massKerbKg: 790,
    occupantKg: 75,
    idleRpm: 800,
    rpmAtMaxPower: 5500,
    pMaxKW: 49,
    cdA_m2: 0.61,
    crr: 0.012,
    drivetrainEff: 0.85,
    bte: 0.27,
    bteLowLoadPenalty: 0.2,
    parasiticKW: 1.8,
    pEngineFloorW: 1700,
    accel_mps2: 1.0,
    friction: { k0_W: 650, k1_W_per_rpm: 0.05, k2_W_per_rpm2: 0.000004 },
    cooling: { baseW: 15000, slopeW: 4000, vExp: 0.9 }
  }
} as const;

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function kmhToMps(v: number): number {
  return v / 3.6;
}

export function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

export function rpmFromSpeed(vehicleType: VehicleType, speedKmh: number): {
  rpm: number;
  gearLabel: string;
} {
  const v = Math.max(0, speedKmh);
  const idleRpm = VEHICLE_PARAMS[vehicleType].idleRpm;
  let rpm = idleRpm;
  let gearLabel = "idle";

  if (vehicleType === "commuter100") {
    if (v < 17.49) {
      rpm = 320.0 * v;
      gearLabel = "1st";
    } else if (v < 24.1) {
      rpm = 171.5 * v;
      gearLabel = "2nd";
    } else if (v < 31.14) {
      rpm = 124.5 * v;
      gearLabel = "3rd";
    } else {
      rpm = 96.33 * v;
      gearLabel = "4th";
    }
  }

  if (vehicleType === "duke200") {
    if (v < 22.73) {
      rpm = 241.2 * v;
      gearLabel = "1st";
    } else if (v < 30.2) {
      rpm = 176.0 * v;
      gearLabel = "2nd";
    } else if (v < 37.95) {
      rpm = 132.4 * v;
      gearLabel = "3rd";
    } else if (v < 44.94) {
      rpm = 105.4 * v;
      gearLabel = "4th";
    } else if (v < 51.25) {
      rpm = 89.01 * v;
      gearLabel = "5th";
    } else {
      rpm = 78.04 * v;
      gearLabel = "6th";
    }
  }

  if (vehicleType === "altoK10") {
    if (v < 15.4) {
      rpm = 233.0 * v;
      gearLabel = "1st";
    } else if (v < 22.5) {
      rpm = 117.0 * v;
      gearLabel = "2nd";
    } else if (v < 40.9) {
      rpm = 80.0 * v;
      gearLabel = "3rd";
    } else if (v < 60.0) {
      rpm = 44.0 * v;
      gearLabel = "4th";
    } else {
      rpm = 30.0 * v;
      gearLabel = "5th";
    }
  }

  return { rpm: Math.max(rpm, idleRpm), gearLabel };
}

export function calculateVehicleMetrics(
  vehicleType: VehicleType,
  speedKmh: number,
  state: DriveState
): {
  rpm: number;
  gearLabel: string;
  thermalStressPct: number;
  mechanicalLoadPct: number;
  aerodynamicLoadPct: number;
  totalWorkloadPct: number;
} {
  const params = VEHICLE_PARAMS[vehicleType];
  const vKmh = Math.max(0, Math.min(120, speedKmh));
  const vMps = kmhToMps(vKmh);
  const m = params.massKerbKg + params.occupantKg;

  const F_rr = m * PHYSICS_CONSTANTS.g * params.crr;
  const F_aero = 0.5 * PHYSICS_CONSTANTS.rho * params.cdA_m2 * vMps ** 2;
  const F_inertia = state === "acceleration" ? m * params.accel_mps2 : 0;
  const F_total = F_rr + F_aero + F_inertia;

  const P_wheel_W = F_total * vMps;
  const { rpm, gearLabel } = rpmFromSpeed(vehicleType, vKmh);
  const P_fric_W =
    params.friction.k0_W +
    params.friction.k1_W_per_rpm * rpm +
    params.friction.k2_W_per_rpm2 * rpm ** 2;

  const P_engine_W_raw =
    P_wheel_W / params.drivetrainEff + params.parasiticKW * 1000 + P_fric_W;
  const P_engine_W = Math.max(P_engine_W_raw, params.pEngineFloorW);

  const uP = clamp01(P_engine_W / (params.pMaxKW * 1000));
  const bteEffRaw = params.bte * (1 - params.bteLowLoadPenalty * (1 - uP));
  const bteEff = clamp(bteEffRaw, 0.1, params.bte);

  const Q_waste_W = P_engine_W * (1 / bteEff - 1);
  const Q_cool_W = params.cooling.baseW + params.cooling.slopeW * vMps ** params.cooling.vExp;

  const thermalRaw = clamp01(Q_waste_W / Q_cool_W);
  const uR = clamp01((rpm / params.rpmAtMaxPower) ** 2);
  const mechanicalRaw = clamp01(0.7 * uP + 0.3 * uR);

  const F_aero_120 = 0.5 * PHYSICS_CONSTANTS.rho * params.cdA_m2 * (120 / 3.6) ** 2;
  const aeroRaw = clamp01(F_aero / F_aero_120);

  const s = clamp01(vKmh / 120);
  const wT = state === "cruising" ? lerp(0.72, 0.45, s) : lerp(0.55, 0.4, s);
  const wA = state === "cruising" ? lerp(0.08, 0.35, s) : lerp(0.1, 0.25, s);
  const wM = 1 - wT - wA;

  const totalRaw = clamp01(wT * thermalRaw + wM * mechanicalRaw + wA * aeroRaw);

  return {
    rpm: round1(rpm),
    gearLabel,
    thermalStressPct: round1(100 * thermalRaw),
    mechanicalLoadPct: round1(100 * mechanicalRaw),
    aerodynamicLoadPct: round1(100 * aeroRaw),
    totalWorkloadPct: round1(100 * totalRaw)
  };
}

export function runSanityCheck(): void {
  const speeds = [0, 20, 70, 120] as const;
  const states: DriveState[] = ["cruising", "acceleration"];
  const vehicles: VehicleType[] = ["commuter100", "duke200", "altoK10"];

  const rows: Array<
    ReturnType<typeof calculateVehicleMetrics> & {
      vehicle: VehicleType;
      state: DriveState;
      speedKmh: number;
    }
  > = [];

  for (const vehicle of vehicles) {
    for (const state of states) {
      for (const speedKmh of speeds) {
        rows.push({ vehicle, state, speedKmh, ...calculateVehicleMetrics(vehicle, speedKmh, state) });
      }
    }
  }

  console.table(
    rows.map((r) => ({
      vehicle: r.vehicle,
      state: r.state,
      v_kmh: r.speedKmh,
      gear: r.gearLabel,
      rpm: r.rpm,
      thermal: r.thermalStressPct,
      mech: r.mechanicalLoadPct,
      aero: r.aerodynamicLoadPct,
      total: r.totalWorkloadPct
    }))
  );

  const get = (vehicle: VehicleType, state: DriveState, speedKmh: number) => {
    for (const row of rows) {
      if (row.vehicle === vehicle && row.state === state && row.speedKmh === speedKmh) {
        return row;
      }
    }
    throw new Error(`Missing row for ${vehicle}/${state}/${speedKmh}`);
  };

  const c70 = get("commuter100", "cruising", 70).totalWorkloadPct;
  const d70 = get("duke200", "cruising", 70).totalWorkloadPct;
  const a70 = get("altoK10", "cruising", 70).totalWorkloadPct;
  const a20 = get("altoK10", "cruising", 20).totalWorkloadPct;
  const a120 = get("altoK10", "cruising", 120).totalWorkloadPct;

  const report = (label: string, ok: boolean, details: string) => {
    console.log(`${ok ? "PASS" : "FAIL"} | ${label} | ${details}`);
  };

  report("70 cruising commuter highest", c70 > d70 && c70 > a70, `commuter=${c70}, duke=${d70}, alto=${a70}`);
  report("70 cruising duke <= commuter-15", d70 <= c70 - 15, `delta=${round1(c70 - d70)}`);
  report("70 cruising alto near own minimum vs 20/120", a70 <= Math.min(a20, a120) + 8, `alto20=${a20}, alto70=${a70}, alto120=${a120}`);

  for (const vehicle of vehicles) {
    const aero120 = get(vehicle, "cruising", 120).aerodynamicLoadPct;
    report(`120 cruising aero~100 ${vehicle}`, Math.abs(aero120 - 100) <= 1, `aero120=${aero120}`);
  }

  for (const vehicle of vehicles) {
    for (const speedKmh of [20, 70, 120] as const) {
      const cruise = get(vehicle, "cruising", speedKmh).totalWorkloadPct;
      const accel = get(vehicle, "acceleration", speedKmh).totalWorkloadPct;
      report(`accel>=cruise ${vehicle}@${speedKmh}`, accel >= cruise, `cruise=${cruise}, accel=${accel}`);
    }
  }
}
