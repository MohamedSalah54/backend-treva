export enum UserRoles {
  ADMIN = 'admin',
  USER = 'user',
  CLIENT = 'client',
}

export enum TaskStatus {
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  UNDER_REVIEW = 'under_review',
  COMPLETED = "completed",
  REJECTED = 'rejected',
}

export enum AdminDecision {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EDIT_REQUESTED = 'edit_requested',
  UNDER_REVIEW = 'under_review'
}