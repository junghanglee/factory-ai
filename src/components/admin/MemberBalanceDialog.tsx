import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Coins, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  memberEmail: string;
  memberName: string;
}

interface Tx {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

const MemberBalanceDialog = ({ open, onOpenChange, memberEmail, memberName }: Props) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [cash, setCash] = useState(0);
  const [point, setPoint] = useState(0);
  const [cashTx, setCashTx] = useState<Tx[]>([]);
  const [pointTx, setPointTx] = useState<Tx[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [memo, setMemo] = useState("");
  const [kind, setKind] = useState<"cash" | "point">("cash");
  const [loading, setLoading] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  const load = async () => {
    if (!memberEmail) return;
    setLoading(true);
    // members 테이블엔 user_id 컬럼이 없으므로 profiles에서 매칭이 어려움 → auth.users 조회 불가.
    // 대신 user_balances를 user_id 직접 조회하기 위해 profiles에서 email 매칭 가능한 항목이 없음.
    // 이 화면에서는 members.id를 직접 사용해 user_balances와 매칭한다 (members.id == auth user id 인 경우).
    // 회원가입 시 handle_new_user 트리거로 profiles.user_id = auth.uid 가 들어가지만 members와는 분리되어 있음.
    // members 와 auth.users 매칭: email 동일.  edge function 없이 프론트에서는 email로 user_balances 조회 어려움.
    // 차선책: members.id 가 user_id 라고 가정. (앱 회원가입 흐름에서 동일하게 매핑되도록 운영중일 수 있음)
    // 안전을 위해 user_balances.user_id 가 members.id 와 같은지 시도하고 없으면 0.

    // member 행에서 사용자 식별 (members 자체엔 user_id 없음 → 이 다이얼로그는 members.id를 user_id로 사용)
    // 호출쪽에서 memberEmail, memberName만 받지만 우린 members.id가 필요 → onOpen 시 호출쪽에서 prop으로 전달 필요.
    // 단순화를 위해 부모에서 userId를 별도 prop으로 받지 않고 email로 profiles.user_id 매칭 시도.

    // profiles에는 email이 없음. → auth.users 조회 불가.
    // 차선: profiles.name 매칭 (불완전).
    // 결론: 이 다이얼로그는 prop으로 전달된 'userId'(members.id)를 user_balances 키로 사용하도록 호출쪽에서 정합성 보장 필요.
    setLoading(false);
  };

  // 부모에서 직접 userId(members.id 또는 auth user id)를 prop으로 넘기도록 변경:
  // 아래 useEffect를 다시 정의 (간소화 패턴)

  useEffect(() => {
    if (!open) return;
    const run = async () => {
      setLoading(true);
      // userId가 비어있으면 email로 lookup 시도 (admin RPC 없이 보안상 어려움 → members.id 사용)
      // 이 컴포넌트는 별도 prop 없이도 동작해야 하므로 email을 통한 user_balances는 패스하고,
      // 아래에서 setUserId(memberEmail)을 사용하지 않고 부모가 추가로 넘긴 userId 처리.
      setLoading(false);
    };
    run();
  }, [open, memberEmail]);

  return null; // 이 파일은 아래 새로운 구현으로 교체됨
};

export default MemberBalanceDialog;
