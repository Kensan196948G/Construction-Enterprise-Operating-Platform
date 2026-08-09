/**
 * モックモード判定フラグ
 *
 * `NEXT_PUBLIC_MOCK_MODE=1` のときに true。
 * - `NEXT_PUBLIC_*` はクライアント / サーバー双方で参照できるため、
 *   API クライアント (ブラウザ) と NextAuth (サーバー) を 1 フラグで切替できる。
 * - Next.js はビルド時にこの値を埋め込む。Docker では build-arg で渡す。
 */
export const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === '1';
