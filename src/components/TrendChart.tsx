/** Chart.js renders inspectable time series; the accessible summary works without seeing the canvas. */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { Observation } from "../types";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
);
/** A single chart component makes site and portfolio trends use the same units and behavior. */
export default function TrendChart({
  rows,
  metric = "carbon",
}: {
  rows: Observation[];
  metric?: "carbon" | "biodiversity" | "canopy";
}) {
  const color =
    metric === "carbon"
      ? "#286a52"
      : metric === "biodiversity"
        ? "#b58b45"
        : "#749970";
  if (!rows.length)
    return (
      <div className="empty-chart">
        No observations yet. New sites start with an empty time series.
      </div>
    );
  return (
    <div
      className="chart-wrap"
      role="img"
      aria-label={`${metric} over ${rows.length} months. Latest value ${rows.at(-1)?.[metric]}.`}
    >
      <Line
        data={{
          labels: rows.map((r) =>
            new Date(r.date).toLocaleDateString("en", {
              month: "short",
              timeZone: "UTC",
            }),
          ),
          datasets: [
            {
              label:
                metric === "carbon"
                  ? "Carbon stored (tCO₂e)"
                  : `${metric} (${metric === "canopy" ? "%" : "/100"})`,
              data: rows.map((r) => r[metric]),
              borderColor: color,
              backgroundColor: `${color}15`,
              borderWidth: 2.5,
              fill: true,
              tension: 0.38,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointBackgroundColor: color,
            },
          ],
        }}
        options={{
          maintainAspectRatio: false,
          responsive: true,
          animation: {
            duration: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? 0
              : 700,
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#173f35",
              padding: 12,
              displayColors: false,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: { color: "#8b948d", font: { size: 10 } },
            },
            y: {
              min: 0,
              ...(metric !== "carbon" ? { max: 100 } : {}),
              border: { display: false },
              grid: { color: "#eff1ea" },
              ticks: { color: "#8b948d", font: { size: 10 }, maxTicksLimit: 5 },
            },
          },
          interaction: { intersect: false, mode: "index" },
        }}
      />
    </div>
  );
}
