import { formatZodError } from "../../src/utils/validate.js";

describe("formatZodError", () => {
  it("returns a stable payload", () => {
    const err = {
      issues: [{ path: ["email"], message: "Invalid email" }]
    };
    const payload = formatZodError(err);
    expect(payload.code).toBe("BAD_REQUEST");
    expect(payload.details[0].path).toBe("email");
  });
});