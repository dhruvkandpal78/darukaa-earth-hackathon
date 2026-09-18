/** Synthetic restoration sites make the preview inspectable without pretending to be field measurements. */
import type { Project, Site } from "../types";
import area from "@turf/area";

/** Build geographically plausible boundaries and repeatable monthly sample observations. */
function sampleSite(
  id: string,
  project: string,
  name: string,
  ecosystem: string,
  lng: number,
  lat: number,
  scale: number,
): Site {
  const geometry: Site["geometry"] = {
    type: "Polygon",
    coordinates: [
      [
        [lng, lat],
        [lng + 0.045, lat + 0.012],
        [lng + 0.064, lat + 0.053],
        [lng + 0.019, lat + 0.064],
        [lng - 0.012, lat + 0.026],
        [lng, lat],
      ],
    ],
  };
  return {
    id,
    project_id: project,
    name,
    ecosystem,
    geometry,
    area_ha: area(geometry) / 10000,
    observations: Array.from({ length: 12 }, (_, i) => ({
      date: `2025-${String(i + 1).padStart(2, "0")}-01`,
      carbon: Math.round((420 + i * 145 + Math.sin(i) * 45) * scale),
      biodiversity: Math.min(95, Math.round(48 + i * 2.5 + scale * 3)),
      canopy: Math.min(95, Math.round(45 + i * 2.1 + scale * 2)),
    })),
  };
}
export const demoProjects: Project[] = [
  {
    id: "p1",
    name: "Western Ghats Rewilding",
    region: "Karnataka, India",
    description:
      "Restoring connected forest habitats along one of the world’s most biodiverse mountain ranges.",
    category: "Forest restoration",
    created_at: "2025-01-12",
    sites: [
      sampleSite(
        "s1",
        "p1",
        "Agumbe Rainforest",
        "Tropical forest",
        75.08,
        13.5,
        2.2,
      ),
      sampleSite(
        "s2",
        "p1",
        "Kudremukh Corridor",
        "Tropical forest",
        75.28,
        13.12,
        1.6,
      ),
    ],
  },
  {
    id: "p2",
    name: "Sundarbans Blue Carbon",
    region: "West Bengal, India",
    description:
      "Protecting coastal resilience through the regeneration of mangrove ecosystems.",
    category: "Blue carbon",
    created_at: "2025-02-18",
    sites: [
      sampleSite(
        "s3",
        "p2",
        "Gosaba Mangrove Belt",
        "Mangrove",
        88.8,
        22.12,
        1.9,
      ),
      sampleSite("s4", "p2", "Satjelia Wetlands", "Wetland", 88.91, 22.19, 1.2),
    ],
  },
  {
    id: "p3",
    name: "Aravalli Green Corridor",
    region: "Rajasthan, India",
    description:
      "Reconnecting native woodland and supporting the return of local wildlife.",
    category: "Biodiversity",
    created_at: "2025-03-05",
    sites: [
      sampleSite("s5", "p3", "Sariska Woodland", "Woodland", 76.45, 27.29, 0.9),
    ],
  },
  {
    id: "p4",
    name: "Brahmaputra Living Lands",
    region: "Assam, India",
    description:
      "Reviving riverine grassland habitats for a healthier, more resilient landscape.",
    category: "Biodiversity",
    created_at: "2025-04-21",
    sites: [
      sampleSite(
        "s6",
        "p4",
        "Majuli Grasslands",
        "Grassland",
        94.15,
        26.96,
        1.1,
      ),
    ],
  },
];
