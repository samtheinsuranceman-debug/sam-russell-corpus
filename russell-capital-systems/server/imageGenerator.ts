/**
 * Image generation — Replicate, fal, Stability AI and OpenAI behind one call.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The hosted image service the platform shipped with was removed on 23 Sep
 * 2026. This replaces it with services the firm keys itself, tried in the
 * owner's order when more than one is keyed:
 *
 *   1. Replicate (US)     REPLICATE_API_TOKEN, or REPLICATE_API_KEY as it is
 *                         named on Railway. Black Forest Labs' Flux (Germany):
 *                         flux-schnell by default, flux-1.1-pro on request,
 *                         flux-kontext-pro when a photo is being restyled.
 *   2. fal.ai (US)        FAL_KEY, or FAL_API_KEY. The same Flux models.
 *   3. Stability AI (UK)  STABILITY_API_KEY. Stable Image Core; Ultra for a photo.
 *   4. OpenAI (US)        OPENAI_API_KEY. gpt-image-1.
 *
 * <PROVIDER>_IMAGE_MODEL (REPLICATE_IMAGE_MODEL, FAL_IMAGE_MODEL, …) changes a
 * provider's text-to-image model without a code change.
 *
 * ─── OWNER'S STANDING RULE ──────────────────────────────────────────────────
 *
 * Replicate and fal also host Chinese image and video models (Wan, Qwen-Image,
 * Hunyuan, Kling, Seedream, Hailuo and more). Every model id, whether it came
 * from the defaults, an environment variable or a caller, is checked with
 * isBannedModel before a request is built, and a banned one is refused with
 * the firm's sentence — it is never failed over from, because it is a
 * configuration fault, not an outage.
 *
 * Results are copied into the firm's own bucket (server/storage.ts) and served
 * from /files/: provider output URLs expire within the hour, and a data URL in
 * a database column is not a file.
 */
import { CHINA_POLICY_MESSAGE, ChinaPolicyError, assertModelAllowed } from "@shared/aiProviders";
import { isStorageConfigured, storageGetSignedUrl, storagePut } from "./storage";

type Env = Record<string, string | undefined>;

export type ImageProviderId = "replicate" | "fal" | "stability" | "openai";

/** The owner's order when several image providers are keyed. */
export const IMAGE_PROVIDER_ORDER: readonly ImageProviderId[] = ["replicate", "fal", "stability", "openai"];

export type ImageProviderDefinition = {
  id: ImageProviderId;
  name: string;
  country: string;
  /** Key variables, in precedence order. */
  envNames: string[];
  /** Optional variable that replaces the default text-to-image model. */
  modelEnv: string;
  /** Text to image. */
  defaultModel: string;
  /** Used when a reference photo is supplied and no model was named. */
  referenceModel: string;
  suggestedModels: string[];
  /** Shape a model id must take before it goes into a URL or a form. */
  modelShape: RegExp;
  consoleUrl: string;
};

export const IMAGE_PROVIDERS: Record<ImageProviderId, ImageProviderDefinition> = {
  replicate: {
    id: "replicate",
    name: "Replicate",
    country: "United States",
    envNames: ["REPLICATE_API_TOKEN", "REPLICATE_API_KEY"],
    modelEnv: "REPLICATE_IMAGE_MODEL",
    defaultModel: "black-forest-labs/flux-schnell",
    referenceModel: "black-forest-labs/flux-kontext-pro",
    suggestedModels: ["black-forest-labs/flux-schnell", "black-forest-labs/flux-1.1-pro", "black-forest-labs/flux-kontext-pro"],
    modelShape: /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/i,
    consoleUrl: "https://replicate.com/account/api-tokens",
  },
  fal: {
    id: "fal",
    name: "fal.ai",
    country: "United States",
    envNames: ["FAL_KEY", "FAL_API_KEY"],
    modelEnv: "FAL_IMAGE_MODEL",
    defaultModel: "fal-ai/flux/schnell",
    referenceModel: "fal-ai/flux-pro/kontext",
    suggestedModels: ["fal-ai/flux/schnell", "fal-ai/flux-pro/v1.1", "fal-ai/flux-pro/kontext"],
    modelShape: /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*){1,4}$/i,
    consoleUrl: "https://fal.ai/dashboard/keys",
  },
  stability: {
    id: "stability",
    name: "Stability AI",
    country: "United Kingdom",
    envNames: ["STABILITY_API_KEY"],
    modelEnv: "STABILITY_IMAGE_MODEL",
    defaultModel: "core",
    // Of the Stable Image services, only Ultra takes a starting image.
    referenceModel: "ultra",
    suggestedModels: ["core", "ultra"],
    modelShape: /^(?:core|ultra)$/,
    consoleUrl: "https://platform.stability.ai/account/keys",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    country: "United States",
    envNames: ["OPENAI_API_KEY"],
    modelEnv: "OPENAI_IMAGE_MODEL",
    defaultModel: "gpt-image-1",
    referenceModel: "gpt-image-1",
    suggestedModels: ["gpt-image-1"],
    modelShape: /^gpt-image-[a-z0-9.-]+$/i,
    consoleUrl: "https://platform.openai.com/api-keys",
  },
};

