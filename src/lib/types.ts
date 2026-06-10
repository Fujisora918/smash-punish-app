// ─── DB 行型（snake_case、Supabase カラムに対応） ────────────────────────────

export interface Profile {
  id: string;
  username: string;
  friend_code: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface Memo {
  id: string;
  user_id: string;
  character_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MemoLike {
  id: string;
  memo_id: string;
  user_id: string;
  created_at: string;
}

export interface MemoComment {
  id: string;
  memo_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// ─── JOIN 済み拡張型（UI 用） ────────────────────────────────────────────────

type ProfileSummary = Pick<Profile, "id" | "username" | "friend_code" | "avatar_url">;

export interface FriendRequestWithProfiles extends FriendRequest {
  sender: ProfileSummary;
  receiver: ProfileSummary;
}

export interface MemoWithSocial extends Memo {
  author: Pick<Profile, "id" | "username" | "friend_code">;
  likes_count: number;
  comments_count: number;
  viewer_has_liked: boolean;
}

export interface MemoCommentWithAuthor extends MemoComment {
  author: Pick<Profile, "id" | "username" | "avatar_url">;
}

export interface FriendListItem {
  friend_id: string;
  profile: ProfileSummary;
}

// ─── Insert / Update ペイロード型 ────────────────────────────────────────────

export type InsertMemo = Pick<Memo, "character_name" | "content">;
export type UpdateMemo = Partial<Pick<Memo, "content">>;

export type InsertFriendRequest = Pick<FriendRequest, "receiver_id">;
export type UpdateFriendRequest = Pick<FriendRequest, "status">;

export type InsertMemoLike = Pick<MemoLike, "memo_id">;
export type InsertMemoComment = Pick<MemoComment, "memo_id" | "content">;
export type UpdateMemoComment = Pick<MemoComment, "content">;

export type UpdateProfile = Partial<Pick<Profile, "username" | "avatar_url">>;

// ─── QR コードペイロード ─────────────────────────────────────────────────────

export interface QRPayload {
  friend_code: string;
  username: string;
}
