import React, { useState } from "react";
import { Megaphone, Send, Loader2, CheckCircle2 } from "lucide-react";
import { sendMessAlert } from "@/lib/liveOps";

const TYPES = [
  { key: "queue", label: "Queue" },
  { key: "crowd", label: "Crowd" },
  { key: "menu", label: "Menu" },
  { key: "timing", label: "Timing" },
  { key: "emergency", label: "Emergency" },
];

export default function AlertComposer({ messId, messName }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("queue");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  const send = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setResult("");
    try {
      const res = await sendMessAlert({ messId, title: title.trim(), message: message.trim(), type });
      setResult(`${res?.sent || 0} student${res?.sent === 1 ? "" : "s"} notified`);
      setTitle("");
      setMessage("");
    } catch (err) {
      setResult(err?.response?.data?.error || "Could not send the alert.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={send} className="glass p-5">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-ember" />
        <h3 className="text-base font-semibold text-white">Notify students</h3>
        <span className="ml-auto truncate text-[10px] text-muted-foreground">{messName}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setType(t.key)}
            className={`rounded-full border px-2.5 py-1 text-[10.5px] ${
              type === t.key ? "border-neon/40 bg-neon/10 text-neon" : "border-white/10 text-muted-foreground hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={90}
        placeholder="Alert title"
        className="mt-3 w-full rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white outline-none placeholder:text-muted-foreground/70 focus:border-neon/50"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        maxLength={280}
        placeholder="Short message students will see in the app"
        className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#070d18] px-2.5 py-2 text-[12px] text-white outline-none placeholder:text-muted-foreground/70 focus:border-neon/50"
      />

      <button
        type="submit"
        disabled={sending || !title.trim() || !message.trim()}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-neon px-3 py-2 text-[11.5px] font-semibold text-black disabled:opacity-40"
      >
        {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        {sending ? "Sending…" : "Send to this mess"}
      </button>
      {result && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-neon">
          <CheckCircle2 className="h-3 w-3" /> {result}
        </p>
      )}
    </form>
  );
}