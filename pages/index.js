import Head from "next/head";
import { useState } from "react";

const INITIAL_FORM = {
  genre: "",
  target: "",
  timeSlot: "",
  atmosphere: "",
  referencePrograms: "",
  castImage: "",
  theme: "",
  impression: "",
  freeText: "",
};

export default function Home() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [proposal, setProposal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setProposal("");
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
        // スクロールして結果を表示
        setTimeout(() => {
          document.getElementById("result")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch {
      setError("通信エラーが発生しました。ネットワークを確認してください。");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Markdownの ## 見出しをHTMLに変換して表示
  function renderProposal(text) {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("## ")) {
        return <h2 key={i}>{line.replace("## ", "")}</h2>;
      }
      return <p key={i}>{line || " "}</p>;
    });
  }

  return (
    <>
      <Head>
        <title>TV番組企画書ジェネレーター</title>
        <meta name="description" content="AIがテレビ番組の企画書を自動生成します" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="container">
        <header className="header">
          <h1>TV番組企画書ジェネレーター</h1>
          <p>番組のイメージを入力すると、AIが本格的な企画書を自動生成します</p>
        </header>

        <form onSubmit={handleSubmit}>
          {/* 基本情報 */}
          <div className="card">
            <h2>基本情報</h2>
            <div className="grid">
              <div className="field">
                <label>番組ジャンル *</label>
                <input
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  placeholder="例：バラエティ、ドラマ、情報番組、音楽番組"
                  required
                />
              </div>
              <div className="field">
                <label>ターゲット視聴者</label>
                <input
                  name="target"
                  value={form.target}
                  onChange={handleChange}
                  placeholder="例：20〜30代女性、ファミリー層、Z世代"
                />
              </div>
              <div className="field">
                <label>放送時間帯</label>
                <input
                  name="timeSlot"
                  value={form.timeSlot}
                  onChange={handleChange}
                  placeholder="例：月曜21時、土曜夜、日曜朝"
                />
              </div>
              <div className="field">
                <label>番組の雰囲気</label>
                <input
                  name="atmosphere"
                  value={form.atmosphere}
                  onChange={handleChange}
                  placeholder="例：明るく笑える、感動的、知的でクール"
                />
              </div>
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="card">
            <h2>詳細情報</h2>
            <div className="grid">
              <div className="field">
                <label>参考にしたい番組</label>
                <input
                  name="referencePrograms"
                  value={form.referencePrograms}
                  onChange={handleChange}
                  placeholder="例：ガキの使い、逃げ恥、NHKスペシャル"
                />
              </div>
              <div className="field">
                <label>出演者イメージ</label>
                <input
                  name="castImage"
                  value={form.castImage}
                  onChange={handleChange}
                  placeholder="例：若手芸人2名＋女優1名、人気YouTuber"
                />
              </div>
              <div className="field full">
                <label>番組で扱いたいテーマ</label>
                <textarea
                  name="theme"
                  value={form.theme}
                  onChange={handleChange}
                  placeholder="例：普通の人の知られざる仕事の裏側、日本各地のローカルグルメ旅"
                />
              </div>
              <div className="field full">
                <label>視聴者に与えたい印象</label>
                <textarea
                  name="impression"
                  value={form.impression}
                  onChange={handleChange}
                  placeholder="例：見終わったあと前向きな気持ちになれる、毎週楽しみにしてもらえる"
                />
              </div>
              <div className="field full">
                <label>その他・自由入力</label>
                <textarea
                  name="freeText"
                  value={form.freeText}
                  onChange={handleChange}
                  placeholder="その他こだわりたい点や補足があれば自由に記入してください"
                />
              </div>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn-generate" disabled={loading}>
            {loading ? "企画書を生成中..." : "企画書を生成する"}
          </button>
        </form>

        {loading && (
          <div className="loading">
            <div className="spinner" />
            <p>AIが企画書を作成しています...</p>
            <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
              10〜20秒ほどかかる場合があります
            </p>
          </div>
        )}

        {proposal && (
          <div className="result-card" id="result">
            <div className="result-header">
              <h2>生成された企画書</h2>
              <button className="btn-copy" onClick={handleCopy}>
                {copied ? "コピー完了!" : "テキストをコピー"}
              </button>
            </div>
            <div className="proposal-body">{renderProposal(proposal)}</div>
          </div>
        )}
      </main>
    </>
  );
}
