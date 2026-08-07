import Dexie, { type Table } from "dexie";

export interface OfflineNearMiss {
  id?: number;
  occurred_at: string;
  description: string;
  cause_analysis: { man: boolean; machine: boolean; material: boolean; method: boolean };
  risk_level: "high" | "medium" | "low";
  synced: 0 | 1;
}

export interface OfflineKy {
  id?: number;
  activity_date: string;
  work_content: string;
  hazards: Array<{ hazard: string; risk_rank: string; measure?: string }>;
  synced: 0 | 1;
}

export interface OfflinePatrol {
  id?: number;
  patrol_date: string;
  inspector_id?: string;
  checklist: Array<{ item: string; result: string; comment?: string }>;
  overall_rating: string;
  synced: 0 | 1;
}

class SqDB extends Dexie {
  near_miss!: Table<OfflineNearMiss, number>;
  ky!: Table<OfflineKy, number>;
  patrol!: Table<OfflinePatrol, number>;

  constructor() {
    super("sq-offline");
    this.version(1).stores({
      near_miss: "++id, occurred_at, synced",
      ky: "++id, activity_date, synced",
      patrol: "++id, patrol_date, synced",
    });
  }
}

export const db = new SqDB();
