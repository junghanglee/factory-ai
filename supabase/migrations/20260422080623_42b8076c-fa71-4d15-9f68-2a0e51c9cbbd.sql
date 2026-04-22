CREATE TABLE public.paddle_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text,
  event_type text NOT NULL,
  paddle_transaction_id text,
  paddle_adjustment_id text,
  paddle_subscription_id text,
  paddle_customer_id text,
  signature_valid boolean NOT NULL DEFAULT false,
  processing_status text NOT NULL DEFAULT 'received',
  processing_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

CREATE INDEX paddle_webhook_events_received_at_idx
  ON public.paddle_webhook_events (received_at DESC);
CREATE INDEX paddle_webhook_events_event_type_idx
  ON public.paddle_webhook_events (event_type);
CREATE INDEX paddle_webhook_events_paddle_transaction_id_idx
  ON public.paddle_webhook_events (paddle_transaction_id);

ALTER TABLE public.paddle_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view paddle webhook events"
  ON public.paddle_webhook_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage paddle webhook events"
  ON public.paddle_webhook_events
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
