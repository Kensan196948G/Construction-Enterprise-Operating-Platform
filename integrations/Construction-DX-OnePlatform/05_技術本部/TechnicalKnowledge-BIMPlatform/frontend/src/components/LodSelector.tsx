const LODS = ['LOD100', 'LOD200', 'LOD300', 'LOD400', 'LOD500'];

type Props = {
  value: string;
  onChange: (lod: string) => void;
};

export default function LodSelector({ value, onChange }: Props) {
  return (
    <div className="inline-flex gap-1 bg-white rounded shadow p-1">
      {LODS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`px-2 py-1 rounded text-sm ${
            value === l ? 'bg-tech-primary text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
