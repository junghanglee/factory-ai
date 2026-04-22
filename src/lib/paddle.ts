// src/lib/paddle.ts
// Paddle.js 동적 로더 + 체크아웃 오버레이 헬퍼

declare global {
  interface Window {
    Paddle?: any;
  }
}

const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
const environment: "sandbox" | "production" =
  clientToken?.startsWith("test_") ? "sandbox" : "production";

let loadPromise: Promise<any> | null = null;

// ───────────────── Paddle 이벤트 로깅 (관리자 진단용) ─────────────────
const EVENT_LOG_KEY = "paddle_event_log";
const MAX_EVENTS = 30;

export interface PaddleEventLogEntry {
  ts: string;
  name: string;
  data: any;
}

function recordPaddleEvent(evt: any) {
  if (typeof window === "undefined") return;
  const entry: PaddleEventLogEntry = {
    ts: new Date().toISOString(),
    name: evt?.name ?? "unknown",
    data: evt,
  };
  try {
    const raw = window.localStorage.getItem(EVENT_LOG_KEY);
    const list: PaddleEventLogEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    window.localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(list.slice(0, MAX_EVENTS)));
  } catch {
    /* ignore */
  }
}

export function getPaddleEventLog(): PaddleEventLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(EVENT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearPaddleEventLog() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(EVENT_LOG_KEY);
}


/** Paddle.js를 동적으로 로드하고 초기화한다. */
export function loadPaddle(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Paddle은 브라우저 환경에서만 사용할 수 있습니다."));
  }
  if (window.Paddle) return Promise.resolve(window.Paddle);
  if (loadPromise) return loadPromise;

  if (!clientToken) {
    return Promise.reject(new Error("VITE_PADDLE_CLIENT_TOKEN이 설정되지 않았습니다."));
  }

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://cdn.paddle.com/paddle/v2/paddle.js"]'
    );
    const onReady = () => {
      try {
        if (environment === "sandbox") {
          window.Paddle.Environment.set("sandbox");
        }
        window.Paddle.Initialize({
          token: clientToken,
          eventCallback: (data: any) => {
            // eslint-disable-next-line no-console
            console.log("[Paddle event]", data?.name, data);
            try {
              recordPaddleEvent(data);
            } catch { /* ignore storage errors */ }
            if (data?.name === "checkout.error" || data?.name === "checkout.warning") {
              // eslint-disable-next-line no-console
              console.error("[Paddle checkout error]", data);
            }
          },
        });
        resolve(window.Paddle);
      } catch (e) {
        reject(e);
      }
    };
    if (existing) {
      if (window.Paddle) onReady();
      else existing.addEventListener("load", onReady, { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    s.async = true;
    s.onload = onReady;
    s.onerror = () => reject(new Error("Paddle.js 로딩 실패"));
    document.head.appendChild(s);
  });

  return loadPromise;
}

export function getPaddleEnvironment(): "sandbox" | "production" {
  return environment;
}

export interface OpenCheckoutParams {
  /** USD 단위 금액 (소수점 두 자리). 예: 49.99 */
  amountUsd: number;
  /** 표시될 상품명 */
  productName: string;
  /** 결제 후 redirect URL (선택) */
  successUrl?: string;
  /** 고객 이메일 (선택) */
  email?: string;
  /** 웹훅에서 식별하기 위한 메타데이터 */
  customData: Record<string, string>;
}

/**
 * Paddle.js 오버레이 체크아웃을 띄운다 (동적 가격 / Custom Price).
 */
export async function openPaddleCheckout(params: OpenCheckoutParams): Promise<void> {
  const Paddle = await loadPaddle();
  // eslint-disable-next-line no-console
  console.log("[Paddle] opening checkout", {
    env: environment,
    amountUsd: params.amountUsd,
    productName: params.productName,
    customData: params.customData,
  });
  Paddle.Checkout.open({
    items: [
      {
        quantity: 1,
        price: {
          description: params.productName,
          name: params.productName,
          tax_mode: "account_setting",
          unit_price: {
            amount: Math.round(params.amountUsd * 100).toString(),
            currency_code: "USD",
          },
          quantity: { minimum: 1, maximum: 1 },
        },
      },
    ],
    customer: params.email ? { email: params.email } : undefined,
    customData: params.customData,
    settings: {
      displayMode: "overlay",
      theme: "light",
      locale: "en",
      ...(params.successUrl ? { successUrl: params.successUrl } : {}),
    },
  });
}
