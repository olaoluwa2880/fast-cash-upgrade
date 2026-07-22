// FCM HTTP v1 sender using Web Crypto (Cloudflare Worker compatible).
// No Node-only deps (no firebase-admin, no jsonwebtoken).

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
};

let cachedToken: { token: string; exp: number } | null = null;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function b64url(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else if (input instanceof Uint8Array) {
    bytes = input;
  } else {
    bytes = new Uint8Array(input);
  }
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  const parsed = JSON.parse(raw) as ServiceAccount;
  parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  return parsed;
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  const sa = getServiceAccount();
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${b64url(sig)}`;

  const res = await fetch(payload.aud, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const body = (await res.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !body.access_token) {
    throw new Error(`FCM token exchange failed: ${body.error_description || body.error || res.status}`);
  }
  cachedToken = { token: body.access_token, exp: now + (body.expires_in ?? 3600) };
  return cachedToken.token;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, string>;
};

export async function sendToTokens(tokens: string[], payload: PushPayload): Promise<{ sent: number; invalid: string[] }> {
  if (tokens.length === 0) return { sent: 0, invalid: [] };
  const sa = getServiceAccount();
  const accessToken = await getAccessToken();
  const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  const data: Record<string, string> = {
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    ...(payload.data ?? {}),
  };
  if (payload.tag) data.tag = payload.tag;

  const invalid: string[] = [];
  let sent = 0;
  await Promise.all(
    tokens.map(async (token) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            data, // data-only; the SW builds the notification
            webpush: {
              headers: { Urgency: "high", TTL: "600" },
              fcm_options: { link: payload.url ?? "/" },
            },
          },
        }),
      });
      if (res.ok) { sent++; return; }
      const errBody = await res.text();
      if (res.status === 404 || res.status === 400 || /UNREGISTERED|INVALID_ARGUMENT/i.test(errBody)) {
        invalid.push(token);
      } else {
        console.error("FCM send error", res.status, errBody);
      }
    }),
  );
  return { sent, invalid };
}