export const REPLICATE_API = "https://api.replicate.com/v1";
export const FAL_RUN = "https://fal.run";
export const STABILITY_API = "https://api.stability.ai/v2beta/stable-image/generate";
export const OPENAI_IMAGES = "https://api.openai.com/v1/images";

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3";
export const ASPECT_RATIOS: readonly AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"];

export type ImageErrorKind = "not_configured" | "auth" | "quota" | "rejected" | "bad_request" | "timeout" | "network" | "server" | "unknown";

/** A failure that is safe to show the owner: never the key, never a provider's raw body. */
export class ImageGenerationError extends Error {
  readonly kind: ImageErrorKind;
  readonly attempted: Array<{ provider: ImageProviderId; error: string }>;
  constructor(kind: ImageErrorKind, message: string, attempted: Array<{ provider: ImageProviderId; error: string }> = []) {
    super(message);
    this.name = "ImageGenerationError";
    this.kind = kind;
    this.attempted = attempted;
  }
}

/** The key a provider would use, and the variable it came from. */
export function imageProviderKey(id: ImageProviderId, env: Env = process.env): { key: string; envName: string } | null {
  for (const envName of IMAGE_PROVIDERS[id].envNames) {
    const key = env[envName]?.trim();
    if (key) return { key, envName };
  }
  return null;
}

/** Keyed image providers, in the owner's order. */
export function configuredImageProviders(env: Env = process.env): ImageProviderId[] {
  return IMAGE_PROVIDER_ORDER.filter(id => imageProviderKey(id, env) !== null);
}

export function isImageGenerationConfigured(env: Env = process.env): boolean {
  return configuredImageProviders(env).length > 0;
}

/** What the owner's panel shows: names and models, never a key. */
export function imageProviderStatus(env: Env = process.env) {
  return IMAGE_PROVIDER_ORDER.map(id => {
    const p = IMAGE_PROVIDERS[id];
    const found = imageProviderKey(id, env);
    return {
      id,
      name: p.name,
      country: p.country,
      configured: found !== null,
      envName: found?.envName ?? null,
      envNames: p.envNames,
      model: env[p.modelEnv]?.trim() || p.defaultModel,
      suggestedModels: p.suggestedModels,
      consoleUrl: p.consoleUrl,
    };
  });
}

/**
 * The model a provider will be asked for, checked against the owner's rule
 * and the provider's id shape. Throws ChinaPolicyError for a banned id.
 */
export function resolveImageModel(id: ImageProviderId, opts: { model?: string; withReference?: boolean } = {}, env: Env = process.env): string {
  const p = IMAGE_PROVIDERS[id];
  const model = (opts.model?.trim() || (opts.withReference ? p.referenceModel : env[p.modelEnv]?.trim() || p.defaultModel)).trim();
  assertModelAllowed(model, `${p.name} image model`);
  if (!p.modelShape.test(model)) {
    throw new ImageGenerationError("bad_request", `"${model}" is not a ${p.name} image model id.`);
  }
  return model;
}

export type GenerateImageRequest = {
  prompt: string;
  aspectRatio?: AspectRatio;
  /** Use only this provider. Without it the keyed providers are tried in order. */
  provider?: ImageProviderId;
  /** A model id for the named provider. Needs `provider`: ids do not carry across services. */
  model?: string;
  /** A photo to restyle (the avatar feature). */
  reference?: { data: Buffer; contentType: string };
  /** How far Stability may move from the reference, 0–1. */
  referenceStrength?: number;
  /** Folder inside the bucket, e.g. "avatars/12". */
  keyPrefix?: string;
};

