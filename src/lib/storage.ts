/**
 * Claude Artifact の window.storage.get/set 互換インターフェースを
 * ブラウザの localStorage で実装したラッパー。
 */
export const storage = {
  async get(key: string): Promise<{ value: string } | null> {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key: string, value: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
};
