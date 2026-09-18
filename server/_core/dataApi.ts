/**
 * Bounded transport for the managed Data API.
 */
import { ENV } from "./env";

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
  timeoutMs?: number;
};

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const TRANSIENT_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function retryDelay(response: Response | null, attempt: number) {
  const retryAfter = response?.headers.get("retry-after");
  const seconds = retryAfter ? Number(retryAfter) : Number.NaN;
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(5_000, seconds * 1_000);
  return Math.min(3_000, 300 * 2 ** attempt + Math.floor(Math.random() * 150));
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function callDataApi(apiId: string, options: DataApiCallOptions = {}): Promise<unknown> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) throw new Error("Data API is not configured");
  if (!apiId || apiId.length > 200) throw new Error("Invalid Data API identifier");

  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL("webdevtoken.v1.WebDevService/CallApi", baseUrl).toString();
  const timeoutMs = Math.min(45_000, Math.max(1_000, options.timeoutMs ?? 15_000));
  let lastFailure = "unavailable";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response | null = null;
    try {
      response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "connect-protocol-version": "1",
          authorization: `Bearer ${ENV.forgeApiKey}`,
        },
        body: JSON.stringify({
          apiId,
          query: options.query,
          body: options.body,
          path_params: options.pathParams,
          multipart_form_data: options.formData,
        }),
        signal: controller.signal,
      });

      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > MAX_RESPONSE_BYTES) throw new Error("Data API response exceeded the size limit");

      const text = await response.text();
      if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) throw new Error("Data API response exceeded the size limit");

      if (!response.ok) {
        lastFailure = `status ${response.status}`;
        if (TRANSIENT_STATUSES.has(response.status) && attempt < 2) {
          await sleep(retryDelay(response, attempt));
          continue;
        }
        throw new Error(`Data API request failed (${response.status})`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (text && !contentType.toLowerCase().includes("json")) throw new Error("Data API returned an unsupported response type");
      const payload = text ? JSON.parse(text) : {};
      if (payload && typeof payload === "object" && "jsonData" in payload) {
        const jsonData = (payload as Record<string, unknown>).jsonData;
        if (typeof jsonData !== "string") return jsonData;
        try {
          return JSON.parse(jsonData);
        } catch {
          return jsonData;
        }
      }
      return payload;
    } catch (error) {
      if (controller.signal.aborted) throw new Error("Data API request timed out");
      if (error instanceof SyntaxError) throw new Error("Data API returned invalid JSON");
      const message = error instanceof Error ? error.message : "Data API request failed";
      const retryableNetworkFailure = response === null && attempt < 2;
      if (retryableNetworkFailure) {
        lastFailure = "network error";
        await sleep(retryDelay(null, attempt));
        continue;
      }
      if (message.startsWith("Data API ")) throw error;
      throw new Error(`Data API request failed (${lastFailure})`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Data API request failed (${lastFailure})`);
}
