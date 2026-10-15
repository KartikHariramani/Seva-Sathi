import type { BloodGroup } from './index';
import type { BloodComponent } from './nearExpiry';

export type ImportOperation = 'SNAPSHOT' | 'ADJUSTMENT';

export type ImportStatus =
  | 'UPLOADED'
  | 'PARSING'
  | 'REVIEW_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'APPLIED'
  | 'FAILED';

export type RowValidationStatus = 'VALID' | 'UNCERTAIN' | 'INVALID' | 'DUPLICATE';

export interface ExtractedInventoryRow {
  rowId: string;
  rawText: string;
  bloodGroup: BloodGroup | null;
  component: BloodComponent;
  quantity: number;
  unitId?: string;
  collectionDate?: string;
  expiryDate: string;
  confidence: number; // 0.0 to 1.0
  validationStatus: RowValidationStatus;
  validationErrors: string[];
  isCorrected?: boolean;
}

export interface InventoryImportRecord {
  id: string; // IMP-20261015-812
  originalFilename: string;
  fileType: 'csv' | 'excel' | 'pdf' | 'image';
  fileSizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
  bloodBankId: string;
  bloodBankName: string;
  operation: ImportOperation; // 'SNAPSHOT' (replaces baseline) or 'ADJUSTMENT' (adds delta)
  status: ImportStatus;
  totalRows: number;
  validRows: number;
  uncertainRows: number;
  rejectedRows: number;
  records: ExtractedInventoryRow[];
  previewUrl?: string; // base64 or object URL for side-by-side inspection
  auditNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  appliedAt?: string;
}

export interface ColumnMappingConfig {
  bloodGroupCol: string;
  componentCol: string;
  quantityCol: string;
  expiryDateCol: string;
  unitIdCol?: string;
  collectionDateCol?: string;
}
