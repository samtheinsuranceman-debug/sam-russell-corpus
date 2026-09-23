/**
 * Image generation — Replicate, fal, Stability AI and OpenAI, network mocked.
 *
 * Proves the owner's order, the key names (REPLICATE_API_TOKEN or the
 * REPLICATE_API_KEY already on Railway), each provider's request shape, that
 * results land in the firm's bucket rather than a data URL, and that a
 * China-linked model id is refused before any request is built.
 */
import { describe, expect, it, vi } from "vitest";
import { CHINA_POLICY_MESSAGE, ChinaPolicyError } from "@shared/aiProviders";
import {
  ImageGenerationError,
  configuredImageProviders,
  generateImage,
  imageProviderStatus,
  resolveImageModel,
  sniffImageType,
  type ImageDeps,
} from "./imageGenerator";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);

type Call = { url: string; init: RequestInit };

function harness(env: Record<string, string>, respond: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const stored: Array<{ key: string; data: Buffer; contentType: string }> = [];
  const deps: ImageDeps = {
    env,
    fetch: (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return respond(String(url), init ?? {});
    }) as typeof fetch,
    put: (async (key: string, data: Buffer | Uint8Array | string, contentType?: string) => {
      stored.push({ key, data: Buffer.from(data as Buffer), contentType: contentType ?? "" });
      return { key: `${key}_abc12345`, url: `/files/${key}_abc12345` };
    }) as ImageDeps["put"],
    signedUrl: (async (key: string) => `https://bucket.example.com/${key}?sig=1`) as ImageDeps["signedUrl"],
    sleep: async () => undefined,
  };
  return { deps, calls, stored };
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const bytes = (b: Buffer, type = "image/jpeg") => new Response(new Uint8Array(b), { status: 200, headers: { "content-type": type } });

describe("keys and order", () => {
  it("reads REPLICATE_API_TOKEN first, then the REPLICATE_API_KEY already on Railway", () => {
    expect(configuredImageProviders({ REPLICATE_API_KEY: "r8_key" })).toEqual(["replicate"]);
    expect(configuredImageProviders({ FAL_API_KEY: "fal" })).toEqual(["fal"]);
    const status = imageProviderStatus({ REPLICATE_API_KEY: "r8_a", REPLICATE_API_TOKEN: "r8_b" });
    expect(status.find(s => s.id === "replicate")).toMatchObject({ configured: true, envName: "REPLICATE_API_TOKEN" });
    expect(JSON.stringify(status)).not.toContain("r8_a");
  });

  it("tries Replicate, then fal, then Stability, then OpenAI", () => {
    expect(configuredImageProviders({ OPENAI_API_KEY: "o", STABILITY_API_KEY: "s", FAL_KEY: "f", REPLICATE_API_KEY: "r" })).toEqual(["replicate", "fal", "stability", "openai"]);
  });

  it("refuses to spend a request when no provider or no storage is configured", async () => {
    const { deps } = harness({}, () => json({}));
    await expect(generateImage({ prompt: "a lighthouse" }, deps)).rejects.toMatchObject({ kind: "not_configured" });
    await expect(generateImage({ prompt: "a lighthouse" }, { env: { REPLICATE_API_KEY: "r" }, fetch: vi.fn() as any })).rejects.toThrow(/storage is not configured/);
  });
});

