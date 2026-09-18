/** Verify that portfolio calculations handle partial data without fabricating results. */
import { describe, expect, it } from "vitest";
import { timeline, latest } from "./analytics";
import { demoProjects } from "../data/demo";
describe("portfolio analytics", () => {
  it("totals monthly carbon and averages indices only for observed sites", () => {
    const first = structuredClone(demoProjects[0].sites[0]);
    const second = structuredClone(first);
    second.observations = [];
    second.id = "unmonitored";
    const results = timeline([first, second]);
    expect(results).toHaveLength(12);
    expect(results[0].carbon).toBe(first.observations[0].carbon);
    expect(results[0].biodiversity).toBe(first.observations[0].biodiversity);
    expect(latest(second)).toBeUndefined();
  });
  it("returns no measurements for an empty portfolio", () => {
    expect(timeline([])).toEqual([]);
  });
  it("adds multiple sites without double-counting dates", () => {
    const sites = demoProjects[0].sites;
    const result = timeline(sites);
    expect(result.at(-1)?.carbon).toBe(
      sites.reduce((sum, site) => sum + latest(site)!.carbon, 0),
    );
    expect(result.map((r) => r.date)).toEqual(
      [...result.map((r) => r.date)].sort(),
    );
  });
});
