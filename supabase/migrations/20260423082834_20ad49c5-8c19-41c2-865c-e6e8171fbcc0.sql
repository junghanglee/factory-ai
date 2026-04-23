-- 1. 팝업 관리 테이블
CREATE TABLE IF NOT EXISTS public.popups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  link_url TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  position TEXT NOT NULL DEFAULT 'center',
  width INTEGER NOT NULL DEFAULT 480,
  height INTEGER,
  offset_x INTEGER NOT NULL DEFAULT 0,
  offset_y INTEGER NOT NULL DEFAULT 0,
  show_pages TEXT[] NOT NULL DEFAULT ARRAY['/']::TEXT[],
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  show_today_close BOOLEAN NOT NULL DEFAULT true,
  show_close_button BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Popups viewable by everyone"
  ON public.popups FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage popups"
  ON public.popups FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_popups_updated_at
  BEFORE UPDATE ON public.popups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. 팝업 첨부파일용 스토리지 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('popup-files', 'popup-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Popup files publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'popup-files');

CREATE POLICY "Admins can upload popup files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'popup-files' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update popup files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'popup-files' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete popup files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'popup-files' AND has_role(auth.uid(), 'admin'::app_role));

-- 3. 관리자가 회원에게 캐시/포인트 수동 조정하는 RPC
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  _user_id UUID,
  _kind TEXT,            -- 'cash' or 'point'
  _amount INTEGER,       -- 양수 = 지급, 음수 = 차감
  _description TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
  v_tx_type TEXT;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', '관리자 권한이 필요합니다.');
  END IF;

  IF _kind NOT IN ('cash', 'point') THEN
    RETURN jsonb_build_object('success', false, 'error', '잘못된 종류입니다.');
  END IF;

  -- 잔액 행 보장
  INSERT INTO public.user_balances (user_id, cash_balance, point_balance)
  VALUES (_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  v_tx_type := CASE WHEN _amount >= 0 THEN 'admin_grant' ELSE 'admin_deduct' END;

  IF _kind = 'cash' THEN
    UPDATE public.user_balances
    SET cash_balance = GREATEST(0, cash_balance + _amount),
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING cash_balance INTO v_new_balance;

    INSERT INTO public.cash_transactions (user_id, transaction_type, amount, balance_after, description)
    VALUES (_user_id, v_tx_type, _amount, v_new_balance, COALESCE(_description, '관리자 수동 조정'));
  ELSE
    UPDATE public.user_balances
    SET point_balance = GREATEST(0, point_balance + _amount),
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING point_balance INTO v_new_balance;

    INSERT INTO public.point_transactions (user_id, transaction_type, amount, balance_after, description)
    VALUES (_user_id, v_tx_type, _amount, v_new_balance, COALESCE(_description, '관리자 수동 조정'));
  END IF;

  RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$;