import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import "./support-center.css";

type Message = {
  id: string;
  author: "customer" | "staff";
  authorName: string;
  message: string;
  createdAt: string;
};
type Ticket = {
  id: string;
  inquiryId?: string | null;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  messageCount?: number;
};
type Inquiry = { id: string; product?: string; subject?: string };
const states: Record<string, string> = {
  open: "Talebiniz alındı",
  in_progress: "İnceleniyor",
  waiting_customer: "Yanıtınız bekleniyor",
  resolved: "Çözüldü",
};
const categories: Record<string, string> = {
  account: "Hesap / giriş sorunu",
  technical: "Teknik destek",
  quotation: "Teklif / fiyat sorusu",
  document: "Dosya / belge sorunu",
  other: "Diğer",
};
const reference = (value: string) => "#" + value.slice(0, 8).toUpperCase();
const date = (value?: string) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
const json = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch("/api/customer/support-tickets" + path, {
    ...options,
    credentials: "same-origin",
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Sunucu yanıtı okunamadı." }));
  if (!response.ok) throw new Error(data.error || "İşlem tamamlanamadı.");
  return data as T;
}
export default function SupportCenter({
  inquiries,
  scoped = false,
}: {
  inquiries: Inquiry[];
  scoped?: boolean;
}) {
  const [tickets, setTickets] = useState<Ticket[]>([]),
    [selected, setSelected] = useState(""),
    [creating, setCreating] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const result = await api<{ tickets: Ticket[] }>("");
      setTickets(result.tickets);
      setSelected((current) =>
        result.tickets.some((ticket) => ticket.id === current) ? current : "",
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const created = (ticket: Ticket) => {
    setCreating(false);
    setSelected(ticket.id);
    setNotice(
      "Destek kaydınız oluşturuldu. Yanıtları buradan takip edebilirsiniz.",
    );
    void load();
  };
  return (
    <section className="cp-panel sc-center">
      <div className="cp-section-heading">
        <div>
          <span className="sc-eyebrow">BİZE YAZIN</span>
          <h2>Destek & hesap sorunları</h2>
          <p>
            Hesap, dosya, teklif veya teknik sorunlarınızı tek konuşmada takip
            edin.
          </p>
        </div>
        <button
          type="button"
          className="cp-refresh"
          disabled={busy}
          aria-label="Destek kayıtlarımı yenile"
          onClick={() => void load()}
        >
          <RefreshCw size={16} className={busy ? "cp-spin" : ""} />
        </button>
      </div>
      <div className="sc-help">
        <HelpCircle size={20} />
        <p>
          <strong>Nasıl kullanılır?</strong> Yeni bir kayıt açıp sorununuzu
          anlatın. İlgili proje talebinizi seçerseniz ekibimiz dosya ve
          teklifleriyle birlikte inceleyebilir. Parola, doğrulama kodu veya kart
          bilgisi yazmayın.{" "}
          {scoped &&
            "Bu takip oturumu yalnızca kendi talebinizin destek kayıtlarını açar."}
        </p>
      </div>
      {error && (
        <p className="cp-alert error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="cp-alert success" role="status">
          <CheckCircle2 size={16} />
          {notice}
        </p>
      )}
      <div className="sc-toolbar">
        <span>
          {tickets.filter((ticket) => ticket.status !== "resolved").length} açık
          destek kaydı
        </span>
        <button
          type="button"
          className="cp-button primary"
          onClick={() => {
            setCreating(true);
            setSelected("");
            setNotice("");
          }}
        >
          <Plus size={16} />
          Yeni destek kaydı
        </button>
      </div>
      {creating ? (
        <NewTicket
          inquiries={inquiries}
          scoped={scoped}
          onCreated={created}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <div className="sc-layout">
          <div className="sc-ticket-list">
            {tickets.length ? (
              tickets.map((ticket) => (
                <button
                  type="button"
                  className={`sc-ticket ${selected === ticket.id ? "selected" : ""}`}
                  onClick={() => setSelected(ticket.id)}
                  key={ticket.id}
                >
                  <span>
                    <strong>{ticket.subject}</strong>
                    <small>
                      {reference(ticket.id)} ·{" "}
                      {categories[ticket.category] || "Destek"}
                    </small>
                    <small>{date(ticket.updatedAt)}</small>
                  </span>
                  <span
                    className={`sc-status ${ticket.status === "resolved" ? "resolved" : ""}`}
                  >
                    {states[ticket.status] || ticket.status}
                  </span>
                </button>
              ))
            ) : busy ? (
              <p className="sc-empty">
                <Loader2 className="cp-spin" size={20} />
                Kayıtlar yükleniyor…
              </p>
            ) : (
              <div className="sc-empty">
                <MessageSquare size={30} />
                <h3>Henüz destek kaydınız yok</h3>
                <p>Bir sorun yaşadığınızda yeni destek kaydı açabilirsiniz.</p>
              </div>
            )}
          </div>
          <div className="sc-conversation">
            {selected ? (
              <Conversation
                key={selected}
                id={selected}
                onChanged={() => void load()}
              />
            ) : (
              <div className="sc-empty">
                <ShieldCheck size={30} />
                <h3>Güvenli destek alanınız</h3>
                <p>
                  Konuşmayı açmak için bir kayıt seçin. Yalnızca size ait destek
                  kayıtları görüntülenir.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
function NewTicket({
  inquiries,
  scoped,
  onCreated,
  onCancel,
}: {
  inquiries: Inquiry[];
  scoped: boolean;
  onCreated: (ticket: Ticket) => void;
  onCancel: () => void;
}) {
  const [subject, setSubject] = useState(""),
    [category, setCategory] = useState("account"),
    [message, setMessage] = useState(""),
    [inquiryId, setInquiryId] = useState(scoped ? inquiries[0]?.id || "" : ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ ticket: Ticket }>(
        "",
        json({
          subject,
          category,
          message,
          ...(inquiryId ? { inquiryId } : {}),
        }),
      );
      onCreated(result.ticket);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="sc-new cp-form" onSubmit={submit}>
      <div className="sc-form-heading">
        <h3>Yeni destek kaydı</h3>
        <button
          type="button"
          aria-label="Yeni destek kaydını kapat"
          className="sc-icon"
          disabled={busy}
          onClick={onCancel}
        >
          <X size={18} />
        </button>
      </div>
      {error && (
        <p className="cp-alert error" role="alert">
          {error}
        </p>
      )}
      <label>
        Kısa konu başlığı
        <input
          required
          minLength={3}
          maxLength={160}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Örn. Teklif PDF dosyamı açamıyorum"
        />
      </label>
      <div className="sc-fields">
        <label>
          Sorun türü
          <select
            aria-label="Sorun türü"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {Object.entries(categories).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          İlgili talebiniz
          <select
            aria-label="İlgili talebiniz"
            value={inquiryId}
            onChange={(event) => setInquiryId(event.target.value)}
            required={scoped}
          >
            {!scoped && <option value="">Genel hesap desteği</option>}
            {inquiries.map((inquiry) => (
              <option value={inquiry.id} key={inquiry.id}>
                {reference(inquiry.id)} ·{" "}
                {inquiry.product || inquiry.subject || "Talebim"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Sorununuzu anlatın
        <textarea
          aria-label="Sorununuzu anlatın"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Hangi işlemi yaparken ne olduğunu ve varsa hata metnini yazın. Parolanızı paylaşmayın."
        />
        <small>
          {message.length}/4000 karakter · Bu alandan dosya yüklenmez; mevcut
          proje dosyalarınız ilgili talebinizde korunur.
        </small>
      </label>
      <div className="sc-actions">
        <button className="cp-button primary" type="submit" disabled={busy}>
          {busy ? (
            <Loader2 className="cp-spin" size={16} />
          ) : (
            <Send size={16} />
          )}
          Destek kaydını gönder
        </button>
        <button
          type="button"
          className="cp-button secondary"
          disabled={busy}
          onClick={onCancel}
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
function Conversation({
  id,
  onChanged,
}: {
  id: string;
  onChanged: () => void;
}) {
  const [ticket, setTicket] = useState<Ticket | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const result = await api<{ ticket: Ticket }>("/" + id);
      setTicket(result.ticket);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);
  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 30000);
    return () => clearInterval(timer);
  }, [load]);
  async function reply(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ ticket: Ticket }>(
        `/${id}/messages`,
        json({ message }),
      );
      setTicket(result.ticket);
      setMessage("");
      setNotice("Mesajınız destek kaydına eklendi.");
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {error && (
        <p className="cp-alert error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="cp-alert success" role="status">
          {notice}
        </p>
      )}
      {ticket ? (
        <>
          <header className="sc-thread-heading">
            <small>{reference(ticket.id)}</small>
            <h3>{ticket.subject}</h3>
            <span
              className={`sc-status ${ticket.status === "resolved" ? "resolved" : ""}`}
            >
              {states[ticket.status] || ticket.status}
            </span>
            <p>
              {date(ticket.createdAt)}
              {ticket.inquiryId
                ? ` · Talep ${reference(ticket.inquiryId)}`
                : " · Genel hesap desteği"}
            </p>
          </header>
          <div className="sc-thread" aria-label="Destek mesajlarınız">
            {(ticket.messages || []).map((item) => (
              <article
                key={item.id}
                className={`sc-message ${item.author === "customer" ? "mine" : ""}`}
              >
                <div>
                  <strong>
                    {item.author === "customer" ? "Siz" : "Kılınç Dekorasyon"}
                  </strong>
                  <small>{date(item.createdAt)}</small>
                </div>
                <p>{item.message}</p>
              </article>
            ))}
          </div>
          <form className="sc-reply cp-form" onSubmit={reply}>
            <label>
              Mesajınız
              <textarea
                aria-label="Mesajınız"
                required
                minLength={2}
                maxLength={4000}
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                  ticket.status === "resolved"
                    ? "Sorun devam ediyorsa yazın; kaydınız yeniden açılır."
                    : "Ek bilgi veya yanıtınızı yazın…"
                }
              />
            </label>
            <button type="submit" className="cp-button primary" disabled={busy}>
              {busy ? (
                <Loader2 size={16} className="cp-spin" />
              ) : (
                <Send size={16} />
              )}
              Mesajı gönder
            </button>
            <small>
              Yanıtlar açık destek ekranında yaklaşık 30 saniyede yenilenir.
            </small>
          </form>
        </>
      ) : (
        !error && (
          <div className="sc-empty">
            <Loader2 size={20} className="cp-spin" />
            Konuşma yükleniyor…
          </div>
        )
      )}
    </>
  );
}
