import Head from "next/head";
import { useState } from "react";

const INITIAL_FORM = {
  genre: "", target: "", timeSlot: "", atmosphere: "",
  referencePrograms: "", castImage: "", theme: "", impression: "", freeText: "",
};

// カード配色マッピング
const CARD_COLORS = {
  "番組概要・意図":         "blue",
  "ターゲット・視聴者反応": "green",
  "番組構成":               "sky",
  "主なコーナー案":         "pink",
  "初回放送内容":           "amber",
  "出演者・MCイメージ":     "rose",
  "SNS展開案":              "teal",
  "スポンサーとの相性":     "purple",
  "改善するとさらに良くなる点": "violet",
};

// カードアイコン（SVG path）
const CARD_ICONS = {
  "番組概要・意図":         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.8c.8.6 1 1.4 1 2.2h5c0-.8.2-1.6 1-2.2A6 6 0 0012 3z"/></svg>,
  "ターゲット・視聴者反応": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>,
  "番組構成":               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  "主なコーナー案":         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/></svg>,
  "初回放送内容":           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  "出演者・MCイメージ":     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="3"/><path d="M3 19c.8-3 3.2-5 6-5s5.2 2 6 5"/><circle cx="17" cy="8" r="2.4"/><path d="M14 19c.5-2 2-3.4 4-3.6"/></svg>,
  "SNS展開案":              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="M8 11.5l8-5M8 12.5l8 5"/></svg>,
  "スポンサーとの相性":     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  "改善するとさらに良くなる点": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 3.5a2.1 2.1 0 013 3L8.5 15.5 4 17l1.5-4.5 9-9z"/></svg>,
};

// **太字** をReact要素に変換（1行分）
function renderBoldLine(text, key) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={`${key}-b${i}`}>{part}</strong> : part
  );
}

// テキスト全体を改行・箇条書き対応でレンダリング
function renderBody(text) {
  if (!text) return null;
  const lines = text.split(/\n/);

  // 箇条書き行（・で始まる）が1つ以上あるか判定
  const hasBullets = lines.some(l => l.trimStart().startsWith("・"));

  if (hasBullets) {
    // 箇条書きブロックと通常テキストを分けてレンダリング
    const elements = [];
    const bulletItems = [];

    lines.forEach((line, i) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("・")) {
        bulletItems.push(<li key={i}>{renderBoldLine(trimmed.slice(1).trimStart(), i)}</li>);
      } else {
        if (bulletItems.length > 0) {
          elements.push(<ul key={`ul-${i}`}>{[...bulletItems]}</ul>);
          bulletItems.length = 0;
        }
        if (trimmed) elements.push(<p key={`p-${i}`} style={{margin:"0 0 8px"}}>{renderBoldLine(trimmed, i)}</p>);
      }
    });
    if (bulletItems.length > 0) elements.push(<ul key="ul-last">{bulletItems}</ul>);
    return <>{elements}</>;
  }

  // 通常テキスト（改行を<br>に変換）
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>{renderBoldLine(line, i)}{i < lines.length - 1 && <br />}</span>
      ))}
    </>
  );
}

