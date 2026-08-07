import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1",
  timeout: 15000,
});

export const endpoints = {
  // accounting
  accounts: "/accounting/accounts",
  journalEntries: "/accounting/journal-entries",
  trialBalance: "/accounting/trial-balance",
  financialStatements: "/accounting/financial-statements",
  // costs
  costRecords: "/costs/records",
  costByProject: (id: string) => `/costs/by-project/${id}`,
  costBudgets: "/costs/budgets",
  costEvm: "/costs/evm",
  costVariance: (id: string) => `/costs/variance/${id}`,
  // invoices
  invoices: "/invoices",
  invoiceValidate: (no: string) => `/invoices/validate-registration/${no}`,
  // payables / receivables
  payables: "/payables",
  payablesSchedule: "/payables/schedule",
  receivables: "/receivables",
  dunningList: "/receivables/dunning-list",
  // contracts / legal / archives
  contracts: "/contracts",
  contractsExpiring: "/contracts/expiring/list",
  legal: "/legal",
  archives: "/archives",
  // dashboard
  kpi: "/dashboard/kpi",
};
