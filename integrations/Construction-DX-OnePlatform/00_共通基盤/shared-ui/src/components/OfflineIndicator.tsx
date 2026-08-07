import { useEffect, useRef, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '../utils/cn';

export interface OfflineIndicatorProps {
  /** 再接続時にトーストを表示する時間 (ms)。0 で非表示 */
  reconnectToastMs?: number;
  /** オフライン時の表示文言 */
  offlineLabel?: string;
  /** 再接続時の表示文言 */
  onlineLabel?: string;
  /** 追加クラス */
  className?: string;
}

/**
 * `navigator.onLine` を監視し、オフライン時に赤バナー、再接続時にトーストを表示。
 */
export function OfflineIndicator(props: OfflineIndicatorProps): JSX.Element | null {
  const {
    reconnectToastMs = 3000,
    offlineLabel = 'オフラインです。一部の機能は使用できません。',
    onlineLabel = 'オンラインに復帰しました。',
    className,
  } = props;

  const initialOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const [online, setOnline] = useState<boolean>(initialOnline);
  const [showReconnect, setShowReconnect] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handleOnline = (): void => {
      setOnline(true);
      if (reconnectToastMs > 0) {
        setShowReconnect(true);
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          setShowReconnect(false);
          timerRef.current = null;
        }, reconnectToastMs);
      }
    };
    const handleOffline = (): void => {
      setOnline(false);
      setShowReconnect(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [reconnectToastMs]);

  if (online && !showReconnect) return null;

  if (!online) {
    return (
      <div
        role="status"
        aria-live="assertive"
        className={cn(
          'w-full bg-danger text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium',
          className,
        )}
      >
        <WifiOff size={16} aria-hidden="true" />
        <span>{offlineLabel}</span>
      </div>
    );
  }

  // online && showReconnect
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-4 right-4 z-50 bg-success text-white px-4 py-2 rounded-cdx shadow-cdx-md flex items-center gap-2 text-sm',
        className,
      )}
    >
      <Wifi size={16} aria-hidden="true" />
      <span>{onlineLabel}</span>
    </div>
  );
}
