import { describe, it, expect } from "vitest";
import { eligibleFor, nextTurn, initialTurn } from "@/lib/chores/eligibility";

const nameOf = (id: string) => ({ a: "Robin", b: "Sky", c: "Max" })[id] ?? id;

describe("eligibleFor", () => {
  it("everyone is always allowed", () => {
    const s = {
      assignment: "everyone" as const,
      assigneeIds: [],
      currentTurnPersonId: null,
    };
    expect(eligibleFor(s, "a", nameOf).allowed).toBe(true);
  });

  it("specific allows only assignees", () => {
    const s = {
      assignment: "specific" as const,
      assigneeIds: ["a", "b"],
      currentTurnPersonId: null,
    };
    expect(eligibleFor(s, "a", nameOf).allowed).toBe(true);
    const locked = eligibleFor(s, "c", nameOf);
    expect(locked.allowed).toBe(false);
    expect(locked.reason).toBe("Not your chore");
  });

  it("rotating allows only the current turn and names who's up", () => {
    const s = {
      assignment: "rotating" as const,
      assigneeIds: ["a", "b"],
      currentTurnPersonId: "a",
    };
    expect(eligibleFor(s, "a", nameOf).allowed).toBe(true);
    const locked = eligibleFor(s, "b", nameOf);
    expect(locked.allowed).toBe(false);
    expect(locked.reason).toBe("Robin's turn");
  });
});

describe("nextTurn / initialTurn", () => {
  it("advances and wraps around the rotation", () => {
    expect(nextTurn(["a", "b", "c"], "a")).toBe("b");
    expect(nextTurn(["a", "b", "c"], "c")).toBe("a");
    expect(nextTurn([], "a")).toBeNull();
    expect(nextTurn(["a", "b"], null)).toBe("a");
  });

  it("keeps a valid current turn, else restarts at the first", () => {
    expect(initialTurn(["a", "b"], "b")).toBe("b");
    expect(initialTurn(["a", "b"], "c")).toBe("a"); // c no longer assigned
    expect(initialTurn(["a", "b"], null)).toBe("a");
    expect(initialTurn([], "a")).toBeNull();
  });
});
