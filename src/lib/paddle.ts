// src/lib/paddle.ts
// Paddle.js 동적 로더 + 체크아웃 오버레이 헬퍼

import i18n from "i18next";
import { supabase } from "@/integrations/supabase/client";
import { showPaddleOutcome } from "@/components/PaddleOutcomeDialog";
import { formatKrw, formatUsd } from "@/utils/formatPrice";

declare global {
  interface Window {
    Paddle?: any;
  }
}

type PaddleEnvironment = "sandbox" | "production";

interface PaddleConfig {
  clientToken: string;
  environment: PaddleEnvironment;
}

let loadPromise: Promise<any> | null = null;
let configPromise: Promise<PaddleConfig> | null = null;
let initializedToken: string | null = null;

// ───────────────── Paddle 이벤트 로깅 (관리자 진단용) ─────────────────
const EVENT_LOG_KEY = "paddle_event_log";
const MAX_EVENTS = 30;

export interface PaddleEventLogEntry {
  ts: string;
  name: string;
  data: any;
}

function normalizeToken(token?: string | null) {
  const trimmed = token?.trim();
  return trimmed ? trimmed : null;
}

function getEnvironmentFromToken(token: string): PaddleEnvironment {
  return token.startsWith("test_") ? "sandbox" : "production";
}

async function getPaddleConfig(): Promise<PaddleConfig> {
  if (configPromise) return configPromise;

  configPromise = (async () => {
    const envToken = normalizeToken(import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined);
    if (envToken) {
      return {
        clientToken: envToken,
        environment: getEnvironmentFromToken(envToken),
      };
    }

    const { data, error } = await supabase.functions.invoke("paddle-client-token");
    const runtimeToken = normalizeToken((data as { clientToken?: string } | null)?.clientToken);

    if (error || !runtimeToken) {
      throw new Error(error?.message ?? "Paddle client token을 불러오지 못했습니다.");
    }

    return {
      clientToken: runtimeToken,
      environment: getEnvironmentFromToken(runtimeToken),
    };
  })().catch((error) => {
    configPromise = null;
    throw error;
  });

  return configPromise;
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

// ───────────────── 결제 결과 안내 모달 디스패치 ─────────────────
let lastCheckoutAttempt: (() => Promise<void>) | null = null;
let lastCheckoutAmounts: { amountUsd: number; amountKrw?: number } | null = null;

/** 현재 결제 시도의 금액을 사람이 읽기 좋은 양 통화 문자열로 반환 */
function formatLastAmountBilingual(): string | null {
  const amounts = lastCheckoutAmounts;
  if (!amounts) return null;
  const usdStr = formatUsd(amounts.amountUsd);
  if (amounts.amountKrw && amounts.amountKrw > 0) {
    const krwStr = formatKrw(amounts.amountKrw);
    return i18n.language === "en" ? `${usdStr} (≈ ${krwStr})` : `${krwStr} (≈ ${usdStr})`;
  }
  return usdStr;
}

function getRetryHandler(): (() => void) | undefined {
  const attempt = lastCheckoutAttempt;
  if (!attempt) return undefined;
  return () => {
    attempt().catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[Paddle] retry failed", err);
      showPaddleOutcome({
        kind: "error",
        title: "재시도 실패",
        reason: "결제 창을 다시 여는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        rawDetail: err instanceof Error ? err.message : String(err),
        onRetry: getRetryHandler(),
      });
    });
  };
}

function dispatchOutcomeFromEvent(evt: any) {
  const name: string | undefined = evt?.name;
  if (!name) return;

  if (name === "checkout.completed") {
    showPaddleOutcome({
      kind: "success",
      title: "결제가 완료되었습니다",
      reason: "결제 처리가 완료되었습니다. 주문 내역에서 진행 상황을 확인하실 수 있습니다.",
    });
    return;
  }

  if (name === "checkout.payment.failed") {
    const reason: string =
      evt?.data?.payment?.error_message ||
      evt?.data?.error?.detail ||
      "카드사 승인에 실패했습니다. 카드 정보 또는 잔액을 확인하신 후 다시 시도해 주세요.";
    showPaddleOutcome({
      kind: "error",
      title: "결제가 실패했습니다",
      reason,
      code: evt?.data?.payment?.method_details?.type || evt?.data?.error?.code,
      onRetry: getRetryHandler(),
    });
    return;
  }

  if (name === "checkout.error") {
    const detail: string =
      evt?.detail ||
      evt?.data?.detail ||
      "결제 창에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    showPaddleOutcome({
      kind: "error",
      title: "결제 오류",
      reason: detail,
      code: evt?.code || evt?.data?.code,
      rawDetail: typeof evt?.data === "object" ? JSON.stringify(evt.data).slice(0, 240) : undefined,
      onRetry: getRetryHandler(),
    });
    return;
  }

  if (name === "checkout.warning") {
    const detail: string =
      evt?.detail || evt?.data?.detail || "결제 진행 중 경고가 발생했습니다.";
    showPaddleOutcome({
      kind: "warning",
      title: "결제 진행 중 알림",
      reason: detail,
      onRetry: getRetryHandler(),
    });
    return;
  }

  if (name === "checkout.closed") {
    // 결제 완료 후에도 closed 가 발생하므로, 미완료 상태일 때만 취소 안내.
    const status: string | undefined = evt?.data?.status;
    if (status && status !== "completed") {
      showPaddleOutcome({
        kind: "cancelled",
        title: "결제가 취소되었습니다",
        reason: "결제 창이 닫혔습니다. 다시 결제하시려면 아래 재시도 버튼을 눌러 주세요.",
        onRetry: getRetryHandler(),
      });
    }
  }
}

