import { useState } from "react";
import "./media-rights.css";

export type MediaRightsBasis =
  "own" | "licensed" | "permission" | "generated" | "unverified";

export interface MediaRightsDraft {
  basis: MediaRightsBasis;
  source: string;
  holder: string;
  permissionRef: string;
  notes: string;
  confirmed: boolean;
}

export interface MediaRightsRecord extends Omit<MediaRightsDraft, "confirmed"> {
  url: string;
  confirmedAt?: string | null;
  updatedAt?: string;
}

export const emptyMediaRights = (): MediaRightsDraft => ({
  basis: "unverified",
  source: "",
  holder: "",
  permissionRef: "",
  notes: "",
  confirmed: false,
});

export function appendMediaRights(data: FormData, value: MediaRightsDraft) {
  for (const [key, field] of Object.entries(value))
    data.append(key, String(field));
}

const basisLabels: Record<MediaRightsBasis, string> = {
  unverified: "Henüz incelemedim",
  own: "Kendi çekimim / kendi çalışmam",
  licensed: "Lisansla kullanıyorum",
  permission: "Hak sahibinin yazılı izni var",
  generated: "Üretilmiş konsept görsel",
};

function MediaRightsFields({
  value,
  onChange,
  disabled = false,
}: {
  value: MediaRightsDraft;
  onChange: (value: MediaRightsDraft) => void;
  disabled?: boolean;
}) {
  const canConfirm =
    value.basis !== "unverified" &&
    !!value.source.trim() &&
    !!value.holder.trim() &&
    !!value.permissionRef.trim();
  function change<K extends keyof MediaRightsDraft>(
    key: K,
    field: MediaRightsDraft[K],
  ) {
    onChange({ ...value, [key]: field, confirmed: false });
  }
  return (
    <fieldset className="ka-rights-fields" disabled={disabled}>
      <legend>Kaynak ve kullanım bilgisi</legend>
      <label className="ka-field">
        Kullanım dayanağı
        <select
          value={value.basis}
          onChange={(e) => change("basis", e.target.value as MediaRightsBasis)}
        >
          {Object.entries(basisLabels).map(([key, label]) => (
            <option value={key} key={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="ka-field">
        Kaynak / oluşturulma bilgisi
        <input
          value={value.source}
          maxLength={1000}
          onChange={(e) => change("source", e.target.value)}
          placeholder="Çekim tarihi ve yer; lisans sağlayıcısı; üretim aracı"
        />
      </label>
      <label className="ka-field">
        Hak sahibi / üretici
        <input
          value={value.holder}
          maxLength={300}
          onChange={(e) => change("holder", e.target.value)}
          placeholder="Fotoğrafçı, tasarımcı veya lisans veren"
        />
      </label>
      <label className="ka-field">
        İzin / lisans / üretim kayıt referansı
        <input
          value={value.permissionRef}
          maxLength={1000}
          onChange={(e) => change("permissionRef", e.target.value)}
          placeholder="Sözleşme veya fatura no; kendi çekim kaydım; üretim kaydı"
        />
        <small>
          Belgeyi güvenli arşivinizde saklayın. Buraya parolanızı veya gizli
          erişim bağlantısını yazmayın.
        </small>
      </label>
      <label className="ka-field">
        Kullanım kapsamı ve notlar
        <textarea
          rows={2}
          value={value.notes}
          maxLength={2000}
          onChange={(e) => change("notes", e.target.value)}
          placeholder="Ticari web kullanımı, süre, atıf şartı, kişi/mekân izinleri"
        />
      </label>
      <label className="ka-rights-confirm">
        <input
          type="checkbox"
          checked={value.confirmed && canConfirm}
          disabled={!canConfirm}
          onChange={(e) => onChange({ ...value, confirmed: e.target.checked })}
        />
        <span>
          Ticari web kullanımı için gerekli izinleri ve varsa atıf koşullarını
          kontrol ettim.
        </span>
      </label>
      <p className="ka-rights-disclaimer">
        Beyan kaydıdır; hukuki onay değildir. Üretilmiş görsel de üçüncü kişi
        haklarından bağımsızlık garantisi sağlamaz. Atıf gerektiren lisanslarda
        görünür kaynak bilgisini ilgili sayfaya da ekleyin; bu özel kayıt atıf
        şartını karşılamaz.
      </p>
    </fieldset>
  );
}

export function UploadRights({
  value,
  onChange,
  disabled,
}: {
  value: MediaRightsDraft;
  onChange: (value: MediaRightsDraft) => void;
  disabled?: boolean;
}) {
  return (
    <details className="ka-rights-upload">
      <summary>
        Yüklenecek görsellerin kaynak ve kullanım kaydı
        <span>{value.confirmed ? "Beyan hazır" : "İnceleme bekliyor"}</span>
      </summary>
      <p className="ka-rights-intro">
        Bu bilgiler sonraki yüklemelerinize eklenir. Birden fazla görsel
        seçerseniz hepsine aynı beyan uygulanır. Farklı kaynakları ayrı
        yükleyin. Kaydı eksik görselleri yayınlamadan önce inceleyin.
      </p>
      <MediaRightsFields
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </details>
  );
}

export function MediaRightsEditor({
  record,
  onSave,
}: {
  record?: MediaRightsRecord;
  onSave: (value: MediaRightsDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<MediaRightsDraft>(() => ({
    ...emptyMediaRights(),
    ...record,
    confirmed: !!record?.confirmedAt,
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await onSave(draft);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="ka-rights-editor">
      <summary>Kaynak / izin kaydını düzenle</summary>
      <MediaRightsFields
        value={draft}
        onChange={(value) => {
          setDraft(value);
          setSaved(false);
        }}
        disabled={busy}
      />
      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">Beyan kaydı kaydedildi.</p>}
      <button
        type="button"
        className="ka-button secondary"
        disabled={busy}
        onClick={save}
      >
        {busy ? "Kaydediliyor…" : "Beyan kaydını kaydet"}
      </button>
    </details>
  );
}
