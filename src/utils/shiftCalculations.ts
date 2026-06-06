export interface ShiftCalcParams {
  loginTime: Date;
  logoutTime: Date | null;
  breakMinutes: number;
}

export function calculateShiftStats({ loginTime, logoutTime, breakMinutes }: ShiftCalcParams) {
  if (!logoutTime) {
    return {
      workedMinutes: 0,
      overtimeMinutes: 0,
      formattedWorked: "0h 0m",
      formattedOvertime: "0h 0m",
      isComplete: false
    };
  }

  const durationMs = logoutTime.getTime() - loginTime.getTime();
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  
  // Net worked minutes
  const netWorkedMinutes = Math.max(0, totalMinutes - breakMinutes);
  
  // Standard full time shift = 8 hours = 480 minutes
  const STANDARD_SHIFT_MINUTES = 480;
  
  const overtimeMinutes = Math.max(0, netWorkedMinutes - STANDARD_SHIFT_MINUTES);
  
  return {
    workedMinutes: netWorkedMinutes,
    overtimeMinutes: overtimeMinutes,
    formattedWorked: formatMinutes(netWorkedMinutes),
    formattedOvertime: formatMinutes(overtimeMinutes),
    isComplete: true
  };
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
