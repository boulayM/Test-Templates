import request from "supertest";
import app from "../../src/app.js";

describe("csrf", () => {
  it("returns a csrf token and cookie", async () => {
    const res = await request(app).get("/api/csrf");
    expect(res.status).toBe(200);
    expect(res.body.csrfToken).toBeDefined();
    const setCookie = res.headers["set-cookie"] || [];
    const hasCsrf = setCookie.some((c) => c.startsWith("csrfToken="));
    expect(hasCsrf).toBe(true);
  });
});