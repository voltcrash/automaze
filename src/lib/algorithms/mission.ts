import { aStar, manhattan } from '$lib/algorithms/astar';
import type { Leg, Mission, MissionTotals, Package, Point, Warehouse } from '$lib/types';

const EMPTY_TOTALS: MissionTotals = {
	pathCost: 0,
	nodesExpanded: 0,
	nodesVisited: 0,
	executionMs: 0,
	pathLength: 0,
	deliveries: 0,
	legs: 0
};

/**
 * Pick the next job: the unclaimed package closest to where the forklift is
 * standing, measured with the same Manhattan heuristic A* uses. This is the
 * agent's task-selection policy, kept deliberately simple and greedy.
 */
function nearestPackage(from: Point, remaining: Package[]): Package {
	let best = remaining[0];
	let bestDistance = manhattan(from, best.at);

	for (const candidate of remaining.slice(1)) {
		const distance = manhattan(from, candidate.at);
		if (distance < bestDistance) {
			best = candidate;
			bestDistance = distance;
		}
	}

	return best;
}

/**
 * Plan a full shift.
 *
 * Every package costs two legs — drive empty to the package, then carry it to
 * its loading bay — and each leg is a complete, independent A* search over the
 * static shelf layout. Planning runs to completion up front; the UI animates
 * the recorded traces afterwards, so what is drawn is the real search.
 */
export function planMission(warehouse: Warehouse): Mission {
	const legs: Leg[] = [];
	const unreachable: string[] = [];
	const totals: MissionTotals = { ...EMPTY_TOTALS };

	const remaining = [...warehouse.packages];
	let position = warehouse.forklift;

	while (remaining.length > 0) {
		const target = nearestPackage(position, remaining);
		remaining.splice(remaining.indexOf(target), 1);

		const bay = warehouse.bays.find((b) => b.id === target.bayId);
		if (!bay) continue;

		// Leg 1 — drive to the package.
		const pickup = aStar({ walls: warehouse.shelves, start: position, goal: target.at });
		totals.nodesExpanded += pickup.metrics.nodesExpanded;
		totals.nodesVisited += pickup.metrics.nodesVisited;
		totals.executionMs += pickup.metrics.executionMs;

		if (!pickup.found) {
			// Blocked in by shelves — skip it and carry on with the rest.
			unreachable.push(target.id);
			continue;
		}

		// Leg 2 — carry the package to its bay.
		const dropoff = aStar({ walls: warehouse.shelves, start: target.at, goal: bay.at });
		totals.nodesExpanded += dropoff.metrics.nodesExpanded;
		totals.nodesVisited += dropoff.metrics.nodesVisited;
		totals.executionMs += dropoff.metrics.executionMs;

		if (!dropoff.found) {
			unreachable.push(target.id);
			continue;
		}

		legs.push({
			kind: 'pickup',
			packageId: target.id,
			bayId: bay.id,
			from: position,
			to: target.at,
			result: pickup
		});
		legs.push({
			kind: 'dropoff',
			packageId: target.id,
			bayId: bay.id,
			from: target.at,
			to: bay.at,
			result: dropoff
		});

		totals.pathCost += pickup.metrics.pathCost + dropoff.metrics.pathCost;
		// The shared cell between two legs is only driven once.
		totals.pathLength += pickup.metrics.pathLength + dropoff.metrics.pathLength - 1;
		totals.deliveries += 1;
		totals.legs += 2;

		position = bay.at;
	}

	return { legs, totals, unreachable };
}
