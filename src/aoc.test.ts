import { readFileSync } from "fs";

const example09 = `7,1
11,1
11,7
9,7
9,5
2,5
2,3
7,3`;

function parseInput09(input: string): { x: number; y: number }[] {
  return input.split("\n").map((line) => {
    const [x, y] = line.split(",").map(Number);
    return { x, y };
  });
}

function day09a(input: { x: number; y: number }[]): number {
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
