
-- Admin notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update admin notifications"
  ON public.admin_notifications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert admin notifications"
  ON public.admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow system (service role) to insert
CREATE POLICY "System can insert admin notifications"
  ON public.admin_notifications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Trigger function: sync project stats + create notifications
CREATE OR REPLACE FUNCTION public.sync_project_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer_name text;
  v_seller_profile_id uuid;
BEGIN
  -- Get customer name
  SELECT name INTO v_customer_name FROM public.members WHERE id = NEW.customer_id;
  v_seller_profile_id := NEW.seller_id;

  -- On new project creation
  IF TG_OP = 'INSERT' THEN
    -- Update member order_count
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE public.members SET order_count = order_count + 1 WHERE id = NEW.customer_id;
    END IF;

    -- Admin notification
    INSERT INTO public.admin_notifications (title, message, type, metadata)
    VALUES (
      '새 프로젝트 생성',
      COALESCE(v_customer_name, NEW.customer) || ' - ' || NEW.service_title || ' (' || NEW.price || '원)',
      'new_project',
      jsonb_build_object('project_id', NEW.id, 'order_number', NEW.order_number)
    );

    -- Seller notification
    IF v_seller_profile_id IS NOT NULL THEN
      INSERT INTO public.seller_notifications (seller_id, title, message, type, metadata)
      VALUES (
        v_seller_profile_id,
        '새 주문 접수',
        NEW.service_title || ' - ' || NEW.price || '원',
        'new_order',
        jsonb_build_object('project_id', NEW.id)
      );
    END IF;

    RETURN NEW;
  END IF;

  -- On update: check payment_status changes
  IF TG_OP = 'UPDATE' THEN
    -- Payment confirmed (입금완료)
    IF OLD.payment_status != '입금완료' AND NEW.payment_status = '입금완료' THEN
      INSERT INTO public.admin_notifications (title, message, type, metadata)
      VALUES (
        '입금 완료',
        COALESCE(v_customer_name, NEW.customer) || ' - ' || NEW.service_title || ' (' || NEW.price || '원)',
        'payment_confirmed',
        jsonb_build_object('project_id', NEW.id)
      );
    END IF;

    -- Purchase confirmed (구매확정)
    IF OLD.payment_status != '구매확정' AND NEW.payment_status = '구매확정' THEN
      -- Update member total_spent
      IF NEW.customer_id IS NOT NULL THEN
        UPDATE public.members SET total_spent = total_spent + NEW.price WHERE id = NEW.customer_id;
      END IF;

      -- Update seller stats
      IF v_seller_profile_id IS NOT NULL THEN
        UPDATE public.seller_profiles
        SET total_sales = total_sales + 1,
            total_revenue = total_revenue + NEW.price
        WHERE id = v_seller_profile_id;

        -- Seller notification
        INSERT INTO public.seller_notifications (seller_id, title, message, type, metadata)
        VALUES (
          v_seller_profile_id,
          '구매 확정',
          NEW.service_title || ' - ' || NEW.price || '원이 구매확정 되었습니다.',
          'settlement_complete',
          jsonb_build_object('project_id', NEW.id)
        );
      END IF;

      -- Admin notification
      INSERT INTO public.admin_notifications (title, message, type, metadata)
      VALUES (
        '구매 확정',
        COALESCE(v_customer_name, NEW.customer) || ' - ' || NEW.service_title || ' 구매확정',
        'purchase_confirmed',
        jsonb_build_object('project_id', NEW.id)
      );
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_project_stats ON public.projects;
CREATE TRIGGER trigger_sync_project_stats
  AFTER INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_stats();

-- Enable realtime for admin_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
-- Enable realtime for seller_notifications (if not already)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- Enable realtime for projects
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
