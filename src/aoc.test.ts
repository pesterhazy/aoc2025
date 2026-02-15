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

  // Cache polygon membership tests
  const insideCache = new Map<string, boolean>();
  const checkInside = (p: Point2): boolean => {
    const key = `${p.x},${p.y}`;
    if (insideCache.has(key)) {
      return insideCache.get(key)!;
    }
    const result = isPointInClosedPolygon(p, input);
    insideCache.set(key, result);
    return result;
  };

  for (let i = 0; i < input.length; i++) {
    for (let j = i + 1; j < input.length; j++) {
      const point1 = input[i];
      const point3 = input[j];
      const point2 = { x: point1.x, y: point3.y };
      const point4 = { x: point3.x, y: point1.y };

      // Check corners first - fast rejection
      if (
        !checkInside(point1) ||
        !checkInside(point2) ||
        !checkInside(point3) ||
        !checkInside(point4)
      ) {
        continue;
      }

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
        const nextc = path[(k + 1) % path.length];

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
          if (!checkInside(p)) {
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

test("day09b input", () => {
  const input = parseInput09(readFileSync("inputs/day09.txt", "utf8"));
  const result = day09b(input);
  assert.equal(result, 1539809693);
}, 60_000);

const example10 = `[.##.] (3) (1,3) (2) (2,3) (0,2) (0,1) {3,5,4,7}
[...#.] (0,2,3,4) (2,3) (0,4) (0,1,2) (1,2,3,4) {7,5,12,7,2}
[.###.#] (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2) {10,11,11,5,10,5}`;

type Input10 = {
  goalState: number;
  buttons: number[];
  joltage: number[];
  configs: number[][];
};

function parseInput10(input: string): Input10[] {
  return input.split("\n").map((line) => {
    const segments = line.split(" ");
    const first = segments[0];
    const last = segments[segments.length - 1];
    const rest = segments.slice(1, segments.length - 1);

    const binaryString = first
      .slice(1, -1)
      .replaceAll(".", "0")
      .replaceAll("#", "1");
    const numDigits = binaryString.length;
    const goalState = parseInt(binaryString, 2);
    const buttons = rest.map((s) => {
      const numbers = s.match(/\d+/g);
      if (numbers === null) {
        throw new Error(`Invalid input: ${s}`);
      }

      let v = 0;

      for (const number of numbers) {
        const shifts = numDigits - 1 - Number(number);
        v |= 1 << shifts;
      }

      return v;
    });
    const configs = rest.map((s) => {
      const numbers = s.match(/\d+/g);
      if (numbers === null) {
        throw new Error(`Invalid input: ${s}`);
      }

      return numbers.map((number) => Number(number));
    });
    const joltage = last.match(/\d+/g);
    if (joltage === null) {
      throw new Error(`Invalid input: ${last}`);
    }

    return {
      goalState,
      buttons,
      configs,
      joltage: joltage.map(Number),
    };
  });
}

function solve10a(input: Input10): number {
  if (input.goalState === 0) {
    return 0;
  }

  const options: Set<number> = new Set();
  for (const button of input.buttons) {
    options.add(button);
  }

  const seen: Set<string> = new Set();

  function recurse(path: number[]): number {
    const key = path.toSorted().join(",");
    if (seen.has(key)) {
      return Infinity;
    }
    seen.add(key);

    let answer = Infinity;
    for (const option of [...options]) {
      options.delete(option);

      const v = path.reduce((a, b) => a ^ b, 0);

      if (v === input.goalState) {
        options.add(option);

        return path.length;
      }
      const result = recurse([...path, option]);
      answer = Math.min(answer, result);
      options.add(option);
    }
    return answer;
  }

  return recurse([]);
}

function day10a(input: Input10[]): number {
  return input.map(solve10a).reduce((a, b) => a + b, 0);
}

test("parseInput10", () => {
  const input = parseInput10(example10);
  assert.equal(input.length, 3);
  assert.equal(input[0].goalState, 0b0110);
  assert.deepEqual(
    input[0].buttons,
    [0b0001, 0b0101, 0b0010, 0b0011, 0b1010, 0b1100],
  );
  assert.deepEqual(input[0].joltage, [3, 5, 4, 7]);
});

test("solve10 example", () => {
  const input = parseInput10(example10);
  const result = solve10a(input[0]);
  assert.equal(result, 2);
});

test("day10a example", () => {
  const input = parseInput10(example10);
  const result = day10a(input);
  assert.equal(result, 7);
});

test("day10a input", () => {
  const input = parseInput10(readFileSync("inputs/day10.txt", "utf8"));
  const result = day10a(input);
  assert.equal(result, 475);
});

function solve10b(input: Input10) {
  let best = Infinity;
  const bestSoFar: Map<string, number> = new Map();
  function recurse(n: number, state: number[]): number {
    if (n >= best) {
      return Infinity;
    }
    const key = JSON.stringify(state);
    if (bestSoFar.has(key) && bestSoFar.get(key)! <= n) {
      return Infinity;
    }
    bestSoFar.set(key, n);

    if (state.every((i) => i === 0)) {
      best = Math.min(best, n);
      return best;
    }
    if (state.some((i) => i < 0)) return Infinity;

    let results: number[] = [];
    for (const config of input.configs) {
      let newState = [...state];
      for (const num of config) {
        newState[num]--;
      }
      results.push(recurse(n + 1, newState));
    }
    const result = Math.min(...results);
    return result;
  }

  return recurse(0, input.joltage);
}

function day10b(inputs: Input10[]) {
  return inputs.map(solve10b).reduce((a, b) => a + b, 0);
}

test("solve10b example", () => {
  const input = parseInput10(example10);
  const result = solve10b(input[0]);
  assert.equal(result, 10);
});

test.skip("day10b input", () => {
  const input = parseInput10(readFileSync("inputs/day10.txt", "utf8"));
  const result = day10b(input);
  assert.equal(result, 42);
});
