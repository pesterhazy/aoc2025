import { Point2 } from "./types";

export function isPointInClosedPolygon(
  point: Point2,
  polygon: Point2[],
): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const pi = polygon[i];
    const pj = polygon[j];

    // Check if point is on the edge
    if (isPointOnSegment(point, pi, pj)) {
      return true;
    }

    // Ray casting: check if horizontal ray from point to the right crosses edge (pi, pj)
    const yi = pi.y;
    const yj = pj.y;
    const xi = pi.x;
    const xj = pj.x;

    // Check if edge crosses the horizontal line through point
    if (yi > point.y !== yj > point.y) {
      // Calculate x-coordinate of intersection point
      const xIntersect = ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

      // If intersection is to the right of the point, toggle inside
      if (point.x < xIntersect) {
        inside = !inside;
      }
    }
  }

  return inside;
}
export function isPointOnSegment(
  point: Point2,
  p1: Point2,
  p2: Point2,
): boolean {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  if (dx === 0 && dy === 0) {
    return point.x === p1.x && point.y === p1.y;
  }

  // Check if point is collinear with p1 and p2 using cross product
  const crossProduct = (point.y - p1.y) * dx - (point.x - p1.x) * dy;
  if (Math.abs(crossProduct) > 1e-10) {
    return false;
  }

  // Check if point is within the bounding box of the segment
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  return (
    point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
  );
}