describe("the owner's rule on media hosts", () => {
  it.each([
    ["replicate", "wan-video/wan-2.2"],
    ["replicate", "qwen/qwen-image"],
    ["replicate", "tencent/hunyuan-image-3"],
    ["replicate", "bytedance/seedream-4"],
    ["replicate", "kwaivgi/kling-v2.1"],
    ["fal", "fal-ai/kling-video/v2.1/master/text-to-video"],
    ["fal", "fal-ai/wan/v2.2-a14b/text-to-video"],
    ["fal", "fal-ai/minimax/hailuo-02"],
    ["fal", "fal-ai/hidream-i1-full"],
  ] as const)("%s → %s is refused before any request is sent", async (provider, model) => {
    const { deps, calls, stored } = harness({ REPLICATE_API_KEY: "r8_x", FAL_KEY: "f" }, () => json({}));
    await expect(generateImage({ prompt: "a lighthouse", provider, model }, deps)).rejects.toThrow(CHINA_POLICY_MESSAGE);
    expect(calls).toEqual([]);
    expect(stored).toEqual([]);
  });

  it("refuses a banned model set on the host, even when a later provider could answer", async () => {
    const { deps, calls } = harness({ REPLICATE_API_KEY: "r8_x", REPLICATE_IMAGE_MODEL: "qwen/qwen-image", FAL_KEY: "f" }, () => json({}));
    await expect(generateImage({ prompt: "a lighthouse" }, deps)).rejects.toBeInstanceOf(ChinaPolicyError);
    expect(calls).toEqual([]);
  });

  it("allows Black Forest Labs' Flux on both hosts", () => {
    expect(resolveImageModel("replicate", {}, {})).toBe("black-forest-labs/flux-schnell");
    expect(resolveImageModel("replicate", { model: "black-forest-labs/flux-1.1-pro" }, {})).toBe("black-forest-labs/flux-1.1-pro");
    expect(resolveImageModel("replicate", { withReference: true }, {})).toBe("black-forest-labs/flux-kontext-pro");
    expect(resolveImageModel("fal", {}, {})).toBe("fal-ai/flux/schnell");
    expect(resolveImageModel("fal", { withReference: true }, {})).toBe("fal-ai/flux-pro/kontext");
    expect(() => resolveImageModel("stability", { model: "../v1/user" }, {})).toThrow(ImageGenerationError);
  });
});

describe("Replicate", () => {
  it("posts to the official-model endpoint with Bearer and Prefer: wait, downloads the output, stores it in the bucket", async () => {
    const { deps, calls, stored } = harness({ REPLICATE_API_KEY: "r8_test" }, url =>
      url.startsWith("https://api.replicate.com/")
        ? json({ id: "p1", status: "succeeded", output: ["https://replicate.delivery/out-0.jpg"] }, 201)
        : bytes(JPEG),
    );
    const image = await generateImage({ prompt: "a lighthouse at dusk", aspectRatio: "16:9", keyPrefix: "owner/1" }, deps);
    expect(calls[0].url).toBe("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions");
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer r8_test");
    expect(headers.prefer).toBe("wait");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ input: { prompt: "a lighthouse at dusk", aspect_ratio: "16:9", output_format: "jpg" } });
    expect(calls[1].url).toBe("https://replicate.delivery/out-0.jpg");
    expect(stored).toHaveLength(1);
    expect(stored[0].key).toMatch(/^generated\/owner\/1\/replicate-\d{4}-\d{2}-\d{2}\.jpg$/);
    expect(stored[0].contentType).toBe("image/jpeg");
    expect(image).toMatchObject({ provider: "replicate", model: "black-forest-labs/flux-schnell", contentType: "image/jpeg" });
    expect(image.url.startsWith("/files/")).toBe(true);
  });

  it("polls a prediction that is still running after the wait", async () => {
    let polls = 0;
    const { deps, calls } = harness({ REPLICATE_API_TOKEN: "r8_test" }, url => {
      if (url.endsWith("/predictions")) return json({ id: "p2", status: "starting", urls: { get: "https://api.replicate.com/v1/predictions/p2" } }, 201);
      if (url === "https://api.replicate.com/v1/predictions/p2") {
        polls++;
        return json(polls < 2 ? { status: "processing", urls: { get: url } } : { status: "succeeded", output: "https://replicate.delivery/p2.png" });
      }
      return bytes(PNG, "application/octet-stream");
    });
    const image = await generateImage({ prompt: "a lighthouse", provider: "replicate", model: "black-forest-labs/flux-1.1-pro" }, deps);
    expect(polls).toBe(2);
    expect(calls.filter(c => c.url.endsWith("/p2"))).toHaveLength(2);
    // Labelled octet-stream, stored as what it is.
    expect(image.contentType).toBe("image/png");
  });

  it("restyles a photo with Flux Kontext through a signed link to the stored original", async () => {
    const { deps, calls, stored } = harness({ REPLICATE_API_KEY: "r8_test" }, url =>
      url.includes("api.replicate.com") ? json({ status: "succeeded", output: "https://replicate.delivery/a.jpg" }) : bytes(JPEG),
    );
    await generateImage({ prompt: "as a royal portrait", reference: { data: JPEG, contentType: "image/jpeg" }, keyPrefix: "avatars/7" }, deps);
    expect(calls[0].url).toContain("/models/black-forest-labs/flux-kontext-pro/predictions");
    expect(JSON.parse(String(calls[0].init.body)).input.input_image).toBe("https://bucket.example.com/generated/avatars/7/reference.jpg_abc12345?sig=1");
    expect(stored.map(s => s.key)).toEqual(["generated/avatars/7/reference.jpg", expect.stringMatching(/^generated\/avatars\/7\/replicate-/)]);
  });
});

