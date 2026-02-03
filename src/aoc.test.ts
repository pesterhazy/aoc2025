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

test("parseInput09", () => {
  const input = parseInput09(example09);
  expect(input.length).toBe(8);
});
