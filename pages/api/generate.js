import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "APIキーが設定されていません" });
  }

  const {
    genre,
    target,
    timeSlot,
    atmosphere,
    referencePrograms,
    castImage,
    theme,
    impression,
    freeText,
  } = req.body;

  if (!genre && !theme && !freeText) {
    return res.status(400).json({ error: "番組ジャンルかテーマを入力してください" });
  }

  const prompt = buildPrompt({
    genre,
    target,
    timeSlot,
    atmosphere,
    referencePrograms,
    castImage,
    theme,
    impression,
    freeText,
  });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.status(200).json({ proposal: text });
  } catch (err) {
    console.error("Gemini APIエラー:", err);
    return res.status(500).json({ error: "企画書の生成に失敗しました。しばらく待ってから再試行してください。" });
  }
}

function buildPrompt(fields) {
  const lines = [
    "あなたはテレビ局の凄腕プロデューサーです。",
    "以下のユーザー入力を元に、テレビ局の企画会議に提出できる本格的な番組企画書を作成してください。",
    "",
    "【ユーザー入力】",
  ];

  if (fields.genre)            lines.push(`・番組ジャンル：${fields.genre}`);
  if (fields.target)           lines.push(`・ターゲット視聴者：${fields.target}`);
  if (fields.timeSlot)         lines.push(`・放送時間帯：${fields.timeSlot}`);
  if (fields.atmosphere)       lines.push(`・番組の雰囲気：${fields.atmosphere}`);
  if (fields.referencePrograms) lines.push(`・参考にしたい番組：${fields.referencePrograms}`);
  if (fields.castImage)        lines.push(`・出演者イメージ：${fields.castImage}`);
  if (fields.theme)            lines.push(`・番組で扱いたいテーマ：${fields.theme}`);
  if (fields.impression)       lines.push(`・視聴者に与えたい印象：${fields.impression}`);
  if (fields.freeText)         lines.push(`・その他：${fields.freeText}`);

  lines.push(
    "",
    "【出力形式】",
    "以下の見出しを必ず含め、各項目を具体的かつ説得力のある文章で記述してください。",
    "単なる箇条書きではなく、「なぜこの企画が面白いのか」「誰に刺さるのか」「どう展開できるのか」が伝わる内容にしてください。",
    "",
    "## 番組タイトル案",
    "## 企画意図",
    "## ターゲット視聴者",
    "## 番組概要",
    "## 番組の世界観・トーン",
    "## 番組構成",
    "## 主なコーナー案",
    "## 初回放送内容",
    "## 出演者・MCイメージ",
    "## SNS展開案",
    "## スポンサーとの相性",
    "## 企画の強み",
    "## 想定される視聴者反応",
    "## 改善するとさらに良くなる点",
  );

  return lines.join("\n");
}
