import type { Point } from '$lib/types';

export const GRID_WIDTH = 25;
export const GRID_HEIGHT = 16;

export const DEFAULT_START: Point = { x: 1, y: 8 };
export const DEFAULT_GOAL: Point = { x: GRID_WIDTH - 2, y: 7 };

/** An empty obstacle map: `walls[y][x]`. */
export function createWalls(width = GRID_WIDTH, height = GRID_HEIGHT): boolean[][] {
	return Array.from({ length: height }, () => Array.from({ length: width }, () => false));
}

export function samePoint(a: Point, b: Point): boolean {
	return a.x === b.x && a.y === b.y;
}

/**
 * Sprinkle random obstacles across the grid, always leaving the start and goal
 * cells free so the demo stays meaningful.
 */
export function randomWalls(
	start: Point,
	goal: Point,
	density = 0.28,
	width = GRID_WIDTH,
	height = GRID_HEIGHT
): boolean[][] {
	const walls = createWalls(width, height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const cell = { x, y };
			if (samePoint(cell, start) || samePoint(cell, goal)) continue;
			walls[y][x] = Math.random() < density;
		}
	}
	return walls;
}
