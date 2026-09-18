/** Central metric calculations keep cards, charts, and exported data consistent. */
import type { Site } from "../types";
/** Format measurements with human-friendly precision without changing the underlying data. */
export const number = (value: number, digits = 0) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(
    value,
  );
/** Missing observations remain missing, never invented or reported as a measurement of zero. */
export function latest(site: Site) {
  return site.observations.at(-1);
}
/** Aggregate carbon by month; biodiversity is a simple mean of monitored sites (documented assumption). */
export function timeline(sites: Site[]) {
  const dates = [
    ...new Set(sites.flatMap((s) => s.observations.map((o) => o.date))),
  ].sort();
  return dates.map((date) => {
    const rows = sites.flatMap((s) =>
      s.observations.filter((o) => o.date === date),
    );
    return {
      date,
      carbon: rows.reduce((sum, o) => sum + o.carbon, 0),
      biodiversity:
        rows.reduce((sum, o) => sum + o.biodiversity, 0) / rows.length,
      canopy: rows.reduce((sum, o) => sum + o.canopy, 0) / rows.length,
    };
  });
}
/** Download currently displayed measurements as CSV, protecting text cells from spreadsheet formulas. */
export function exportSites(sites: Site[]) {
  const cell = (value: string | number) =>
    `"${String(value)
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""')}"`;
  const rows = [
    [
      "Site",
      "Date",
      "Carbon tCO2e",
      "Biodiversity score",
      "Canopy %",
      "Area ha",
    ],
    ...sites.flatMap((site) =>
      site.observations.map((o) => [
        site.name,
        o.date,
        o.carbon,
        o.biodiversity,
        o.canopy,
        site.area_ha,
      ]),
    ),
  ];
  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob([rows.map((row) => row.map(cell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    }),
  );
  link.download = "darukaa-observations.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}