export default function Home() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setProposal(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
      } else {
        setProposal(data.proposal);
        setTimeout(() => document.getElementById("proposal-section")?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch {
      setError("通信エラーが発生しました。ネットワークを確認してください。");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!proposal) return;
    const text = [
      `【${proposal.title}】`,
      proposal.subtitle,
      "",
      ...(proposal.sections || []).map(s => `■ ${s.key}\n${s.content}`),
    ].join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setProposal(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // sections を3列グリッドの行に分割
  function chunked(arr, size) {
    const result = [];
    for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
    return result;
  }

  return (
    <>
      <Head>
        <title>TV番組企画書ジェネレーター</title>
        <meta name="description" content="AIがテレビ番組の企画書を自動生成します" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="wrap">

        {/* ========== Header ========== */}
        <header className="top">
          <div className="brand">
            <div className="logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8 3 12 7 16 3" />
                <rect x="3" y="7" width="18" height="13" rx="2.2" />
                <circle cx="17.5" cy="17" r="1" fill="#fff" stroke="none" />
              </svg>
            </div>
            <div className="title"><b>TV</b> 番組企画書ジェネレーター</div>
          </div>
          <nav className="top-nav" />
        </header>

        {/* ========== Hero ========== */}
        <section className="hero">
          <div className="left">
            <svg className="spark s1" width="34" height="34" viewBox="0 0 24 24" fill="#ffb84a">
              <path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z" />
            </svg>
            <h1>
              <span className="grad-pink">ひらめき</span><span className="punct">を、</span><br />
              <span className="grad-purple">企画書</span><span className="punct">に。</span>
            </h1>
            <p className="lede">
              あなたの番組アイデアを入力するだけで、<br />
              AIがTV番組の企画書を自動生成します。
            </p>
            <div className="pills">
              <span className="pill">
                <svg className="pi" viewBox="0 0 24 24" fill="none" stroke="#ff5a8a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                アイデアを自由に入力
              </span>
              <span className="pill">
                <svg className="pi" viewBox="0 0 24 24" fill="none" stroke="#7c5cff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.5" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M18.5 5.5l-2 2M7.5 16.5l-2 2" /></svg>
                AIが構成・整理・提案
              </span>
              <span className="pill">
                <svg className="pi" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>
                企画書にすぐ活用！
              </span>
            </div>
          </div>
          <div className="right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-illustration.png"
              alt="TV番組企画書のイメージ"
            />
          </div>
        </section>

        {/* ========== Form ========== */}
        <form onSubmit={handleSubmit}>
          <section className="form-card">
            <div className="form-head">
              <div className="icon-bubble">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 3l1.2 3.2L13.5 7.5l-3.3 1.3L9 12l-1.2-3.2L4.5 7.5l3.3-1.3L9 3z" />
                  <path d="M17 12l.8 2L20 14.8 17.8 15.6 17 17.6 16.2 15.6 14 14.8 16.2 14 17 12z" />
                  <path d="M14 4l.5 1.3L16 5.8l-1.5.5L14 7.6 13.5 6.3 12 5.8l1.5-.5L14 4z" />
                </svg>
              </div>
              <h2>番組アイデアを入力</h2>
            </div>
            <p className="form-sub">
              思いついたキーワードやざっくりした構想でOK！AIが魅力的な企画書に仕上げます。
              <span className="blank-note">空白でも大丈夫！</span>
            </p>

            <div className="grid-2">
              <div className="field">
                <label>
                  <svg className="li" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V4h9l8.6 8.6a.6.6 0 010 .8z"/><circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none"/></svg>
                  番組ジャンル
                </label>
                <input name="genre" value={form.genre} onChange={handleChange} placeholder="例：バラエティ、ドラマ、情報番組、音楽番組" />
              </div>
              <div className="field">
                <label>
                  <svg className="li purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>
                  ターゲット視聴者
                </label>
                <input name="target" value={form.target} onChange={handleChange} placeholder="例：20〜30代女性、ファミリー層、Z世代" />
              </div>
              <div className="field">
                <label>
                  <svg className="li blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                  放送時間帯
                </label>
                <input name="timeSlot" value={form.timeSlot} onChange={handleChange} placeholder="例：月曜21時、土曜夜、日曜朝" />
              </div>
              <div className="field">
                <label>
                  <svg className="li amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none"/><path d="M8.5 14.5c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2"/></svg>
                  番組の雰囲気
                </label>
                <input name="atmosphere" value={form.atmosphere} onChange={handleChange} placeholder="例：明るく笑える、感動的、知的でクール" />
              </div>
              <div className="field">
                <label>
                  <svg className="li" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="14" height="12" rx="2"/><path d="M17 10l4-2v8l-4-2"/></svg>
                  参考にしたい番組
                </label>
                <input name="referencePrograms" value={form.referencePrograms} onChange={handleChange} placeholder="例：ガキの使い、逃げ恥、NHKスペシャル" />
              </div>
              <div className="field">
                <label>
                  <svg className="li purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="3"/><path d="M3 19c.8-3 3.2-5 6-5s5.2 2 6 5"/><circle cx="17" cy="8" r="2.4"/><path d="M14 19c.5-2 2-3.4 4-3.6"/></svg>
                  出演者イメージ
                </label>
                <input name="castImage" value={form.castImage} onChange={handleChange} placeholder="例：若手芸人2名＋女優1名、人気YouTuber" />
              </div>
            </div>

            <div className="gap-row">
              <div className="field full">
                <label>
                  <svg className="li amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.8c.8.6 1 1.4 1 2.2h5c0-.8.2-1.6 1-2.2A6 6 0 0012 3z"/></svg>
                  番組で扱いたいテーマ
                </label>
                <input name="theme" value={form.theme} onChange={handleChange} placeholder="例：普通の人の知られざる仕事の裏側、日本各地のローカルグルメ旅" />
              </div>
              <div className="field full">
                <label>
                  <svg className="li red" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21s-7-4.6-9.3-9.4C1 7.8 3.3 4 7 4c2 0 3.6 1.1 5 2.8C13.4 5.1 15 4 17 4c3.7 0 6 3.8 4.3 7.6C19 16.4 12 21 12 21z"/></svg>
                  視聴者に与えたい印象
                </label>
                <input name="impression" value={form.impression} onChange={handleChange} placeholder="例：見終わったあと前向きな気持ちになれる、毎週楽しみにしてもらえる" />
              </div>
              <div className="field full">
                <label>
                  <svg className="li" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 3.5a2.1 2.1 0 013 3L8.5 15.5 4 17l1.5-4.5 9-9z"/></svg>
                  その他・自由入力
                </label>
                <textarea name="freeText" value={form.freeText} onChange={handleChange} rows="2" placeholder="その他こだわりたい点や補足があれば自由に記入してください" />
              </div>
            </div>
          </section>

          {/* ========== Generate Button ========== */}
          <div className="generate-row">
            <button type="submit" className="btn-generate" disabled={loading}>
              <svg className="spark-ic" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z"/></svg>
              <div className="b-stack">
                <span className="b-title">{loading ? "企画書を生成中..." : "企画書を生成する"}</span>
                <span className="b-sub">AIがプロ品質の企画書を作成します</span>
              </div>
              <svg viewBox="0 0 64 64" fill="none" style={{width:36,height:36,opacity:.85,flexShrink:0}}>
                <rect x="6" y="22" width="52" height="34" rx="3" fill="rgba(255,255,255,.25)"/>
                <path d="M6 22 L58 18 L60 27 L8 31 Z" fill="rgba(255,255,255,.3)"/>
                <path d="M14 21 L20 17 L22 24 L16 28 Z M26 19 L32 15 L34 22 L28 26 Z M38 17 L44 13 L46 20 L40 24 Z M50 15 L56 12 L58 18 L52 22 Z" fill="#fff"/>
              </svg>
            </button>
          </div>

          {error && <div className="error-msg">{error}</div>}
        </form>

        {/* ========== Loading ========== */}
        {loading && (
          <div className="loading-bar">
            <div className="spinner" />
            <p>AIが企画書を生成しています。（1分以上かかる場合があります）</p>
          </div>
        )}

        {/* ========== Proposal Output ========== */}
        {proposal && (
          <div id="proposal-section">
            <div className="proposal-head">
              <h2><span className="sp">✨</span> 生成された企画書</h2>
              <div className="proposal-actions">
                <span className="status">生成完了</span>
                <button className="ibtn" onClick={handleCopy}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/></svg>
                  {copied ? "コピー完了！" : "コピー"}
                </button>
                <button className="ibtn" onClick={handleReset}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></svg>
                  再入力
                </button>
              </div>
            </div>

            <div className="pgrid">
              {/* タイトルカード */}
              <div className="prow r-title">
                <div className="title-card">
                  <svg className="conf-l" viewBox="0 0 60 60"><g fill="none" strokeWidth="2" strokeLinecap="round"><path d="M8 18l4 4M20 8l-4 4M14 6l0 5" stroke="#ffb020"/><circle cx="22" cy="22" r="2" fill="#fff" stroke="none"/><path d="M6 36l5 0M10 44l4-3" stroke="#fff"/></g></svg>
                  <svg className="conf-r" viewBox="0 0 60 60"><g fill="none" strokeWidth="2" strokeLinecap="round"><path d="M8 18l4 4M20 8l-4 4M14 6l0 5" stroke="#ffb020"/><circle cx="22" cy="22" r="2" fill="#fff" stroke="none"/><path d="M6 36l5 0M10 44l4-3" stroke="#fff"/></g></svg>
                  <span className="badge">
                    <svg className="crown" viewBox="0 0 24 24" fill="#f5a623"><path d="M3 19h18l-1.5-9-4 3L12 6 8.5 13l-4-3L3 19z"/></svg>
                    番組タイトル案
                  </span>
                  <div className="big">{proposal.title}</div>
                  {proposal.subtitle && <p style={{color:"rgba(255,255,255,.9)",fontSize:16,fontWeight:600,margin:"4px 0 0"}}>{proposal.subtitle}</p>}
                </div>
              </div>

              {/* セクションカード（3列グリッド） */}
              {chunked(proposal.sections || [], 2).map((row, ri) => (
                <div key={ri} className="prow r-2">
                  {row.map((section) => (
                    <div key={section.key} className={`pcard ${CARD_COLORS[section.key] || "purple"}${section.key === "改善するとさらに良くなる点" ? " span-2" : ""}`}>
                      <h3>
                        {CARD_ICONS[section.key] || null}
                        {section.key}
                      </h3>
                      {section.headline && (
                        <p className="pcard-headline">{renderBoldLine(section.headline, "h")}</p>
                      )}
                      {section.body && (
                        <div className="pcard-body">{renderBody(section.body)}</div>
                      )}
                      {/* フォールバック：旧形式(content)にも対応 */}
                      {!section.headline && section.content && (
                        <div className="pcard-body">{renderBody(section.content)}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
