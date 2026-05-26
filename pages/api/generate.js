export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "APIキーが設定されていません" });
  }

  const { genre, target, timeSlot, atmosphere, referencePrograms, castImage, theme, impression, freeText } = req.body;

  const hasAnyInput = genre || target || timeSlot || atmosphere || referencePrograms || castImage || theme || impression || freeText;
  if (!hasAnyInput) {
    return res.status(400).json({ error: "少なくとも1つの項目を入力してください" });
  }

  const prompt = buildPrompt({ genre, target, timeSlot, atmosphere, referencePrograms, castImage, theme, impression, freeText });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error("Gemini APIエラー:", errData);
      return res.status(500).json({ error: "企画書の生成に失敗しました。しばらく待ってから再試行してください。" });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let proposal;
    try {
      proposal = JSON.parse(text);
    } catch {
      // JSONパース失敗時はプレーンテキストとして返す
      proposal = { title: "生成結果", subtitle: "", sections: [{ key: "企画書", content: text }] };
    }

    return res.status(200).json({ proposal });
  } catch (err) {
    console.error("Gemini APIエラー:", err);
    return res.status(500).json({ error: "企画書の生成に失敗しました。しばらく待ってから再試行してください。" });
  }
}

function buildPrompt(fields) {
  const lines = [
    "あなたは日本の民放キー局で20年以上の実績を持つ、伝説的なテレビプロデューサーです。",
    "数々のヒット番組を手がけ、視聴率・スポンサー収益・SNS話題性の三拍子を揃えた企画を生み出してきました。",
    "あなたの企画書は「読んだ瞬間に映像が浮かぶ」と評され、企画会議を通過し続けています。",
    "",
    "今回、若手スタッフからのアイデアをもとに、局の企画会議に提出するための完成度の高い番組企画書を作成してください。",
    "単なる説明文ではなく、「なぜ今これをやるべきか」「なぜ他局ではなくうちの局がやるべきか」を感じさせる、熱量と具体性を兼ね備えた文章で書いてください。",
    "",
    "【スタッフからのアイデアメモ】",
  ];

  if (fields.genre)             lines.push(`・番組ジャンル：${fields.genre}`);
  if (fields.target)            lines.push(`・ターゲット視聴者：${fields.target}`);
  if (fields.timeSlot)          lines.push(`・放送時間帯：${fields.timeSlot}`);
  if (fields.atmosphere)        lines.push(`・番組の雰囲気・トーン：${fields.atmosphere}`);
  if (fields.referencePrograms) lines.push(`・参考にしたい既存番組：${fields.referencePrograms}`);
  if (fields.castImage)         lines.push(`・出演者・キャスティングイメージ：${fields.castImage}`);
  if (fields.theme)             lines.push(`・番組で扱いたいテーマ・切り口：${fields.theme}`);
  if (fields.impression)        lines.push(`・視聴者に与えたい印象・感情：${fields.impression}`);
  if (fields.freeText)          lines.push(`・その他のアイデア・こだわり：${fields.freeText}`);

  lines.push(
    "",
    "【各セクションの構成ルール】",
    "各セクションは必ず以下の2フィールドで構成してください：",
    "  headline：そのセクションの内容を一言で言い切る短い見出し文（25〜40字）。番組の個性やコンセプトが伝わるキャッチーな表現にする。重要なキーワードは **キーワード** のようにアスタリスク2つで太字マークアップすること。",
    "  body：以下のルールに従って書くこと：",
    "    - 列挙・比較・手順など複数の要素がある場合は、必ず箇条書きにする。各項目は「・」で始め、改行（\\n）で区切ること。",
    "    - 箇条書きの各項目は「**項目名**：説明」の形式を基本とし、20〜40字程度で簡潔にまとめる。",
    "    - 文章の方が自然な場合（企画意図・番組概要など）は2〜3文の散文でも可。ただし重要語は **太字** でマークアップすること。",
    "    - 箇条書きと散文を混在させる場合は、まず1文のリード文を書き、その後に箇条書きを続ける形にする。",
    "",
    "【出力形式】",
    "必ず以下のJSON形式のみで出力してください。前置きや後書き、説明文は一切不要です。JSONのみ返してください。",
    "",
    `{
  "title": "番組タイトル（インパクトがあり、内容が伝わる日本語タイトル。造語・記号も可）",
  "subtitle": "キャッチコピー（15字以内。番組の魅力を一言で）",
  "sections": [
    { "key": "番組概要・意図",     "headline": "...", "body": "..." },
    { "key": "ターゲット・視聴者反応", "headline": "...", "body": "..." },
    { "key": "番組構成",           "headline": "...", "body": "..." },
    { "key": "主なコーナー案",     "headline": "...", "body": "..." },
    { "key": "初回放送内容",       "headline": "...", "body": "..." },
    { "key": "出演者・MCイメージ", "headline": "...", "body": "..." },
    { "key": "SNS展開案",          "headline": "...", "body": "..." },
    { "key": "スポンサーとの相性", "headline": "...", "body": "..." },
    { "key": "改善するとさらに良くなる点","headline": "...", "body": "..." }
  ]
}`
  );

  return lines.join("\n");
}
