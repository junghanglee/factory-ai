import { useState } from "react";
import { Send } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";

const chatRooms = [
  { id: 1, customer: "김민수", lastMessage: "로고 시안 언제 받을 수 있나요?", time: "방금 전", unread: 1 },
  { id: 2, customer: "이지은", lastMessage: "영상 초안 확인했습니다.", time: "30분 전", unread: 0 },
  { id: 3, customer: "박준영", lastMessage: "감사합니다!", time: "1시간 전", unread: 0 },
];

const messages = [
  { sender: "customer", text: "안녕하세요, 로고 디자인 의뢰한 김민수입니다.", time: "10:00" },
  { sender: "customer", text: "시안은 언제쯤 받아볼 수 있을까요?", time: "10:01" },
  { sender: "admin", text: "안녕하세요! 현재 작업 중이며, 오늘 오후까지 초안을 보내드리겠습니다.", time: "10:05" },
  { sender: "customer", text: "로고 시안 언제 받을 수 있나요?", time: "10:30" },
];

const AdminChat = () => {
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [input, setInput] = useState("");

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">채팅 관리</h1>
      <div className="flex border rounded-xl overflow-hidden bg-card" style={{ height: "calc(100vh - 200px)" }}>
        <div className="w-72 border-r flex flex-col shrink-0">
          {chatRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`w-full p-4 text-left border-b hover:bg-accent/50 transition-colors ${selectedRoom === room.id ? "bg-accent" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{room.customer}</span>
                <span className="text-xs text-muted-foreground">{room.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate pr-2">{room.lastMessage}</p>
                {room.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{room.unread}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b font-medium text-sm">
            {chatRooms.find((r) => r.id === selectedRoom)?.customer}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="답변을 입력하세요..."
              className="flex-1 h-10 px-4 rounded-full border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button size="icon" className="rounded-full shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChat;