describe("failover", () => {
  it("hands a server error on to fal", async () => {
    const { deps, calls } = harness({ REPLICATE_API_KEY: "r8", FAL_KEY: "fal_test" }, url => {
      if (url.includes("replicate.com")) return json({ detail: "boom" }, 503);
      if (url === "https://fal.run/fal-ai/flux/schnell") return json({ images: [{ url: "https://v3.fal.media/files/x.jpg", content_type: "image/jpeg" }] });
      return bytes(JPEG);
    });
    const image = await generateImage({ prompt: "a lighthouse", aspectRatio: "3:4" }, deps);
    expect(image.provider).toBe("fal");
    expect(image.attempted).toEqual([{ provider: "replicate", error: expect.stringContaining("server error") }]);
    const fal = calls.find(c => c.url.startsWith("https://fal.run/"))!;
    expect((fal.init.headers as Record<string, string>).authorization).toBe("Key fal_test");
    expect(JSON.parse(String(fal.init.body))).toMatchObject({ prompt: "a lighthouse", image_size: "portrait_4_3", num_images: 1 });
  });

  it("does not route around a rejected key", async () => {
    const { deps, calls } = harness({ REPLICATE_API_KEY: "r8", FAL_KEY: "f" }, () => json({ detail: "Unauthenticated" }, 401));
    await expect(generateImage({ prompt: "a lighthouse" }, deps)).rejects.toMatchObject({ kind: "auth" });
    expect(calls).toHaveLength(1);
  });

  it("never shows a provider's error body", async () => {
    const { deps } = harness({ FAL_KEY: "f" }, () => json({ detail: "prompt was: SECRET CLIENT NAME" }, 422));
    const err = await generateImage({ prompt: "SECRET CLIENT NAME" }, deps).catch(e => e as Error);
    expect(err.message).not.toContain("SECRET");
  });
});

describe("Stability AI and OpenAI", () => {
  it("Stability: multipart to Stable Image Core, raw bytes back", async () => {
    const { deps, calls } = harness({ STABILITY_API_KEY: "sk-stab" }, () => bytes(PNG, "image/png"));
    const image = await generateImage({ prompt: "a lighthouse", aspectRatio: "4:3" }, deps);
    expect(calls[0].url).toBe("https://api.stability.ai/v2beta/stable-image/generate/core");
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers).toMatchObject({ authorization: "Bearer sk-stab", accept: "image/*" });
    const form = calls[0].init.body as FormData;
    expect(form.get("prompt")).toBe("a lighthouse");
    expect(form.get("aspect_ratio")).toBe("5:4");
    expect(image).toMatchObject({ provider: "stability", contentType: "image/png" });
  });

  it("Stability: a photo goes to Ultra with a strength", async () => {
    const { deps, calls } = harness({ STABILITY_API_KEY: "sk-stab" }, () => bytes(PNG, "image/png"));
    await generateImage({ prompt: "as a royal portrait", reference: { data: JPEG, contentType: "image/jpeg" }, referenceStrength: 0.5 }, deps);
    expect(calls[0].url).toBe("https://api.stability.ai/v2beta/stable-image/generate/ultra");
    expect((calls[0].init.body as FormData).get("strength")).toBe("0.5");
  });

  it("OpenAI: gpt-image-1 as the last fallback, base64 decoded into the bucket", async () => {
    const { deps, calls, stored } = harness({ OPENAI_API_KEY: "sk-test" }, () => json({ data: [{ b64_json: PNG.toString("base64") }] }));
    const image = await generateImage({ prompt: "a lighthouse", aspectRatio: "9:16" }, deps);
    expect(calls[0].url).toBe("https://api.openai.com/v1/images/generations");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ model: "gpt-image-1", prompt: "a lighthouse", size: "1024x1536", n: 1 });
    expect(stored[0].data.equals(PNG)).toBe(true);
    expect(image.provider).toBe("openai");
  });
});

describe("sniffImageType", () => {
  it("recognises PNG, JPEG and WebP and nothing else", () => {
    expect(sniffImageType(PNG)).toBe("image/png");
    expect(sniffImageType(JPEG)).toBe("image/jpeg");
    expect(sniffImageType(Buffer.from("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniffImageType(Buffer.from("<html>"))).toBeNull();
  });
});
