// ── Auth ──────────────────────────────────────────────────

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  approval_limit: number | null;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  approval_limit?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ── Workflow ──────────────────────────────────────────────

export type StepType = "SERIAL" | "PARALLEL";
export type ParallelRule = "ALL" | "ANY";
export type ProcessType =
  | "PURCHASE_REQUEST"
  | "SUPPLIER_APPROVAL"
  | "CONTRACT_APPROVAL"
  | "ORDER_APPROVAL";

export interface StepApprover {
  id: number;
  user_id: number;
  approval_limit: number | null;
}

export interface WorkflowStep {
  id: number;
  step_order: number;
  step_type: StepType;
  parallel_rule: ParallelRule | null;
  approvers: StepApprover[];
}

export interface Workflow {
  id: number;
  name: string;
  description: string | null;
  process_type: ProcessType;
  is_active: boolean;
  steps: WorkflowStep[];
}

export interface WorkflowCreate {
  name: string;
  description?: string;
  process_type: ProcessType;
  steps: {
    step_order: number;
    step_type: StepType;
    parallel_rule?: ParallelRule;
    approvers: {
      user_id: number;
      approval_limit?: number;
    }[];
  }[];
}

// ── Request ───────────────────────────────────────────────

export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "REVISED";

export type ActionType =
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "AUTO_APPROVED";

export interface ApprovalRequest {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  workflow_id: number;
  created_by: number;
  status: RequestStatus;
  current_step_order: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface ApprovalAction {
  id: number;
  request_id: number;
  step_id: number | null;
  user_id: number | null;
  action: ActionType;
  comment: string | null;
  created_at: string;
}

export interface RequestCreate {
  title: string;
  description?: string;
  amount: number;
  workflow_id: number;
}