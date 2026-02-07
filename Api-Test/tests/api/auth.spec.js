import request from "supertest";
import app from "../../src/app.js";

describe("auth", () => {
  it("rejects invalid login payload", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("BAD_REQUEST");
  });
});