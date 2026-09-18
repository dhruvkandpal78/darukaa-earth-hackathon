/** Shared record shapes keep the map, charts, forms, and API speaking the same language. */
import type { Polygon } from "geojson";
export interface Observation {
  date: string;
  carbon: number;
  biodiversity: number;
  canopy: number;
}
export interface Site {
  id: string;
  project_id: string;
  name: string;
  ecosystem: string;
  geometry: Polygon;
  area_ha: number;
  observations: Observation[];
}
export interface Project {
  id: string;
  name: string;
  region: string;
  description: string;
  category: string;
  created_at: string;
  sites: Site[];
}
export interface User {
  id: string;
  name: string;
  email: string;
}
export type NewProject = Pick<
  Project,
  "name" | "region" | "description" | "category"
>;
export type NewSite = Pick<Site, "name" | "ecosystem" | "geometry">;
