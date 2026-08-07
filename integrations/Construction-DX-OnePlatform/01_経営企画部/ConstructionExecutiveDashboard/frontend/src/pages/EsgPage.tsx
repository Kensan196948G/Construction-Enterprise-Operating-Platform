import { useEffect, useState } from 'react';
import EsgRadar from '../components/EsgRadar';
import KpiTile from '../components/KpiTile';
import { api } from '../api/client';

type Scorecard = {
  environment_score: number;
  social_score: number;
  governance_score: number;
  overall_score: number;
  turnover_rate: number;
  female_manager_ratio: number;
};

export default function EsgPage() {
  const [s, setS] = useState<Scorecard | null>(null);

  useEffect(() => {
    api
      .post<Scorecard>('/esg/scorecard', {
        co2_total_t: 9500,
        co2_target_t: 10000,
        leavers: 12,
        avg_headcount: 480,
        female_managers: 24,
        total_managers: 120,
        compliance_violations: 0,
        partner_score_avg: 78,
      })
      .then((r) => setS(r.data))
      .catch(() => setS(null));
  }, []);

  if (!s) return <div>読み込み中...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">ESG / SDGs ダッシュボード</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile title="ESG 総合" value={s.overall_score.toFixed(1)} unit="/100" />
        <KpiTile title="環境" value={s.environment_score.toFixed(1)} unit="/100" />
        <KpiTile title="社会" value={s.social_score.toFixed(1)} unit="/100" />
        <KpiTile title="ガバナンス" value={s.governance_score.toFixed(1)} unit="/100" />
        <KpiTile title="離職率" value={(s.turnover_rate * 100).toFixed(2)} unit="%" />
        <KpiTile title="女性管理職比率" value={(s.female_manager_ratio * 100).toFixed(1)} unit="%" />
      </div>
      <EsgRadar
        environment={s.environment_score}
        social={s.social_score}
        governance={s.governance_score}
      />
    </div>
  );
}
