/**
 * Knob mechanics shared by the 3D components.
 * Angle is in degrees of travel: 0 … TRAVEL (constrained, no endless spin).
 */
export const TRAVEL = 270;
export const START_DEG = -135; // where 0 % sits, measured clockwise from the back

export const valueToTravel = (v: number) => (v / 100) * TRAVEL;
export const travelToValue = (a: number) => Math.min(100, Math.max(0, (a / TRAVEL) * 100));
/** polar angle (rad) on the device, clockwise from -Z, for a value 0–100 */
export const valueToPolar = (v: number) => ((START_DEG + valueToTravel(v)) * Math.PI) / 180;

export interface KnobState {
  angle: number; // degrees of travel
  velocity: number; // deg/s
  dragging: boolean;
  target: number | null;
  source: 'knob' | 'slider' | 'keyboard';
  lastNotch: number;
}

export const createKnobState = (value: number): KnobState => ({
  angle: valueToTravel(value),
  velocity: 0,
  dragging: false,
  target: null,
  source: 'knob',
  lastNotch: Math.round(value / 10),
});
