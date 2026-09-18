import { describe, expect, it } from "vitest";
import { ROOM_VIDEOS, roomVideoFor } from "../shared/roomVideos";
import { routeToTheme } from "../shared/themes";
import { parseRoomVideoMap, roomVideosPayload } from "./_core/roomVideos";

describe("the twelve HeyGen rooms", () => {
  it("names all twelve tiles with their placement and file", () => {
    expect(ROOM_VIDEOS.map((v) => v.room)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const v of ROOM_VIDEOS) expect(v.file).toMatch(/^rcs-heygen-[a-z]+-(3m|90s)-v1\.mp4$/);
  });

  it("places each tile where the shot list says, and never on a quiet page", () => {
    const at = (p: string) => roomVideoFor(routeToTheme(p), p);
    expect(at("/portal/tax-brackets")).toBe("tax");
    expect(at("/portal/time-machine")).toBe("prediction");
    expect(at("/portal/mortgage-killer")).toBe("engines");
    expect(at("/portal/welcome")).toBe("relief");
    expect(at("/portal/my-journey")).toBe("journey");
    expect(at("/portal/trusts")).toBe("estate");
    expect(at("/portal/the-mirror")).toBe("observatory");
    expect(at("/portal/dashboard")).toBe("cockpit");
    expect(at("/portal/command-center")).toBe("cockpit");
    expect(at("/portal/client-snapshot")).toBe("intake");
    expect(at("/pricing")).toBe("public");
    expect(at("/shared/abc")).toBeNull(); // quiet: the Ivory tile is a decision for the artifact, not the page
    for (const p of ["/login", "/portal/billing", "/portal/compliance", "/portal/document-vault", "/404", "/portal/site-health"]) expect(at(p), p).toBeNull();
    expect(at("/portal/clients")).toBeNull(); // Quiet Luxury outside intake carries no face
  });

  it("only accepts https URLs for known rooms from the host setting", () => {
    expect(parseRoomVideoMap(undefined)).toEqual({});
    expect(parseRoomVideoMap("not json")).toEqual({});
    expect(parseRoomVideoMap(JSON.stringify({ engines: "https://cdn.example/rcs-heygen-engines-3m-v1.mp4", bogus: "https://x", tax: "http://insecure", cover: 5 }))).toEqual({ engines: "https://cdn.example/rcs-heygen-engines-3m-v1.mp4" });
    // the HELOC before-and-after pair are slots, not rooms, and ride the same setting
    expect(parseRoomVideoMap(JSON.stringify({ "heloc-before": "https://a/before.mp4", "heloc-after": "https://a/after.mp4" }))).toEqual({ "heloc-before": "https://a/before.mp4", "heloc-after": "https://a/after.mp4" });
    expect(roomVideosPayload({ ROOM_VIDEO_URLS: '{"tax":"https://a/b.mp4"}' } as NodeJS.ProcessEnv)).toEqual({ urls: { tax: "https://a/b.mp4" }, posters: {} });
  });
});
