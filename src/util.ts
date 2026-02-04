import { Point2 } from "./types";

export function isPointInClosedPolygon(
  point: Point2,
  polygon: Point2[],
): boolean {
  const { x, y } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    // Check if point is exactly on the edge (closed polygon behavior)
    const onEdge =
      (y - yi) * (xj - xi) === (x - xi) * (yj - yi) &&
      x >= Math.min(xi, xj) &&
      x <= Math.max(xi, xj) &&
      y >= Math.min(yi, yj) &&
      y <= Math.max(yi, yj);

    if (onEdge) {
      return true;
    }

    // Ray-casting toggle
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
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