/** Paddle.js를 동적으로 로드하고 초기화한다. */
export async function loadPaddle(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("Paddle은 브라우저 환경에서만 사용할 수 있습니다.");
  }

  const config = await getPaddleConfig();

  if (window.Paddle && initializedToken === config.clientToken) {
    return window.Paddle;
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://cdn.paddle.com/paddle/v2/paddle.js"]'
    );

    const onReady = () => {
      try {
        if (config.environment === "sandbox") {
          window.Paddle.Environment.set("sandbox");
        }

        window.Paddle.Initialize({
          token: config.clientToken,
          eventCallback: (data: any) => {
            // eslint-disable-next-line no-console
            console.log("[Paddle event]", data?.name, data);
            try {
              recordPaddleEvent(data);
            } catch {
              /* ignore storage errors */
            }
            try {
              dispatchOutcomeFromEvent(data);
            } catch {
              /* ignore outcome dispatch errors */
            }
            if (data?.name === "checkout.error" || data?.name === "checkout.warning") {
              // eslint-disable-next-line no-console
              console.error("[Paddle checkout error]", data);
            }
          },
        });

        initializedToken = config.clientToken;
        resolve(window.Paddle);
      } catch (error) {
        reject(error);
      }
    };

    if (existing) {
      if (window.Paddle) onReady();
      else existing.addEventListener("load", onReady, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = onReady;
    script.onerror = () => reject(new Error("Paddle.js 로딩 실패"));
    document.head.appendChild(script);
  }).catch((error) => {
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}

export async function getPaddleEnvironment(): Promise<PaddleEnvironment> {
  const config = await getPaddleConfig();
  return config.environment;
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
  /**
   * 사용자에게 표시할 KRW 환산 금액 (선택).
   * Paddle 체크아웃은 USD 단일 통화로만 표시되므로,
   * 결제 완료/안내 모달에서 KRW도 함께 보여주기 위해 사용한다.
   */
  amountKrw?: number;
}

/**
 * Paddle.js 오버레이 체크아웃을 띄운다.
 * Sandbox는 inline price를 거부하므로 엣지 함수에서 price를 먼저 생성해 priceId로 연다.
 */
export async function openPaddleCheckout(params: OpenCheckoutParams): Promise<void> {
  // Remember last attempt so the outcome dialog can offer "재시도".
  lastCheckoutAttempt = () => openPaddleCheckout(params);

  const [Paddle, environment] = await Promise.all([loadPaddle(), getPaddleEnvironment()]);

  const { data, error } = await supabase.functions.invoke("paddle-create-price", {
    body: {
      amountUsd: params.amountUsd,
      productName: params.productName,
      description: params.productName,
    },
  });

  const priceId = (data as { priceId?: string } | null)?.priceId;
  if (error || !priceId) {
    const detail = (data as { error?: string; detail?: unknown } | null)?.error ?? error?.message;
    showPaddleOutcome({
      kind: "error",
      title: "결제 창을 열 수 없습니다",
      reason: "결제 정보를 준비하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      rawDetail: typeof detail === "string" ? detail : JSON.stringify(detail ?? {}),
      onRetry: getRetryHandler(),
    });
    throw new Error(`Paddle price 생성 실패: ${detail ?? "알 수 없는 오류"}`);
  }

  // eslint-disable-next-line no-console
  console.log("[Paddle] opening checkout", {
    env: environment,
    amountUsd: params.amountUsd,
    productName: params.productName,
    priceId,
    customData: params.customData,
  });

  Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
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
