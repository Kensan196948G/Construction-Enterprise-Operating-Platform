/**
 * IndexedDB スキーマ (Dexie.js).
 * 設計書 2.2 を踏襲。
 */
import Dexie, { type Table } from 'dexie';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'error';

export interface ProjectRow {
  id?: number;
  serverId?: number;
  projectCode: string;
  projectName: string;
  status: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface ScheduleTaskRow {
  id?: number;
  serverId?: number;
  projectId: number;
  taskId: string;
  taskName: string;
  parentTaskId?: string;
  plannedStart?: string;
  plannedEnd?: string;
  progressRate: number;
  syncStatus: SyncStatus;
  updatedAt: string;
}

export interface DailyReportRow {
  id?: number;
  serverId?: number;
  projectId: number;
  reportDate: string;
  weather?: string;
  workContent?: unknown[];
  safetyNotes?: string;
  kyRecords?: unknown[];
  syncStatus: SyncStatus;
  updatedAt: string;
}

export interface PhotoRow {
  id?: number;
  serverId?: number;
  projectId: number;
  capturedAt: string;
  blob: Blob;
  category?: string;
  sha256?: string;
  aiTags?: unknown;
  syncStatus: SyncStatus;
}

export interface BlackboardRow {
  id?: number;
  serverId?: number;
  projectName?: string;
  measurementPoint?: string;
  designValue?: string;
  actualValue?: string;
  hashValue?: string;
  recordDate?: string;
  syncStatus: SyncStatus;
}

export interface AttendanceRow {
  id?: number;
  serverId?: number;
  projectId: number;
  workerName: string;
  companyName?: string;
  checkInAt?: string;
  checkOutAt?: string;
  method: string;
  syncStatus: SyncStatus;
}

export interface SyncQueueItem {
  id?: number;
  entityType: string;
  operation: 'create' | 'update' | 'delete';
  entityLocalId: number;
  payload: unknown;
  createdAt: string;
  attempts: number;
}

export class ConstructionDB extends Dexie {
  projects!: Table<ProjectRow, number>;
  schedules!: Table<ScheduleTaskRow, number>;
  dailyReports!: Table<DailyReportRow, number>;
  photos!: Table<PhotoRow, number>;
  blackboards!: Table<BlackboardRow, number>;
  attendances!: Table<AttendanceRow, number>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('ConstructionSiteDB');
    this.version(1).stores({
      projects: '++id, serverId, projectCode, syncStatus',
      schedules: '++id, serverId, projectId, taskId, syncStatus',
      dailyReports: '++id, serverId, projectId, reportDate, syncStatus',
      photos: '++id, serverId, projectId, capturedAt, syncStatus',
      blackboards: '++id, serverId, recordDate, syncStatus',
      attendances: '++id, serverId, projectId, checkInAt, syncStatus',
      syncQueue: '++id, entityType, createdAt',
    });
  }
}

export const db = new ConstructionDB();
