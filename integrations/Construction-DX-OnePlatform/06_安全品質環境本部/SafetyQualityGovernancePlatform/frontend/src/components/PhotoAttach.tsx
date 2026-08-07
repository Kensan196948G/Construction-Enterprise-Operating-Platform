import { useState } from "react";

// shared-ui の FileUploader を活用する想定。骨格ではフォールバック実装。
let SharedFileUploader: React.ComponentType<{
  onFiles: (files: File[]) => void;
  accept?: string;
}> | null = null;
try {
  // 動的に shared-ui から取得 (未導入環境ではフォールバック)
  // @ts-expect-error optional dep
  SharedFileUploader = require("@cdx/shared-ui").FileUploader;
} catch {
  /* noop */
}

export interface PhotoAttachProps {
  onPhotos: (files: File[]) => void;
}

export default function PhotoAttach({ onPhotos }: PhotoAttachProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const handle = (files: File[]) => {
    onPhotos(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  if (SharedFileUploader) {
    return <SharedFileUploader onFiles={handle} accept="image/*" />;
  }

  return (
    <div className="border-2 border-dashed rounded-lg p-3 text-center">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => handle(Array.from(e.target.files || []))}
        className="block w-full text-sm"
      />
      <div className="flex flex-wrap gap-2 mt-2">
        {previews.map((src) => (
          <img key={src} src={src} className="h-20 w-20 object-cover rounded" alt="" />
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-1">現場写真 (カメラ起動可)</p>
    </div>
  );
}
