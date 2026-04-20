import { useEffect, useState } from "react";

/**
 * KRW → USD 실시간 환율 훅
 * - exchangerate.host (keyless) 1차, open.er-api.com 2차 폴백
 * - localStorage 24시간 캐싱
 * - 모든 요청 실패 시 1300 KRW = 1 USD 폴백
 */

const FALLBACK_KRW_PER_USD = 1300;
const CACHE_KEY = "fx_krw_per_usd_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface CachedRate {
  rate: number;
  ts: number;
}

let inflight: Promise<number> | null = null;

async function fetchFromExchangerateHost(): Promise<number | null> {
  try {
    const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=KRW", {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rate = json?.rates?.KRW;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

async function fetchFromErApi(): Promise<number | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const rate = json?.rates?.KRW;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

export async function getKrwPerUsd(): Promise<number> {
  // 캐시 확인
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached: CachedRate = JSON.parse(raw);
      if (cached?.rate > 0 && Date.now() - cached.ts < CACHE_TTL_MS) {
        return cached.rate;
      }
    }
  } catch {
    // ignore
  }

  if (inflight) return inflight;

  inflight = (async () => {
    const rate =
      (await fetchFromExchangerateHost()) ??
      (await fetchFromErApi()) ??
      FALLBACK_KRW_PER_USD;

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }));
    } catch {
      // ignore
    }
    return rate;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/** KRW 금액을 실시간 환율로 USD(소수 2자리)로 변환 */
export async function convertKrwToUsd(krw: number): Promise<number> {
  const rate = await getKrwPerUsd();
  return Number((krw / rate).toFixed(2));
}

/**
 * 컴포넌트에서 사용할 훅. mount 시 환율 로드.
 * @returns { rate, loading, convert } — convert(krw): USD 즉시 변환
 */
export function useExchangeRate() {
  const [rate, setRate] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached: CachedRate = JSON.parse(raw);
        if (cached?.rate > 0) return cached.rate;
      }
    } catch {
      // ignore
    }
    return FALLBACK_KRW_PER_USD;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getKrwPerUsd()
      .then((r) => {
        if (!cancelled) setRate(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const convert = (krw: number) => Number((krw / rate).toFixed(2));

  return { rate, loading, convert };
}
