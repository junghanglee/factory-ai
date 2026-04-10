-- Auto messages table for admin-configured automatic responses
CREATE TABLE public.auto_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  message TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_messages ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read auto messages (needed for auto-send on room creation)
CREATE POLICY "Authenticated users can view auto messages"
ON public.auto_messages FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage auto messages
CREATE POLICY "Admins can manage auto messages"
ON public.auto_messages FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_auto_messages_updated_at
BEFORE UPDATE ON public.auto_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default auto messages
INSERT INTO public.auto_messages (trigger_type, message, sort_order) VALUES
('new_room', '안녕하세요! AI팩토리입니다 😊\n무엇을 도와드릴까요? 궁금한 점이 있으시면 편하게 말씀해주세요.', 1),
('order_received', '주문이 접수되었습니다! 🎉\n담당자가 확인 후 빠르게 진행하겠습니다. 감사합니다.', 2),
('project_started', '프로젝트 작업이 시작되었습니다! 🔨\n진행 상황은 이 채팅방에서 안내드리겠습니다.', 3);