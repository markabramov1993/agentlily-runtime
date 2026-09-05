import { describe, it, expect } from "vitest";
import { InMemoryRuntimeStateStore } from "../../src/state/runtime-state.js";

describe("InMemoryRuntimeStateStore put/get round trips", () => {
  it("stores and retrieves a string value", async () => {
    const store = new InMemoryRuntimeStateStore();
    await store.put("key1", "value1");
    const result = await store.get<string>("key1");
    expect(result).toBe("value1");
  });

  it("stores and retrieves an object value", async () => {
    const store = new InMemoryRuntimeStateStore();
    const obj = { taskId: "t1", status: "running" };
    await store.put("taskState", obj);
    const result = await store.get<typeof obj>("taskState");
    expect(result).toEqual(obj);
  });

  it("returns undefined for non-existent keys", async () => {
    const store = new InMemoryRuntimeStateStore();
    const result = await store.get("missing");
    expect(result).toBeUndefined();
  });

  it("overwrites existing values on subsequent puts", async () => {
    const store = new InMemoryRuntimeStateStore();
    await store.put("counter", 1);
    await store.put("counter", 2);
    const result = await store.get<number>("counter");
    expect(result).toBe(2);
  });

  it("handles null and zero as valid stored values", async () => {
    const store = new InMemoryRuntimeStateStore();
    await store.put("nullVal", null);
    await store.put("zeroVal", 0);
    expect(await store.get("nullVal")).toBeNull();
    expect(await store.get("zeroVal")).toBe(0);
  });

  it("isolates keys across multiple put operations", async () => {
    const store = new InMemoryRuntimeStateStore();
    await store.put("a", "alpha");
    await store.put("b", "beta");
    await store.put("c", "gamma");
    expect(await store.get<string>("a")).toBe("alpha");
    expect(await store.get<string>("b")).toBe("beta");
    expect(await store.get<string>("c")).toBe("gamma");
  });

  it("evicts the oldest inserted key when maxEntries is exceeded", async () => {
    const store = new InMemoryRuntimeStateStore({ maxEntries: 2 });

    await store.put("oldest", 1);
    await store.put("middle", 2);
    await store.put("newest", 3);

    expect(await store.get("oldest")).toBeUndefined();
    expect(await store.get("middle")).toBe(2);
    expect(await store.get("newest")).toBe(3);
    expect(await store.keys()).toEqual(["middle", "newest"]);
    expect(await store.size()).toBe(2);
  });

  it("updating an existing key does not evict another entry", async () => {
    const store = new InMemoryRuntimeStateStore({ maxEntries: 2 });

    await store.put("a", 1);
    await store.put("b", 2);
    await store.put("a", 3);

    expect(await store.get("a")).toBe(3);
    expect(await store.get("b")).toBe(2);
    expect(await store.size()).toBe(2);
    expect(await store.keys()).toEqual(["a", "b"]);
  });

  it("delete returns true for existing keys and false for missing keys", async () => {
    const store = new InMemoryRuntimeStateStore();
    await store.put("session", { active: true });

    expect(await store.has("session")).toBe(true);
    expect(await store.delete("session")).toBe(true);
    expect(await store.has("session")).toBe(false);
    expect(await store.get("session")).toBeUndefined();
    expect(await store.delete("session")).toBe(false);
  });

  it("keys, size, has, and clear stay consistent across state transitions", async () => {
    const store = new InMemoryRuntimeStateStore();

    expect(await store.keys()).toEqual([]);
    expect(await store.size()).toBe(0);
    expect(await store.has("a")).toBe(false);

    await store.put("a", "alpha");
    await store.put("b", "beta");

    expect(await store.keys()).toEqual(["a", "b"]);
    expect(await store.size()).toBe(2);
    expect(await store.has("a")).toBe(true);
    expect(await store.has("b")).toBe(true);

    await store.clear();

    expect(await store.keys()).toEqual([]);
    expect(await store.size()).toBe(0);
    expect(await store.has("a")).toBe(false);
    expect(await store.has("b")).toBe(false);
    expect(await store.get("a")).toBeUndefined();
  });
});
