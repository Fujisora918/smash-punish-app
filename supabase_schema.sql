-- ============================================================
-- Supabase SQL Editor に貼り付けて実行してください
-- ============================================================

-- ─── ヘルパー関数 ────────────────────────────────────────────

-- updated_at 自動更新トリガー関数
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- friend_code 生成（曖昧文字 0/O/1/I を除いた 32 文字から 7 文字）
CREATE OR REPLACE FUNCTION generate_friend_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  TEXT := '';
  i     INT;
BEGIN
  FOR i IN 1..7 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- auth.users 挿入時に profiles を自動作成（SECURITY DEFINER）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_code TEXT;
  attempts INT := 0;
BEGIN
  LOOP
    new_code := generate_friend_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE friend_code = new_code);
    attempts := attempts + 1;
    IF attempts > 20 THEN
      RAISE EXCEPTION 'Could not generate unique friend_code after 20 attempts';
    END IF;
  END LOOP;

  INSERT INTO public.profiles (id, username, friend_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    new_code
  );
  RETURN NEW;
END;
$$;

-- ─── profiles ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL,
  friend_code TEXT NOT NULL UNIQUE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_friend_code_idx ON profiles(friend_code);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- auth.users 挿入時トリガー
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ─── friend_requests ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS friend_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_friend CHECK (sender_id <> receiver_id),
  CONSTRAINT unique_pair UNIQUE (sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS friend_requests_receiver_idx ON friend_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS friend_requests_sender_idx   ON friend_requests(sender_id, status);

CREATE TRIGGER friend_requests_set_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own friend requests" ON friend_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update status" ON friend_requests
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Sender can cancel request" ON friend_requests
  FOR DELETE USING (auth.uid() = sender_id);

-- フレンド一覧ビュー（双方向）
CREATE OR REPLACE VIEW friends AS
  SELECT sender_id AS user_id, receiver_id AS friend_id
    FROM friend_requests WHERE status = 'accepted'
  UNION ALL
  SELECT receiver_id AS user_id, sender_id AS friend_id
    FROM friend_requests WHERE status = 'accepted';

-- フレンド判定関数（RLS ポリシー内から呼ぶため SECURITY DEFINER）
CREATE OR REPLACE FUNCTION are_friends(user_a UUID, user_b UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friend_requests
    WHERE status = 'accepted'
      AND (
        (sender_id = user_a AND receiver_id = user_b) OR
        (sender_id = user_b AND receiver_id = user_a)
      )
  );
$$;

-- ─── memos ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  content        TEXT DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS memos_user_char ON memos(user_id, character_name);

CREATE TRIGGER memos_set_updated_at
  BEFORE UPDATE ON memos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーをいったん削除してから再作成
DROP POLICY IF EXISTS "Users can select own memos" ON memos;

CREATE POLICY "Owners can select own memos" ON memos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Friends can read memos" ON memos
  FOR SELECT USING (are_friends(auth.uid(), user_id));

CREATE POLICY "Users can insert own memos" ON memos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memos" ON memos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memos" ON memos
  FOR DELETE USING (auth.uid() = user_id);

-- ─── memo_likes ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memo_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_id    UUID NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_like_per_user_per_memo UNIQUE (memo_id, user_id)
);

CREATE INDEX IF NOT EXISTS memo_likes_memo_idx ON memo_likes(memo_id);

ALTER TABLE memo_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memo owner and friends can see likes" ON memo_likes
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = (SELECT user_id FROM memos WHERE id = memo_id)
    OR are_friends(auth.uid(), (SELECT user_id FROM memos WHERE id = memo_id))
  );

CREATE POLICY "Friends can like memos" ON memo_likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND are_friends(auth.uid(), (SELECT user_id FROM memos WHERE id = memo_id))
  );

CREATE POLICY "Users can unlike own likes" ON memo_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ─── memo_comments ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memo_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_id    UUID NOT NULL REFERENCES memos(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS memo_comments_memo_idx ON memo_comments(memo_id, created_at);

CREATE TRIGGER memo_comments_set_updated_at
  BEFORE UPDATE ON memo_comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE memo_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memo owner, friends, and author can see comments" ON memo_comments
  FOR SELECT USING (
    auth.uid() = author_id
    OR auth.uid() = (SELECT user_id FROM memos WHERE id = memo_id)
    OR are_friends(auth.uid(), (SELECT user_id FROM memos WHERE id = memo_id))
  );

CREATE POLICY "Friends and owner can comment" ON memo_comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND (
      auth.uid() = (SELECT user_id FROM memos WHERE id = memo_id)
      OR are_friends(auth.uid(), (SELECT user_id FROM memos WHERE id = memo_id))
    )
  );

CREATE POLICY "Authors can update own comments" ON memo_comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments" ON memo_comments
  FOR DELETE USING (auth.uid() = author_id);
