import { readFileSync } from "fs";
import { isPointInClosedPolygon } from "./util";
import { Point2 } from "./types";

const example09 = `7,1
11,1
11,7
9,7
9,5
2,5
2,3
7,3`;

function parseInput09(input: string): Point2[] {
  return input.split("\n").map((line) => {
    const [x, y] = line.split(",").map(Number);
    return { x, y };
  });
}

function day09a(input: Point2[]): number {
  let maxArea = -Infinity;
  for (let i = 0; i < input.length; i++) {
    for (let j = 0; j < input.length; j++) {
      if (i === j) continue;

      const area =
        (1 + Math.abs(input[i].x - input[j].x)) *
        (1 + Math.abs(input[i].y - input[j].y));
      if (area > maxArea) {
        maxArea = area;
      }
    }
  }
  return maxArea;
}

function day09b(input: Point2[]): number {
  let maxArea = -Infinity;
  for (let i = 0; i < input.length; i++) {
    for (let j = 0; j < input.length; j++) {
      if (i === j) continue;

      const p1 = input[i];
      const p2 = input[j];
      const p3 = { x: p1.x, y: p2.y };
      const p4 = { x: p2.x, y: p1.y };

      // Check if the other two corners are inside/on the polygon
      if (
        !isPointInClosedPolygon(p3, input) ||
        !isPointInClosedPolygon(p4, input)
      ) {
        continue;
      }

      const area = (1 + Math.abs(p1.x - p2.x)) * (1 + Math.abs(p1.y - p2.y));
      if (area > maxArea) {
        maxArea = area;
      }
    }
  }
  return maxArea;
}

test("isPointInClosedPolygon", () => {
  assert.equal(
    isPointInClosedPolygon({ x: 0, y: 0 }, [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]),
    true,
  );
  assert.equal(
    isPointInClosedPolygon({ x: 0.5, y: 0.5 }, [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]),
    true,
  );
  assert.equal(
    isPointInClosedPolygon({ x: 2, y: 2 }, [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]),
    false,
  );
});

test("day09 example", () => {
  const input = parseInput09(example09);
  const result = day09a(input);
  assert.equal(result, 50);
});

test("day09 input", () => {
  const input = parseInput09(readFileSync("inputs/day09.txt", "utf8"));
  const result = day09a(input);
  assert.equal(result, 4771508457);
});

test("day09b example", () => {
  const input = parseInput09(example09);
  const result = day09b(input);
  assert.equal(result, 24);
});

test.skip("day09b input", () => {
  const input = parseInput09(readFileSync("inputs/day09.txt", "utf8"));
  const result = day09b(input);
  assert.equal(result, "???" as unknown);
});
