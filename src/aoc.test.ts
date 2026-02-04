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

type CompressedPoints = {
  normalToCompressedX: Map<number, number>;
  normalToCompressedY: Map<number, number>;
  compressedToNormalX: Map<number, number>;
  compressedToNormalY: Map<number, number>;
};

function compressPoints(input: Point2[]): CompressedPoints {
  const xs = input.map((p) => p.x).sort((a, b) => a - b);
  const ys = input.map((p) => p.y).sort((a, b) => a - b);

  const normalToCompressedX = new Map<number, number>();
  const normalToCompressedY = new Map<number, number>();
  const compressedToNormalX = new Map<number, number>();
  const compressedToNormalY = new Map<number, number>();

  for (let i = 0; i < xs.length; i++) {
    normalToCompressedX.set(xs[i], i);
    compressedToNormalX.set(i, xs[i]);
  }

  for (let i = 0; i < ys.length; i++) {
    normalToCompressedY.set(ys[i], i);
    compressedToNormalY.set(i, ys[i]);
  }

  return {
    normalToCompressedX,
    normalToCompressedY,
    compressedToNormalX,
    compressedToNormalY,
  };
}

function invalidState(): never {
  throw new Error("invalid state");
}

function day09b(input: Point2[]): number {
  const compressed = compressPoints(input);
  let maxArea = -Infinity;
  for (let i = 0; i < input.length; i++) {
    for (let j = 0; j < input.length; j++) {
      if (i === j) continue;

      const point1 = input[i];
      const point3 = input[j];
      const point2 = { x: point1.x, y: point3.y };
      const point4 = { x: point3.x, y: point1.y };

      const p1c: Point2 = {
        x: compressed.normalToCompressedX.get(point1.x) ?? invalidState(),
        y: compressed.normalToCompressedY.get(point1.y) ?? invalidState(),
      };
      const p2c: Point2 = {
        x: compressed.normalToCompressedX.get(point2.x) ?? invalidState(),
        y: compressed.normalToCompressedY.get(point2.y) ?? invalidState(),
      };
      const p3c: Point2 = {
        x: compressed.normalToCompressedX.get(point3.x) ?? invalidState(),
        y: compressed.normalToCompressedY.get(point3.y) ?? invalidState(),
      };
      const p4c: Point2 = {
        x: compressed.normalToCompressedX.get(point4.x) ?? invalidState(),
        y: compressed.normalToCompressedY.get(point4.y) ?? invalidState(),
      };

      const path = [p1c, p2c, p3c, p4c];

      let pointOutside = false;
      for (let k = 0; k < path.length; k++) {
        const curc = path[k];
        const nextc = path[(k + 1) % path.length]; // wrap around

        const increment: Point2 = {
          x: Math.sign(nextc.x - curc.x),
          y: Math.sign(nextc.y - curc.y),
        };

        for (
          let c = curc;
          c.x !== nextc.x || c.y !== nextc.y;
          c = {
            x: c.x + increment.x,
            y: c.y + increment.y,
          }
        ) {
          const p: Point2 = {
            x: compressed.compressedToNormalX.get(c.x) ?? invalidState(),
            y: compressed.compressedToNormalY.get(c.y) ?? invalidState(),
          };
          if (!isPointInClosedPolygon(p, input)) {
            pointOutside = true;
            break;
          }
        }
        if (pointOutside) {
          break;
        }
      }
      if (pointOutside) {
        continue;
      }

      const area =
        (1 + Math.abs(point1.x - point3.x)) *
        (1 + Math.abs(point1.y - point3.y));
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
