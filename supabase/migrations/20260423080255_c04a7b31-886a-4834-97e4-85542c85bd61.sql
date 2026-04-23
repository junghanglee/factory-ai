
-- 1. 사용자 잔액 테이블
CREATE TABLE public.user_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cash_balance INTEGER NOT NULL DEFAULT 0,
  point_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own balance" ON public.user_balances
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage balances" ON public.user_balances
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage balances" ON public.user_balances
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_user_balances_updated_at
  BEFORE UPDATE ON public.user_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. 캐시 거래 내역
CREATE TABLE public.cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'charge', 'use', 'refund'
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cash transactions" ON public.cash_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage cash transactions" ON public.cash_transactions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage cash transactions" ON public.cash_transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_cash_tx_user ON public.cash_transactions(user_id, created_at DESC);

-- 3. 포인트 거래 내역
CREATE TABLE public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'earn', 'use', 'expire', 'coupon'
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own point transactions" ON public.point_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage point transactions" ON public.point_transactions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage point transactions" ON public.point_transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_point_tx_user ON public.point_transactions(user_id, created_at DESC);

-- 4. 쿠폰 테이블
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  point_amount INTEGER NOT NULL DEFAULT 0,
  usage_limit INTEGER NOT NULL DEFAULT 1, -- 0 means unlimited
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view coupons for redemption" ON public.coupons
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. 쿠폰 사용 기록
CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_granted INTEGER NOT NULL DEFAULT 0,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id)
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own redemptions" ON public.coupon_redemptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage redemptions" ON public.coupon_redemptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. 쿠폰 등록 함수 (코드 검증 + 포인트 지급)
CREATE OR REPLACE FUNCTION public.redeem_coupon(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_coupon RECORD;
  v_new_balance INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', '로그인이 필요합니다.');
  END IF;

  SELECT * INTO v_coupon FROM public.coupons WHERE code = _code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', '존재하지 않는 쿠폰 코드입니다.');
  END IF;

  IF NOT v_coupon.active THEN
    RETURN jsonb_build_object('success', false, 'error', '비활성 쿠폰입니다.');
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', '만료된 쿠폰입니다.');
  END IF;

  IF v_coupon.usage_limit > 0 AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN jsonb_build_object('success', false, 'error', '사용 한도를 초과한 쿠폰입니다.');
  END IF;

  -- 중복 사용 방지
  IF EXISTS (SELECT 1 FROM public.coupon_redemptions WHERE coupon_id = v_coupon.id AND user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', '이미 등록한 쿠폰입니다.');
  END IF;

  -- 잔액 행 보장
  INSERT INTO public.user_balances (user_id, cash_balance, point_balance)
  VALUES (v_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- 포인트 적립
  UPDATE public.user_balances
  SET point_balance = point_balance + v_coupon.point_amount,
      updated_at = now()
  WHERE user_id = v_user_id
  RETURNING point_balance INTO v_new_balance;

  -- 거래 기록
  INSERT INTO public.point_transactions (user_id, transaction_type, amount, balance_after, reference_id, description)
  VALUES (v_user_id, 'coupon', v_coupon.point_amount, v_new_balance, v_coupon.id::text, '쿠폰 등록: ' || v_coupon.code);

  -- 쿠폰 사용 기록
  INSERT INTO public.coupon_redemptions (coupon_id, user_id, points_granted)
  VALUES (v_coupon.id, v_user_id, v_coupon.point_amount);

  -- 사용 횟수 증가
  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;

  RETURN jsonb_build_object(
    'success', true,
    'points', v_coupon.point_amount,
    'balance', v_new_balance,
    'message', v_coupon.point_amount || 'P가 적립되었습니다.'
  );
END;
$$;

-- 7. 캐시 충전 함수 (결제 후 호출)
CREATE OR REPLACE FUNCTION public.charge_cash(_user_id UUID, _amount INTEGER, _reference_id TEXT, _description TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  INSERT INTO public.user_balances (user_id, cash_balance, point_balance)
  VALUES (_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_balances
  SET cash_balance = cash_balance + _amount,
      updated_at = now()
  WHERE user_id = _user_id
  RETURNING cash_balance INTO v_new_balance;

  INSERT INTO public.cash_transactions (user_id, transaction_type, amount, balance_after, reference_id, description)
  VALUES (_user_id, 'charge', _amount, v_new_balance, _reference_id, COALESCE(_description, '캐시 충전'));

  RETURN v_new_balance;
END;
$$;

-- 8. 구매확정 시 1% 포인트 자동 지급 트리거
CREATE OR REPLACE FUNCTION public.grant_purchase_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INTEGER;
  v_new_balance INTEGER;
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.payment_status != '구매확정'
     AND NEW.payment_status = '구매확정'
     AND NEW.customer_id IS NOT NULL THEN

    -- members.id 가 아닌 auth user id를 찾아야 함. customer_id가 members.id 라면 변환 필요.
    -- 본 프로젝트에서는 projects.customer_id가 auth.users.id인 경우(직접 결제 RLS) 와 members.id 인 경우가 혼재할 수 있음.
    -- 안전을 위해 user_balances 행이 customer_id로 존재할 때만 적립.
    v_points := FLOOR(NEW.price * 0.01);
    IF v_points <= 0 THEN
      RETURN NEW;
    END IF;

    -- auth.users 존재 여부 확인
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.customer_id) THEN
      INSERT INTO public.user_balances (user_id, cash_balance, point_balance)
      VALUES (NEW.customer_id, 0, 0)
      ON CONFLICT (user_id) DO NOTHING;

      UPDATE public.user_balances
      SET point_balance = point_balance + v_points,
          updated_at = now()
      WHERE user_id = NEW.customer_id
      RETURNING point_balance INTO v_new_balance;

      INSERT INTO public.point_transactions (user_id, transaction_type, amount, balance_after, reference_id, description)
      VALUES (NEW.customer_id, 'earn', v_points, v_new_balance, NEW.id::text,
              '구매확정 적립 (' || NEW.service_title || ')');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_grant_purchase_points
  AFTER UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.grant_purchase_points();
