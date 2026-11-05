/** Leonida districts on the Yanis V16 map, in u/v of public/map/yanis-*.jpg. Shared by the 3D scene, the picker and the rail. */
export const DISTRICTS: { name: string; sub: string; u: number; v: number }[] = [
  { name: "Vice City", sub: "downtown", u: 0.64, v: 0.5 }, { name: "Vice Beach", sub: "ocean drive", u: 0.85, v: 0.44 },
  { name: "Vice City Intl", sub: "airport", u: 0.55, v: 0.59 },
  { name: "Port Gellhorn", sub: "west coast", u: 0.26, v: 0.51 }, { name: "Ambrosia", sub: "sugar country", u: 0.53, v: 0.33 },
  { name: "Grassrivers", sub: "north west", u: 0.22, v: 0.28 }, { name: "Mount Kalaga", sub: "national park", u: 0.47, v: 0.18 },
  { name: "Everglades", sub: "gator country", u: 0.42, v: 0.66 }, { name: "South Leonida", sub: "down south", u: 0.62, v: 0.72 },
  { name: "Leonard Keys", sub: "island road", u: 0.45, v: 0.88 },
];
export function districtOf(u: number, v: number) {
  let best = DISTRICTS[0], bd = Infinity;
  for (const d of DISTRICTS) { const dd = (d.u - u) ** 2 + ((d.v - v) * 1.34) ** 2; if (dd < bd) { bd = dd; best = d; } }
  return best.name;
}