export type GeneratedImage = {
  /** /files/… — served by the storage proxy. */
  url: string;
  key: string;
  provider: ImageProviderId;
  model: string;
  contentType: string;
  attempted: Array<{ provider: ImageProviderId; error: string }>;
};

export type ImageDeps = {
  fetch?: typeof fetch;
  env?: Env;
  put?: typeof storagePut;
  signedUrl?: typeof storageGetSignedUrl;
  sleep?: (ms: number) => Promise<void>;
};

type Ctx = {
  fetch: typeof fetch;
  key: string;
  model: string;
  prompt: string;
  aspectRatio: AspectRatio;
  reference?: { data: Buffer; contentType: string };
  referenceUrl: () => Promise<string>;
  referenceStrength: number;
  sleep: (ms: number) => Promise<void>;
};

type ImageBytes = { data: Buffer; contentType: string };

class ProviderFailure extends Error {
  readonly kind: ImageErrorKind;
  constructor(kind: ImageErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

const REQUEST_TIMEOUT_MS = 120_000;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

async function send(f: typeof fetch, url: string, init: RequestInit, name: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await f(url, { ...init, signal: controller.signal });
  } catch (e: any) {
    if (e?.name === "AbortError") throw new ProviderFailure("timeout", `${name} did not answer within ${Math.round(timeoutMs / 1000)} seconds.`);
    throw new ProviderFailure("network", `Could not reach ${name}.`);
  } finally {
    clearTimeout(timer);
  }
}

/** Status to a sentence. Provider bodies can echo the prompt, so they are never passed through. */
function failure(status: number, name: string, id: ImageProviderId): ProviderFailure {
  if (status === 401) return new ProviderFailure("auth", `${name} rejected the API key.`);
  // Stability answers a moderation refusal with 403; for the others 403 is the key.
  if (status === 403) return id === "stability"
    ? new ProviderFailure("rejected", `${name} declined the prompt under its content policy.`)
    : new ProviderFailure("auth", `${name} refused the API key for this request.`);
  if (status === 402 || status === 429) return new ProviderFailure("quota", `${name} is out of credit or rate limiting (HTTP ${status}).`);
  if (status === 400 || status === 404 || status === 413 || status === 422) return new ProviderFailure("bad_request", `${name} rejected the request (HTTP ${status}). Check the model id and prompt.`);
  if (status >= 500) return new ProviderFailure("server", `${name} returned a server error (HTTP ${status}).`);
  return new ProviderFailure("unknown", `${name} returned HTTP ${status}.`);
}

/** The image type from its first bytes, so a mislabelled download is still stored correctly. */
export function sniffImageType(data: Uint8Array): string | null {
  if (data.length >= 8 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) return "image/png";
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  const ascii = (from: number, to: number) => Buffer.from(data.subarray(from, to)).toString("latin1");
  if (data.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

function asImage(data: Buffer, headerType: string | null, name: string): ImageBytes {
  if (data.length === 0) throw new ProviderFailure("unknown", `${name} returned an empty image.`);
  if (data.length > MAX_IMAGE_BYTES) throw new ProviderFailure("unknown", `${name} returned an image larger than ${MAX_IMAGE_BYTES} bytes.`);
  const contentType = sniffImageType(data) ?? (headerType?.startsWith("image/") ? headerType.split(";")[0] : null);
  if (!contentType) throw new ProviderFailure("unknown", `${name} returned something that is not an image.`);
  return { data, contentType };
}

/** Fetch a provider's output URL (https only) or decode a data URL. */
async function download(f: typeof fetch, url: string, name: string): Promise<ImageBytes> {
  const dataUrl = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(url);
  if (dataUrl) {
    const body = dataUrl[2] ? Buffer.from(dataUrl[3], "base64") : Buffer.from(decodeURIComponent(dataUrl[3]), "utf8");
    return asImage(body, dataUrl[1] ?? null, name);
  }
  if (!url.startsWith("https://")) throw new ProviderFailure("unknown", `${name} returned an output that is not an https URL.`);
  const res = await send(f, url, { method: "GET" }, name);
  if (!res.ok) throw new ProviderFailure("server", `${name}'s image link answered HTTP ${res.status}.`);
  return asImage(Buffer.from(await res.arrayBuffer()), res.headers.get("content-type"), name);
}

function firstOutputUrl(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output.find((o): o is string => typeof o === "string") ?? null;
  return null;
}

// ─── Replicate ───────────────────────────────────────────────────────────────

async function runReplicate(c: Ctx): Promise<ImageBytes> {
  const name = "Replicate";
  const [owner, model] = c.model.split("/");
  const input: Record<string, unknown> = { prompt: c.prompt, aspect_ratio: c.aspectRatio, output_format: "jpg" };
  if (c.reference) {
    // Kontext restyles the photo it is given; 1.1 Pro takes it as a composition hint.
    input[/kontext/i.test(c.model) ? "input_image" : "image_prompt"] = await c.referenceUrl();
  }
  const headers = { authorization: `Bearer ${c.key}`, "content-type": "application/json", prefer: "wait" };
  const res = await send(c.fetch, `${REPLICATE_API}/models/${owner}/${model}/predictions`, { method: "POST", headers, body: JSON.stringify({ input }) }, name);
  if (!res.ok) throw failure(res.status, name, "replicate");
  let prediction: any = await res.json();

  // `Prefer: wait` holds the request for up to a minute; a slower model comes
  // back still running and is polled on its own URL until it settles.
  const deadline = Date.now() + REQUEST_TIMEOUT_MS;
  while (prediction?.status === "starting" || prediction?.status === "processing") {
    const next = typeof prediction?.urls?.get === "string" ? prediction.urls.get : "";
    if (!next.startsWith(`${REPLICATE_API}/`)) throw new ProviderFailure("unknown", `${name} returned a prediction with no status URL.`);
    if (Date.now() > deadline) throw new ProviderFailure("timeout", `${name} was still working after ${REQUEST_TIMEOUT_MS / 1000} seconds.`);
    await c.sleep(2000);
    const poll = await send(c.fetch, next, { method: "GET", headers: { authorization: `Bearer ${c.key}` } }, name);
    if (!poll.ok) throw failure(poll.status, name, "replicate");
    prediction = await poll.json();
  }
  if (prediction?.status !== "succeeded") {
    throw new ProviderFailure(prediction?.status === "canceled" ? "unknown" : "rejected", `${name} did not produce an image (${prediction?.status ?? "no status"}).`);
  }
  const url = firstOutputUrl(prediction.output);
  if (!url) throw new ProviderFailure("unknown", `${name} finished with no image in its output.`);
  return download(c.fetch, url, name);
}

// ─── fal.ai ──────────────────────────────────────────────────────────────────

const FAL_IMAGE_SIZE: Record<AspectRatio, string> = {
  "1:1": "square_hd", "16:9": "landscape_16_9", "9:16": "portrait_16_9",
  "4:3": "landscape_4_3", "3:4": "portrait_4_3", "3:2": "landscape_4_3", "2:3": "portrait_4_3",
};

async function runFal(c: Ctx): Promise<ImageBytes> {
  const name = "fal.ai";
  const kontext = /kontext/i.test(c.model);
  const body: Record<string, unknown> = { prompt: c.prompt, num_images: 1, output_format: "jpeg", enable_safety_checker: true };
  // The Kontext endpoints take an aspect ratio; the text-to-image ones a named size.
  if (kontext) body.aspect_ratio = c.aspectRatio;
  else body.image_size = FAL_IMAGE_SIZE[c.aspectRatio];
  if (c.reference) body.image_url = await c.referenceUrl();
  const res = await send(c.fetch, `${FAL_RUN}/${c.model}`, {
    method: "POST",
    headers: { authorization: `Key ${c.key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  }, name);
  if (!res.ok) throw failure(res.status, name, "fal");
  const json: any = await res.json();
  const url = typeof json?.images?.[0]?.url === "string" ? json.images[0].url : null;
  if (!url) throw new ProviderFailure("unknown", `${name} returned no image.`);
  return download(c.fetch, url, name);
}

// ─── Stability AI ────────────────────────────────────────────────────────────

/** Stability has no 4:3 or 3:4; 5:4 and 4:5 are the nearest it offers. */
const STABILITY_ASPECT: Record<AspectRatio, string> = {
  "1:1": "1:1", "16:9": "16:9", "9:16": "9:16", "4:3": "5:4", "3:4": "4:5", "3:2": "3:2", "2:3": "2:3",
};

async function runStability(c: Ctx): Promise<ImageBytes> {
  const name = "Stability AI";
  const form = new FormData();
  form.append("prompt", c.prompt);
  form.append("aspect_ratio", STABILITY_ASPECT[c.aspectRatio]);
  form.append("output_format", "png");
  if (c.reference) {
    form.append("image", new Blob([new Uint8Array(c.reference.data)], { type: c.reference.contentType }), "reference");
    form.append("strength", String(c.referenceStrength));
  }
  const res = await send(c.fetch, `${STABILITY_API}/${c.model}`, {
    method: "POST",
    headers: { authorization: `Bearer ${c.key}`, accept: "image/*" },
    body: form,
  }, name);
  if (!res.ok) throw failure(res.status, name, "stability");
  return asImage(Buffer.from(await res.arrayBuffer()), res.headers.get("content-type"), name);
}

// ─── OpenAI ──────────────────────────────────────────────────────────────────

function openAiSize(r: AspectRatio): string {
  if (r === "1:1") return "1024x1024";
  return r === "16:9" || r === "4:3" || r === "3:2" ? "1536x1024" : "1024x1536";
}

async function runOpenAi(c: Ctx): Promise<ImageBytes> {
  const name = "OpenAI";
  let res: Response;
  if (c.reference) {
    // A photo goes to the edits endpoint as a file upload.
    const form = new FormData();
    form.append("model", c.model);
    form.append("prompt", c.prompt);
    form.append("size", openAiSize(c.aspectRatio));
    const ext = c.reference.contentType.split("/")[1] ?? "jpeg";
    form.append("image", new Blob([new Uint8Array(c.reference.data)], { type: c.reference.contentType }), `reference.${ext}`);
    res = await send(c.fetch, `${OPENAI_IMAGES}/edits`, { method: "POST", headers: { authorization: `Bearer ${c.key}` }, body: form }, name);
  } else {
    res = await send(c.fetch, `${OPENAI_IMAGES}/generations`, {
      method: "POST",
      headers: { authorization: `Bearer ${c.key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: c.model, prompt: c.prompt, size: openAiSize(c.aspectRatio), n: 1 }),
    }, name);
  }
  if (!res.ok) throw failure(res.status, name, "openai");
  const json: any = await res.json();
  const item = json?.data?.[0];
  if (typeof item?.b64_json === "string") return asImage(Buffer.from(item.b64_json, "base64"), null, name);
  if (typeof item?.url === "string") return download(c.fetch, item.url, name);
  throw new ProviderFailure("unknown", `${name} returned no image.`);
}

const RUNNERS: Record<ImageProviderId, (c: Ctx) => Promise<ImageBytes>> = {
  replicate: runReplicate,
  fal: runFal,
  stability: runStability,
  openai: runOpenAi,
};

const EXTENSION: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

function safePrefix(prefix: string | undefined): string {
  const cleaned = (prefix ?? "").toLowerCase().replace(/[^a-z0-9/_-]+/g, "-").replace(/\/{2,}/g, "/").replace(/^\/+|\/+$/g, "");
  return cleaned || "misc";
}

/**
 * Generate one image and store it in the firm's bucket.
 *
 * Keyed providers are tried in the owner's order. A provider that is down,
 * out of credit or refuses the prompt hands over to the next; a rejected key
 * does not, for the reason the Brain Hub chain gives — routing around a dead
 * key hides it until the bill arrives from whoever picked up the slack.
 */
export async function generateImage(req: GenerateImageRequest, deps: ImageDeps = {}): Promise<GeneratedImage> {
  const env = deps.env ?? process.env;
  const f = deps.fetch ?? fetch;
  const put = deps.put ?? storagePut;
  const signedUrl = deps.signedUrl ?? storageGetSignedUrl;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>(r => setTimeout(r, ms)));

  const prompt = req.prompt.trim();
  if (!prompt) throw new ImageGenerationError("bad_request", "A prompt is required.");
  if (prompt.length > 4000) throw new ImageGenerationError("bad_request", "The prompt is longer than 4,000 characters.");
  if (req.model && !req.provider) throw new ImageGenerationError("bad_request", "Name the provider when naming a model; model ids differ between services.");

  // Checked first, so no provider is paid for an image there is nowhere to keep.
  if (!deps.put && !isStorageConfigured(env)) {
    throw new ImageGenerationError("not_configured", "File storage is not configured on this host (set STORAGE_S3_BUCKET and the S3_* credentials), so a generated image would have nowhere to go.");
  }

  const chain = req.provider ? [req.provider] : configuredImageProviders(env);
  if (chain.length === 0) {
    throw new ImageGenerationError("not_configured", "No image provider is configured. Set REPLICATE_API_TOKEN (or REPLICATE_API_KEY), FAL_KEY, STABILITY_API_KEY or OPENAI_API_KEY.");
  }

  // Every model is resolved, and checked against the owner's rule, before
  // anything is sent anywhere.
  const plan = chain.map(id => ({ id, model: resolveImageModel(id, { model: req.model, withReference: Boolean(req.reference) }, env) }));

  const prefix = safePrefix(req.keyPrefix);
  let referenceUrl: Promise<string> | null = null;
  const reference = req.reference;
  const getReferenceUrl = () => {
    if (!reference) return Promise.reject(new Error("no reference image"));
    // Replicate and fal fetch the photo themselves: it goes to the bucket once
    // and they get a signed link that lapses in fifteen minutes.
    referenceUrl ??= (async () => {
      const ext = EXTENSION[reference.contentType] ?? "jpg";
      const stored = await put(`generated/${prefix}/reference.${ext}`, reference.data, reference.contentType);
      return signedUrl(stored.key, 900);
    })();
    return referenceUrl;
  };

  const attempted: Array<{ provider: ImageProviderId; error: string }> = [];
  for (const { id, model } of plan) {
    const found = imageProviderKey(id, env);
    if (!found) {
      attempted.push({ provider: id, error: `not configured (set ${IMAGE_PROVIDERS[id].envNames.join(" or ")})` });
      continue;
    }
    try {
      const image = await RUNNERS[id]({
        fetch: f,
        key: found.key,
        model,
        prompt,
        aspectRatio: req.aspectRatio ?? "1:1",
        reference,
        referenceUrl: getReferenceUrl,
        referenceStrength: Math.min(1, Math.max(0, req.referenceStrength ?? 0.6)),
        sleep,
      });
      const ext = EXTENSION[image.contentType] ?? "img";
      const stored = await put(`generated/${prefix}/${id}-${new Date().toISOString().slice(0, 10)}.${ext}`, image.data, image.contentType);
      return { url: stored.url, key: stored.key, provider: id, model, contentType: image.contentType, attempted };
    } catch (e) {
      if (e instanceof ChinaPolicyError) throw e;
      if (!(e instanceof ProviderFailure)) throw e;
      attempted.push({ provider: id, error: e.message });
      if (e.kind === "auth") {
        console.error(`[Images] ${IMAGE_PROVIDERS[id].name} rejected its key (${found.envName}) — not failing over.`);
        throw new ImageGenerationError("auth", e.message, attempted);
      }
      console.warn(`[Images] ${IMAGE_PROVIDERS[id].name} failed (${e.message}); trying the next provider.`);
    }
  }

  const last = attempted[attempted.length - 1];
  throw new ImageGenerationError(
    attempted.every(a => a.error.startsWith("not configured")) ? "not_configured" : "unknown",
    attempted.length === 1 && last ? last.error : `Every image provider failed. ${attempted.map(a => `${IMAGE_PROVIDERS[a.provider].name}: ${a.error}`).join(" | ")}`,
    attempted,
  );
}

/** For callers that turn errors into sentences: the firm's rule reads the same everywhere. */
export function imageErrorMessage(e: unknown): string {
  if (e instanceof ChinaPolicyError) return e.message;
  if (e instanceof ImageGenerationError) return e.message;
  return e instanceof Error && e.message.includes(CHINA_POLICY_MESSAGE) ? e.message : "Image generation failed.";
}
