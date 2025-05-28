// app/types/firebase.ts
import { Timestamp } from 'firebase/firestore'; // Use Firestore Timestamp if needed

export interface HoldTag {
  tagId: string;
  tagNumber: string;
  createdAt: Timestamp | string; // Use Timestamp or string as per your needs
  updatedAt: Timestamp | string;
  date: string;
  upc: string;
  formula: string;
  qualityControl: {
    product: string;
    size: string;
    code: string;
    location: string;
    palletTag: string;
    amount: number;
    reason: string;
    shift: 'A' | 'B' | 'C' | 'D';
    disposition: string;
    signedBy: string;
    qcDate: string;
  };
  latestDisposition: string;
  status: 'open' | 'closed';
}

export interface ProductionLog {
  logId?: string; // Optional: ID might be handled by Firestore
  logEntry: string;
  operatorId: string;
  createdAt: Timestamp | string;
  status: 'pending' | 'approved' | 'denied';
  notes?: string;
}

export interface QRAssignment {
  qrId: string;
  currentTagId?: string | null; // Use null for unassigned
  assignedAt?: Timestamp | string | null;
  assignedBy?: string | null;
  isActive: boolean;
  createdAt: Timestamp | string;
  previousAssignments: {
    tagId: string;
    assignedAt: Timestamp | string;
    assignedBy: string;
    unassignedAt?: Timestamp | string;
    reason?: string;
  }[];
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'qc' | 'user' | 'viewer';
  createdAt: Timestamp | string;
  active: boolean;
}