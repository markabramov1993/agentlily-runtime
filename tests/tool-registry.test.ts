import { describe, expect, it } from "vitest";
import { RuntimeError, ToolRegistry } from "../src/index.js";

describe("ToolRegistry", () => {
  it("prevents duplicate tool names with correct error code and details", () => {
    const registry = new ToolRegistry();
    const tool = {
      name: "echo",
      description: "Echo tool",
      execute() {
        return "ok";
      }
    };

    registry.register(tool);

    try {
      registry.register(tool);
      expect.fail("should have thrown");
    } catch (e) {
      const err = e as RuntimeError;
      expect(err).toBeInstanceOf(RuntimeError);
      expect(err.code).toBe("DUPLICATE_TOOL");
      expect(err.details?.toolName).toBe("echo");
      expect(err.message).toMatch(/already registered/);
    }
  });

  it("allows registering different tools with distinct names", () => {
    const registry = new ToolRegistry();
    registry.register({ name: "a", description: "A", execute: () => "a" });
    registry.register({ name: "b", description: "B", execute: () => "b" });
    expect(registry.list()).toHaveLength(2);
  });

  it("unregister removes exactly the named tool and get then reports TOOL_NOT_FOUND", () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "echo",
      description: "Echo tool",
      execute: () => "ok"
    });
    registry.register({
      name: "other",
      description: "Other tool",
      execute: () => "other"
    });

    expect(registry.size()).toBe(2);
    expect(registry.unregister("echo")).toBe(true);
    expect(registry.has("echo")).toBe(false);
    expect(registry.has("other")).toBe(true);
    expect(registry.size()).toBe(1);

    try {
      registry.get("echo");
      expect.fail("should have thrown");
    } catch (e) {
      const err = e as RuntimeError;
      expect(err).toBeInstanceOf(RuntimeError);
      expect(err.code).toBe("TOOL_NOT_FOUND");
      expect(err.details?.toolName).toBe("echo");
    }
  });

  it("unregister returns false for an unknown tool without changing size", () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "echo",
      description: "Echo tool",
      execute: () => "ok"
    });

    expect(registry.unregister("missing")).toBe(false);
    expect(registry.size()).toBe(1);
    expect(registry.has("echo")).toBe(true);
  });

  it("clear empties the registry and resets size and list", () => {
    const registry = new ToolRegistry();
    registry.register({ name: "a", description: "A", execute: () => "a" });
    registry.register({ name: "b", description: "B", execute: () => "b" });

    expect(registry.size()).toBe(2);
    expect(registry.list()).toHaveLength(2);

    registry.clear();

    expect(registry.size()).toBe(0);
    expect(registry.list()).toEqual([]);
    expect(registry.has("a")).toBe(false);
    expect(registry.has("b")).toBe(false);
  });
});
