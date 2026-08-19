import type { Bay, Package, Point, Warehouse } from "$lib/types";

export const WAREHOUSE_WIDTH = 26;
export const WAREHOUSE_HEIGHT = 16;

/** Number of packages generated for a shift. */
export const PACKAGES_PER_SHIFT = 3;

/** The forklift parks at the bottom of the dock aisle between shifts. */
export const FORKLIFT_HOME: Point = { x: 1, y: WAREHOUSE_HEIGHT - 1 };

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function emptyFloor(): boolean[][] {
  return Array.from({ length: WAREHOUSE_HEIGHT }, () =>
    Array.from({ length: WAREHOUSE_WIDTH }, () => false),
  );
}

/**
 * The three loading bays sit in the dock column on the left wall.
 * Deliveries always terminate at one of these.
 */
export function createBays(): Bay[] {
  return [
    { id: "BAY-A", at: { x: 0, y: 2 } },
    { id: "BAY-B", at: { x: 0, y: 8 } },
    { id: "BAY-C", at: { x: 0, y: 13 } },
  ];
}

/**
 * Build the static shelf racks.
 *
 * The layout is a conventional warehouse: two-cell-deep racks separated by
 * single-cell picking aisles, with clear cross-aisles at the top, middle and
 * bottom so every aisle is reachable from the dock.
 */
export function createShelves(): boolean[][] {
  const shelves = emptyFloor();

  const CROSS_AISLES = new Set([0, 7, WAREHOUSE_HEIGHT - 1]);
  const RACK_START_X = 3;
  const RACK_END_X = WAREHOUSE_WIDTH - 2;

  for (let y = 0; y < WAREHOUSE_HEIGHT; y++) {
    // Horizontal cross-aisles stay completely clear.
    if (CROSS_AISLES.has(y)) continue;

    for (let x = RACK_START_X; x < RACK_END_X; x++) {
      // Racks are two cells deep, then one cell of picking aisle.
      if ((x - RACK_START_X) % 3 !== 2) shelves[y][x] = true;
    }
  }

  return shelves;
}

/** Every floor cell a forklift could legally stand on. */
function freeCells(shelves: boolean[][], bays: Bay[]): Point[] {
  const taken = new Set([
    `${FORKLIFT_HOME.x},${FORKLIFT_HOME.y}`,
    ...bays.map((b) => `${b.at.x},${b.at.y}`),
  ]);

  const cells: Point[] = [];
  for (let y = 0; y < WAREHOUSE_HEIGHT; y++) {
    for (let x = 0; x < WAREHOUSE_WIDTH; x++) {
      if (shelves[y][x]) continue;
      // Keep packages out on the floor rather than in the dock column.
      if (x < 2) continue;
      if (taken.has(`${x},${y}`)) continue;
      cells.push({ x, y });
    }
  }
  return cells;
}

/** Scatter packages across the picking aisles, each addressed to a random bay. */
export function createPackages(
  shelves: boolean[][],
  bays: Bay[],
  count = PACKAGES_PER_SHIFT,
): Package[] {
  const cells = freeCells(shelves, bays);
  const packages: Package[] = [];

  for (let i = 0; i < count && cells.length > 0; i++) {
    const index = Math.floor(Math.random() * cells.length);
    const [at] = cells.splice(index, 1);
    packages.push({
      id: `PKG-${i + 1}`,
      at,
      bayId: bays[Math.floor(Math.random() * bays.length)].id,
    });
  }

  return packages;
}

/** A fresh warehouse: fixed racks, fixed bays, randomly placed packages. */
export function createWarehouse(): Warehouse {
  const shelves = createShelves();
  const bays = createBays();
  return { shelves, bays, packages: createPackages(shelves, bays), forklift: FORKLIFT_HOME };
}

/** An empty floor plan, for users who want to draw their own racks. */
export function createEmptyWarehouse(): Warehouse {
  const shelves = emptyFloor();
  const bays = createBays();
  return { shelves, bays, packages: createPackages(shelves, bays), forklift: FORKLIFT_HOME };
}
