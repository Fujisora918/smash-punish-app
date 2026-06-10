export interface Fighter {
  id: string;
  name_jp: string;
  name_en: string;
  file_id: string;
}

export interface MoveData {
  startup: number | null;
  total: number | null;
  damage: number | null;
  shield_adv: number | null;
}

export interface AirMoveData {
  startup: number | null;
  total: number | null;
  damage: number | null;
  landing_lag: number | null;
  landing_startup: number | null;
  shield_adv_rising: number | null;
  shield_adv_low: number | null;
}

export interface FrameData {
  fighters: Fighter[];
  ground_moves: Record<string, Record<string, MoveData>>;
  air_moves: Record<string, Record<string, AirMoveData>>;
  punish_moves_front: Record<string, Record<string, number | null>>;
  punish_moves_back: Record<string, Record<string, number | null>>;
}

let _cache: FrameData | null = null;

export async function getFrameData(): Promise<FrameData> {
  if (_cache) return _cache;
  const res = await fetch("/data/frame_data.json");
  _cache = await res.json();
  return _cache!;
}

export interface PunishResult {
  moveName: string;
  startup: number | null;
  margin: number | null;
  confirmed: boolean;
}

export function calcPunishes(
  opponentMove: { shield_adv: number | null },
  myPunishMoves: Record<string, number | null>
): PunishResult[] {
  const shieldAdv = opponentMove.shield_adv;
  if (shieldAdv === null) return [];

  return Object.entries(myPunishMoves)
    .filter(([, startup]) => startup !== null)
    .map(([moveName, startup]) => {
      const margin = shieldAdv - startup!;
      return { moveName, startup: startup!, margin, confirmed: margin >= 0 };
    })
    .sort((a, b) => b.margin - a.margin);
}

export function getOpponentMoves(
  frameData: FrameData,
  characterName: string
): { name: string; shield_adv: number | null; category: "ground" | "air" }[] {
  const moves: { name: string; shield_adv: number | null; category: "ground" | "air" }[] = [];

  const groundMoves = frameData.ground_moves[characterName];
  if (groundMoves) {
    for (const [name, data] of Object.entries(groundMoves)) {
      moves.push({ name, shield_adv: data.shield_adv, category: "ground" });
    }
  }

  const airMoves = frameData.air_moves[characterName];
  if (airMoves) {
    for (const [name, data] of Object.entries(airMoves)) {
      if (data.shield_adv_rising !== null) {
        moves.push({ name: `${name}(上り)`, shield_adv: data.shield_adv_rising, category: "air" });
      }
      if (data.shield_adv_low !== null) {
        moves.push({ name: `${name}(最低空)`, shield_adv: data.shield_adv_low, category: "air" });
      }
    }
  }

  return moves;
}

// 対策メモ用: バリアント名 → 正規キャラ名のマッピング
const MEMO_CHARACTER_MAP: Record<string, string> = {
  "アイスクライマー (1人)": "アイスクライマー",
  "アイスクライマー (2人)": "アイスクライマー",
  "ピクミン&オリマー (赤)": "ピクミン&オリマー",
  "ピクミン&オリマー (黄)": "ピクミン&オリマー",
  "ピクミン&オリマー (青)": "ピクミン&オリマー",
  "ピクミン&オリマー (白)": "ピクミン&オリマー",
  "ピクミン&オリマー (紫)": "ピクミン&オリマー",
  "ルカリオ (0%)": "ルカリオ",
  "ルカリオ (65%)": "ルカリオ",
  "ルカリオ (190%)": "ルカリオ",
  "Wii Fit トレーナー (通常)": "Wii Fit トレーナー",
  "Wii Fit トレーナー (腹式)": "Wii Fit トレーナー",
  "ロゼッタ&チコ (ロゼッタ)": "ロゼッタ&チコ",
  "ロゼッタ&チコ (チコ)": "ロゼッタ&チコ",
  "ルフレ (サンダーソード)": "ルフレ",
  "ルフレ (青銅)": "ルフレ",
  "シュルク (通常)": "シュルク",
  "シュルク (疾)": "シュルク",
  "シュルク (盾)": "シュルク",
  "シュルク (斬)": "シュルク",
  "シュルク (撃)": "シュルク",
  "リュウ": "リュウ",
  "リュウ（強）": "リュウ",
  "ケン": "ケン",
  "ケン（強）": "ケン",
  "ジョーカー": "ジョーカー",
  "ジョーカー (アルセーヌ)": "ジョーカー",
  "勇者（ためる）": "勇者",
  "勇者（バイキルト）": "勇者",
  "勇者（ためるバイキルト）": "勇者",
  "スティーブ（木材）": "スティーブ",
  "スティーブ（石）": "スティーブ",
  "スティーブ（鉄）": "スティーブ",
  "スティーブ（金）": "スティーブ",
  "スティーブ（ダイヤ）": "スティーブ",
  "スティーブ（装備なし）": "スティーブ",
  "セフィロス": "セフィロス",
  "セフィロス（片翼）": "セフィロス",
};

// 対策メモ用: バリアントを統合した重複なしのキャラ一覧を返す
export async function getMemoFighters(): Promise<Fighter[]> {
  const data = await getFrameData();
  const seen = new Set<string>();
  const result: Fighter[] = [];
  for (const f of data.fighters) {
    const canonicalName = MEMO_CHARACTER_MAP[f.name_jp] ?? f.name_jp;
    if (!seen.has(canonicalName)) {
      seen.add(canonicalName);
      result.push({ ...f, name_jp: canonicalName });
    }
  }
  return result;
}

// ExcelのキャラクターNameとPunishシートのNameが異なるケースのマッピング
const NAME_MAP: Record<string, string> = {
  "サムス": "サムス・ダークサムス",
  "ダークサムス": "サムス・ダークサムス",
};

export function getPunishMoveName(name: string): string {
  return NAME_MAP[name] ?? name;
}

// punishシートにデータがないキャラ用のフォールバック（地上技のstartupを使用）
export function buildFallbackPunishMoves(
  frameData: FrameData,
  characterName: string
): Record<string, number | null> {
  const ground = frameData.ground_moves[characterName] ?? {};
  const result: Record<string, number | null> = {};
  for (const [name, data] of Object.entries(ground)) {
    result[name] = data.startup;
  }
  return result;
}
