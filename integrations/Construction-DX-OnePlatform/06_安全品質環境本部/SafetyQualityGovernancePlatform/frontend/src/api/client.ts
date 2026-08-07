import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1",
  timeout: 15000,
});

export const endpoints = {
  nearMiss: "/near-miss",
  nearMissAnalysis: "/near-miss/analysis",
  nearMissFourMSummary: "/near-miss/four-m-summary",
  ky: "/ky-activities",
  accidents: "/accidents",
  accidentsStats: "/accidents/stats",
  accidentsMonthlyTrend: "/accidents/monthly-trend",
  patrols: "/patrols",
  quality: "/quality-records",
  nonconformity: "/nonconformity",
  nonconformityCapaStatus: "/nonconformity/capa-status",
  iso: "/iso-audits",
  isoTemplate: "/iso-audits/checklist-template",
  environment: "/environmental",
  co2: "/environmental/co2",
  aiPredict: "/ai/predict-risk",
};
