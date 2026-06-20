import { useState, useEffect, useRef, useCallback } from "react";
import { WS_URL, API_URL } from "../constants/api";
import { supabase } from "../lib/supabase";

export type Message = {
  role: "user" | "assistant" | "separator";
  content: string;
};

export type Challenge = {
  dish: string;
  component: string;
  description: string;
  status: string;
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let lat = 43.6532;
      let lng = -79.3832;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej)
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {}

      const userId = session.user.id;
      const token = session.access_token;
      const url = `${WS_URL}?session_id=${userId}&token=${token}&lat=${lat}&lng=${lng}`;

      ws.current = new WebSocket(url);
      ws.current.onopen = () => setConnected(true);

      ws.current.onmessage = async (event) => {   // ← replace from here
        const data = JSON.parse(event.data);
        if (data.type === "greeting") {
          try {
            const res = await fetch(`${API_URL}/chat/sessions/${data.session_id}/messages`);
            const json = await res.json();

            if (json.messages && json.messages.length > 0) {
              const filtered = json.messages.filter(
                (m: Message) => m.content !== "Please greet me briefly."
              );
              setMessages([
                ...filtered,
                { role: "separator", content: "— resumed —" } as any
              ]);
            } else {
              setMessages([{ role: "assistant", content: data.message }]);
            }
          } catch {
            setMessages([{ role: "assistant", content: data.message }]);
          }
        } else if (data.type === "message") {
          setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
          if (data.challenges) setChallenges(data.challenges);
        }
      };                                          // ← to here

      ws.current.onclose = () => setConnected(false);
    };

    connect();
    return () => ws.current?.close();
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      ws.current.send(text);
    }
  }, []);

  return { messages, challenges, connected, sendMessage };
}