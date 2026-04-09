import { useState } from "react";
import { Send, Paperclip, Search } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";

const chatRooms = [
  { id: 1, name: "AI디자인랩", lastMessage: "네, 확인 후 바로 작업 시작하겠습니다.", time: "방금 전", unread: 2 },
  { id: 2, name: "무브스튜디오", lastMessage: "영상 초안 보내드렸습니다. 확인 부탁드려요.", time: "1시간 전", unread: 0 },
  { id: 3, name: "글로벌라이터", lastMessage: "블로그 3편 납품 완료했습니다.", time: "어제", unread: 0 },
];

const messages = [
  { id: 1, sender: "seller", text: "안녕하세요! AI디자인랩입니다. 어떤 도움이 필요하신가요?", time: "오전 10:00" },
  { id: 2, sender: "buyer", text: "로고 디자인 의뢰하고 싶습니다. 브랜드 컨셉은 미니멀하고 모던한 느낌이에요.", time: "오전 10:02" },
  { id: 3, sender: "seller", text: "네, 확인했습니다! 미니멀&모던 컨셉으로 3종 시안을 제작해드리겠습니다. 추가 참고 자료가 있으시면 보내주세요.", time: "오전 10:05" },
  { id: 4, sender: "buyer", text: "참고 이미지 몇 장 보내드릴게요.", time: "오전 10:07" },
  { id: 5, sender: "seller", text: "네, 확인 후 바로 작업 시작하겠습니다.", time: "오전 10:10" },
];

const ChatPage = () => {
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [messageInput, setMessageInput] = useState("");

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">채팅 문의</h1>
        <div className="flex border rounded-xl overflow-hidden bg-card" style={{ height: "calc(100vh - 280px)" }}>
          {/* Chat room list */}
          <div className="w-80 border-r flex flex-col shrink-0">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input placeholder="검색" className="w-full h-9 pl-9 pr-3 rounded-lg border bg-secondary/50 text-sm focus:outline-none" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {chatRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`w-full p-4 text-left border-b hover:bg-accent/50 transition-colors ${selectedRoom === room.id ? "bg-accent" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{room.name}</span>
                    <span className="text-xs text-muted-foreground">{room.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate pr-2">{room.lastMessage}</p>
                    {room.unread > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {room.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b font-medium text-sm">
              {chatRooms.find((r) => r.id === selectedRoom)?.name}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "buyer" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.sender === "buyer" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === "buyer" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <button className="p-2 text-muted-foreground hover:text-foreground">
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  placeholder="메시지를 입력하세요..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 h-10 px-4 rounded-full border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Button size="icon" className="rounded-full shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;
