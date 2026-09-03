import { useEffect, useRef, useState } from 'react';
import { getFamilyId, loadRemote, saveRemote } from '../lib/family';

export function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const [ready, setReady] = useState(false);
  const familyId = getFamilyId();
  const firstLoad = useRef(true);

  // 从云端加载（覆写本地缓存）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await loadRemote(familyId, key);
        if (!cancelled && remote !== null && remote !== undefined) {
          setState(JSON.parse(JSON.stringify(remote)) as T);
          localStorage.setItem(key, JSON.stringify(remote));
        }
      } catch {
        // 云端读取失败则用本地缓存
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [familyId, key]);

  // 本地立即持久化
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [key, state]);

  // 云端保存（就绪且非首次加载覆写时）
  useEffect(() => {
    if (!ready || firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    const t = setTimeout(async () => {
      try {
        await saveRemote(familyId, key, state);
      } catch {
        // 忽略云端保存失败
      }
    }, 300);
    return () => clearTimeout(t);
  }, [state, ready, familyId, key]);

  return [state, setState, ready] as const;
}
