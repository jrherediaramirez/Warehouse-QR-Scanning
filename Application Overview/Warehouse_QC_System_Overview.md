# Warehouse QC QR-Tag System - Complete AI Development Specification

## Project Context & Technology Stack
**Framework**: Next.js 14+ with App Router  
**Frontend**: React 18+ with TypeScript  
**Styling**: Tailwind CSS  
**Backend**: Firebase (Authentication, Firestore, Cloud Functions)  
**Development Approach**: Component-based, role-based access system with reusable QR infrastructure

---

## Product Overview

### Core Purpose
Replace fragile paper Hold-Tags with a digital system using durable, reusable QR codes that can be assigned to live Firestore Hold Tag records. The system validates every change, maintains audit trails, and enforces role-based access controls with flexible text-based logging.

### Target Users
- **Admins**: Full system access, Hold Tag creation, QR management, user administration
- **QC Technicians**: Quality control operations, Hold Tag creation, QR assignment, approval workflows  
- **Warehouse Users**: Production logging via QR scan, action documentation
- **Viewers**: Read-only access via QR scan (no login required)

### Key Value Proposition
Eliminates paper-based quality control processes with reusable QR infrastructure that provides real-time tracking, flexible text-based logging, audit trails, and role-based workflows for warehouse operations.

---

## Firebase Architecture

### Firestore Collections
```
/holdTags/{tagId}
├── Core metadata (tagId, timestamps, status)
├── Static header (date, upc, formula)  
├── qualityControl{} block (product, location, free-text disposition)
└── latestDisposition (auto-updated from latest approved log)

/holdTags/{tagId}/productionLogs/{logId}
├── Free-text log entries describing actions taken
├── Operator tracking and timestamps
└── Approval workflow (pending/approved/denied)

/holdTags/{tagId}/history/{snapId}
└── WORM audit snapshots of all changes

/qrAssignments/{qrId}
├── Physical QR code to Hold Tag mapping
├── Assignment history and tracking
└── Admin/QC assignment controls

/users/{uid}
├── User profile and role assignment
└── Activity tracking
```

### Authentication & Roles
- **Custom Claims**: Role-based permissions (admin, qc, user, viewer)
- **Security Rules**: Firestore V2 with diff-based field-level access
- **No Self-Signup**: Admin-controlled user creation only
- **QR Management**: Only Admin/QC can assign/reassign QR codes

---

## Data Models & TypeScript Interfaces

### Core Data Structures
```typescript
interface HoldTag {
  // Core metadata (server-set)
  tagId: string;           // "HT-3F6A9B" - UUID or prefixed code
  tagNumber: string;       // "123456" - human readable number
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
  
  // Static header info
  date: string;           // "2025-05-28" - creation date
  upc: string;            // "0123456789012" - 12-13 digits
  formula: string;        // "F05B2" - max 10 chars
  
  // Quality Control block (admin & QC write only)
  qualityControl: {
    product: string;      // "Canola Oil"
    size: string;         // "55lb"
    code: string;         // "CNL-0425"
    location: string;     // "Aisle-12-Bay-3"
    palletTag: string;    // "PAL-778899"
    amount: number;       // >0
    reason: string;       // "Spill – needs sort"
    shift: 'A' | 'B' | 'C' | 'D';
    disposition: string;  // FREE TEXT: "Hold for inspection and sort good cases from damaged ones"
    signedBy: string;     // uid_qcTech01
    qcDate: string;       // ISO date
  };
  
  // Auto-updated summary
  latestDisposition: string;  // Latest approved production log entry
  status: 'open' | 'closed';
}

interface ProductionLog {
  logEntry: string;         // FREE TEXT: "Sorted pallet - found 45 good cases, 12 damaged. Moved good cases to Bay-5."
  operatorId: string;       // auto = auth.uid
  createdAt: string;        // ISO timestamp
  status: 'pending' | 'approved' | 'denied';
  notes?: string;           // QC notes added during approval
}

interface QRAssignment {
  qrId: string;            // Physical QR code identifier (QR-ABC123)
  currentTagId?: string;   // Currently assigned Hold Tag ID
  assignedAt?: string;     // When current assignment was made
  assignedBy?: string;     // Who made the assignment (uid)
  isActive: boolean;       // Whether QR is currently in system
  createdAt: string;       // When QR was first registered
  previousAssignments: {   // History of all assignments
    tagId: string;
    assignedAt: string;
    assignedBy: string;
    unassignedAt?: string;
    reason?: string;       // "Replaced with new tag", "QR damaged", etc.
  }[];
}

interface User {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'qc' | 'user' | 'viewer';
  createdAt: string;
  active: boolean;
}
```

---

## Functional Requirements

### Primary Features
1. **Hold Tag Management**: Create Hold Tags with flexible text-based disposition instructions from QC
2. **Reusable QR System**: Physical QR codes that can be assigned/reassigned to different Hold Tags by Admin/QC
3. **Production Logging**: Free-text log entries where operators describe actions taken and findings
4. **QC Approval Workflow**: Review and approval system for production logs with automatic disposition updates
5. **QR Assignment Control**: Admin/QC can assign QR codes to Hold Tags, reassign them, or remove them from system
6. **Audit Trail**: Complete history tracking with WORM snapshots and QR assignment history

### Secondary Features
- **QR Code Generation**: Create and print custom QR codes with unique IDs for physical lamination
- **Batch QR Creation**: Generate multiple QR codes at once (10, 50, 100+) for warehouse deployment
- **Print-Ready Export**: PDF export with proper sizing and layout for professional lamination
- **Mobile QR Scanning**: Cross-device compatibility for warehouse floor operations
- **QR Management Dashboard**: View all QR codes, their assignments, and status
- **Hold Tag Search**: Find Hold Tags by various criteria independent of QR assignment
- **Assignment History**: Track which QR codes were used for which Hold Tags over time
- **QR Replacement**: Remove damaged/lost QR codes and assign new ones to existing Hold Tags
- **Real-time Updates**: Live data synchronization across all connected devices
- **Offline Capability**: Limited offline functionality for production logging
- **Role-Based Dashboards**: Appropriate interfaces for different user types

---

## QR Code Management System

### QR Assignment Workflow
1. **Physical QR Registration**: Admin registers new QR codes in system (QR-ABC123, QR-DEF456, etc.)
2. **Hold Tag Creation**: Admin/QC creates Hold Tag → gets `tagId` (HT-12345)
3. **QR Assignment**: Admin/QC scans QR code → system shows current assignment → confirms new assignment
4. **Reassignment**: QR can be reassigned to different Hold Tag with replacement confirmation
5. **QR Removal**: QR can be marked inactive (lost/damaged) and replaced with new QR

### Assignment States
- **Unassigned**: QR exists in system but not linked to any Hold Tag
- **Active Assignment**: QR currently linked to an open Hold Tag
- **Historical Assignment**: QR was previously assigned but Hold Tag is now closed
- **Inactive**: QR removed from system (damaged/lost)

### Security & Permissions
- **QR Assignment**: Only Admin/QC roles can assign/reassign QR codes
- **QR Registration**: Only Admin can register new QR codes in system
- **QR Removal**: Only Admin can mark QR codes as inactive
- **Scanning Access**: Any role can scan QR to view assigned Hold Tag

---

## Development Roadmap

### Phase 1: Firebase Foundation Setup
**Objective**: Establish Firebase project with authentication, security rules, and data models
- [ ] Initialize Firebase project with Authentication and Firestore
- [ ] Configure Firestore security rules with role-based access
- [ ] Set up custom claims for user roles
- [ ] Create TypeScript interfaces for all data models
- [ ] Implement Firebase SDK configuration in Next.js
- [ ] Create Firestore indexes for efficient queries

**Success Criteria**: Firebase project configured with proper security rules and TypeScript definitions

---

### Phase 2: Authentication & User Management
**Objective**: Build admin-controlled user creation and role assignment system
- [ ] Create admin user management interface
- [ ] Implement custom claims assignment for roles
- [ ] Build login/logout functionality with role detection
- [ ] Create user profile components with role display
- [ ] Set up protected route middleware based on roles
- [ ] Add user activity tracking

**Success Criteria**: Role-based authentication working with proper access controls

**Dependencies**: Requires completion of Phase 1

---

### Phase 3: Hold Tag Creation & Management
**Objective**: Build Hold Tag creation system independent of QR assignment
- [ ] Create "New Hold Tag" form with validation
- [ ] Implement Hold Tag list/search interface (by tagId, product, date, etc.)
- [ ] Build Hold Tag detail view with edit capabilities
- [ ] Create qualityControl block management for QC users
- [ ] Add free-text disposition field with character limits
- [ ] Implement Hold Tag status management (open/closed)

**Success Criteria**: Admins and QC can create and manage Hold Tags independently of QR codes

**Dependencies**: Requires completion of Phase 2

---

### Phase 4: QR Code Generation & Management System
**Objective**: Build QR code generation, printing, inventory and assignment management
- [ ] Install QR generation library (qrcode + react-qr-code)
- [ ] Create QR code generation interface with unique ID creation
- [ ] Build batch QR generation (10, 50, 100+ codes at once)
- [ ] Implement print-ready PDF export with proper sizing for lamination
- [ ] Add QR code preview and validation before printing
- [ ] Create QR registration interface for admins (generated + manual entry)
- [ ] Build QR assignment dashboard showing all QR codes and their status
- [ ] Implement QR assignment interface (scan QR → assign to Hold Tag)
- [ ] Create QR reassignment workflow with confirmation prompts
- [ ] Add QR removal/replacement functionality
- [ ] Build QR assignment history tracking

**Success Criteria**: Admin/QC can generate, print, register, assign, reassign, and manage QR codes

**Dependencies**: Requires completion of Phase 3

---

### Phase 5: QR Scanning & Dynamic Routing
**Objective**: Enable QR code scanning with dynamic Hold Tag resolution
- [ ] Build QR scanner component (camera integration)
- [ ] Implement QR lookup system (QR → current Hold Tag assignment)
- [ ] Create dynamic routing (scan QR → redirect to assigned Hold Tag)
- [ ] Handle unassigned QR scans (show assignment interface for Admin/QC)
- [ ] Build role-based UI rendering after QR scan
- [ ] Add mobile-responsive design for warehouse floor

**Success Criteria**: QR codes scan and route to appropriate Hold Tag interfaces based on user role

**Dependencies**: Requires completion of Phase 4

---

### Phase 6: Production Logging System
**Objective**: Build free-text production log entry system for warehouse users
- [ ] Create "Add Log Entry" form with large text area
- [ ] Implement text validation (10-1000 characters)
- [ ] Add character counting and formatting preview
- [ ] Build user's production log history view
- [ ] Create pending log management interface
- [ ] Add offline capability for log entry

**Success Criteria**: Users can submit detailed text-based production logs via QR scan

**Dependencies**: Requires completion of Phase 5

---

### Phase 7: QC Approval Workflow
**Objective**: Build review and approval system for production logs
- [ ] Create QC dashboard listing pending logs across all Hold Tags
- [ ] Build log review interface with approve/deny actions
- [ ] Add QC notes field during approval process
- [ ] Implement batch approval capabilities
- [ ] Create approval history tracking
- [ ] Add email/notification system for approvals

**Success Criteria**: QC can review and approve/deny logs with automatic Hold Tag updates

**Dependencies**: Requires completion of Phase 6

---

### Phase 8: Cloud Functions & Automation
**Objective**: Implement server-side validation and automation
- [ ] Create Firestore trigger functions for Hold Tag validation
- [ ] Implement automatic timestamp setting (updatedAt)
- [ ] Build history snapshot creation on mutations
- [ ] Add latestDisposition update automation from approved logs
- [ ] Create QR assignment validation functions
- [ ] Implement audit trail maintenance

**Success Criteria**: All data changes validated and tracked server-side with proper automation

**Dependencies**: Requires completion of Phase 7

---

### Phase 9: Dashboards & Reporting
**Objective**: Build comprehensive dashboards for different user roles
- [ ] Create admin dashboard with system overview and QR management
- [ ] Build QC dashboard with pending approvals and Hold Tag oversight
- [ ] Implement user dashboard with personal activity and assigned tasks
- [ ] Add advanced search and filtering across Hold Tags and QR assignments
- [ ] Create export functionality for compliance reporting
- [ ] Build analytics for QR usage and Hold Tag lifecycle

**Success Criteria**: Role-appropriate dashboards with full system visibility and management capabilities

**Dependencies**: Requires completion of Phase 8

---

## Security & Validation Rules

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() { return request.auth != null; }
    function isAdmin() { return request.auth.token.role == 'admin'; }
    function isQC() { return request.auth.token.role == 'qc'; }
    function isUser() { return request.auth.token.role == 'user'; }
    
    // Hold Tags
    match /holdTags/{tagId} {
      allow get, list: if isSignedIn();
      allow create: if isAdmin() || isQC();
      allow update: if isAdmin() || 
        (isQC() && onlyQCFieldsChanged());
      
      match /productionLogs/{logId} {
        allow create: if isSignedIn() && newLogIsPending() && isOwnOperator();
        allow update: if isAdmin() || isQC(); // approve/deny only
        allow get, list: if isSignedIn();
      }
    }
    
    // QR Assignments - Admin/QC only
    match /qrAssignments/{qrId} {
      allow read: if isSignedIn();
      allow create, update: if isAdmin() || isQC();
      allow delete: if isAdmin(); // Only admin can remove QR codes
    }
    
    // Users - Admin only
    match /users/{uid} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin();
    }
  }
}
```

### Validation Requirements
- **Client-side**: Form schema validation for text length and required fields
- **Server-side**: Cloud Function re-validation of all inputs
- **Business Rules**: 
  - No future dates allowed
  - Amount must be ≥ 0 (only in qualityControl block)
  - logEntry required and must be non-empty string (max 1000 characters)
  - disposition required and must be non-empty string (max 500 characters)
  - QR assignment changes must be tracked in history
  - updatedAt always set by server (never client)
  - Approved/denied logs become immutable

---

## End-to-End Workflow Implementation

### Complete User Journey
1. **QR Registration**: Admin registers physical QR codes in system inventory
2. **Hold Tag Creation**: Admin/QC creates Hold Tag with free-text disposition instructions
3. **QR Assignment**: Admin/QC scans QR code → assigns it to Hold Tag (with replacement confirmation if needed)
4. **QR Scanning**: Warehouse user scans QR → routes to assigned Hold Tag interface
5. **Production Logging**: User writes detailed log entry describing actions taken → creates pending log
6. **QC Review**: QC/Admin reviews production logs → approves/denies with optional notes
7. **Automation**: Cloud Function updates latestDisposition with approved log entry and creates audit snapshot
8. **Hold Tag Closure**: QC closes Hold Tag when work complete
9. **QR Reassignment**: QR can be reassigned to new Hold Tag or removed from system as needed

### QR Management Scenarios
- **New Installation**: Register QR codes → assign to Hold Tags as needed
- **QR Reassignment**: Hold Tag closed → scan QR → assign to new Hold Tag → confirm replacement
- **QR Replacement**: QR damaged → mark inactive → register new QR → assign to existing Hold Tag
- **QR Inventory**: View all QR codes, their current assignments, and usage history

---

## Component Architecture
```
/components
  /auth
    - LoginForm.tsx
    - UserProfile.tsx  
    - ProtectedRoute.tsx
  /holdTags
    - CreateHoldTag.tsx
    - HoldTagList.tsx
    - HoldTagDetail.tsx
    - DispositionForm.tsx
  /qr
    - QRScanner.tsx
    - QRGenerator.tsx
    - QRBatchGenerator.tsx
    - QRPrintLayout.tsx
    - QRAssignmentInterface.tsx
    - QRManagementDashboard.tsx
    - QRRegistration.tsx
    - QRReassignment.tsx
  /production
    - ProductionLogForm.tsx
    - ProductionLogList.tsx
    - LogEntryTextarea.tsx
  /qc
    - QCDashboard.tsx
    - ApprovalInterface.tsx
    - ReviewLog.tsx
    - BatchApproval.tsx
  /admin
    - UserManagement.tsx
    - SystemOverview.tsx
    - QRInventory.tsx
  /ui
    - Loading.tsx
    - ErrorBoundary.tsx
    - ConfirmationModal.tsx
```

---

## AI Development Instructions

### Code Quality Standards
- Use TypeScript for all components with strict mode
- Implement proper error boundaries and loading states
- Follow Firebase best practices for real-time subscriptions
- Use React Hook Form with Zod validation
- Implement optimistic updates with rollback capability
- Add proper offline handling for production logging
- Include comprehensive error handling for QR assignment conflicts

### Required Libraries for QR Generation
```bash
npm install qrcode react-qr-code @types/qrcode
npm install jspdf html2canvas  # For PDF generation
```

### QR Generation Integration
- Use `qrcode` library for server-side QR generation and PDF export
- Use `react-qr-code` for client-side QR preview and display
- Implement batch generation with unique ID creation (QR-001, QR-002, etc.)
- Create print-ready PDF layouts sized for lamination (2"x2" or 3"x3")
- Add QR code validation to ensure scannability before printing

### Firebase Integration Patterns
```typescript
// QR Assignment Hook Example
export function useQRAssignment(qrId: string) {
  const [assignment, setAssignment] = useState<QRAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'qrAssignments', qrId),
      (snapshot) => {
        if (snapshot.exists()) {
          setAssignment({ id: snapshot.id, ...snapshot.data() } as QRAssignment);
        } else {
          setAssignment(null);
        }
        setLoading(false);
      }
    );
    
    return unsubscribe;
  }, [qrId]);
  
  return { assignment, loading };
}

// QR Generation and Registration
export async function generateAndRegisterQRCodes(count: number, prefix: string = 'QR') {
  const qrCodes = [];
  const batch = writeBatch(db);
  
  for (let i = 1; i <= count; i++) {
    const qrId = `${prefix}-${String(i).padStart(3, '0')}`; // QR-001, QR-002, etc.
    const qrRef = doc(db, 'qrAssignments', qrId);
    
    batch.set(qrRef, {
      qrId,
      currentTagId: null,
      isActive: true,
      createdAt: serverTimestamp(),
      assignedAt: null,
      assignedBy: null,
      previousAssignments: []
    });
    
    qrCodes.push(qrId);
  }
  
  await batch.commit();
  return qrCodes;
}

// QR Assignment Function
export async function assignQRToHoldTag(qrId: string, tagId: string, userId: string) {
  const batch = writeBatch(db);
  
  // Update QR assignment
  const qrRef = doc(db, 'qrAssignments', qrId);
  const currentAssignment = await getDoc(qrRef);
  
  if (currentAssignment.exists()) {
    const data = currentAssignment.data();
    batch.update(qrRef, {
      currentTagId: tagId,
      assignedAt: serverTimestamp(),
      assignedBy: userId,
      previousAssignments: [
        ...(data.previousAssignments || []),
        ...(data.currentTagId ? [{
          tagId: data.currentTagId,
          assignedAt: data.assignedAt,
          assignedBy: data.assignedBy,
          unassignedAt: serverTimestamp(),
          reason: 'Reassigned to new Hold Tag'
        }] : [])
      ]
    });
  } else {
    batch.set(qrRef, {
      qrId,
      currentTagId: tagId,
      assignedAt: serverTimestamp(),
      assignedBy: userId,
      isActive: true,
      createdAt: serverTimestamp(),
      previousAssignments: []
    });
  }
  
  await batch.commit();
}

// QR Code Generation Components
import QRCode from 'qrcode';
import QRCodeSVG from 'react-qr-code';

export function QRGenerator({ qrId, size = 200 }: { qrId: string; size?: number }) {
  return (
    <div className="qr-code-container">
      <QRCodeSVG value={qrId} size={size} />
      <p className="text-center mt-2 font-mono">{qrId}</p>
    </div>
  );
}

export async function generateQRCodePDF(qrIds: string[]) {
  // Generate print-ready PDF with multiple QR codes
  // Layout: 4x6 grid per page, proper sizing for lamination
  const canvas = document.createElement('canvas');
  const qrDataUrls = await Promise.all(
    qrIds.map(qrId => QRCode.toDataURL(qrId, { width: 200, margin: 2 }))
  );
  
  // Create PDF layout logic here
  return qrDataUrls;
}
```

### QR Management Security
- Always validate QR assignment permissions on both client and server
- Implement confirmation dialogs for QR reassignment
- Add audit logging for all QR management actions
- Handle QR assignment conflicts gracefully
- Validate Hold Tag existence before QR assignment

---

## Step-by-Step Implementation Protocol

### Phase Initiation
"Starting Phase [X]: [Phase Name]. Previous phase completed: [summary of what was built]. Current objective: [what we're building now]. Key integration points: [how this connects to existing system]. Dependencies verified: [requirements from previous phases]."

### Task Completion  
"Completed: [specific task]. This implements [functionality] and integrates with [existing components]. QR system integration: [how it connects to QR management]. Testing shows [validation results]. Ready for [next task/review]."

### QR Integration Updates
"QR system update: [component] now handles [QR functionality]. Assignment flow: [how QR assignment works]. Security validated: [permission checks confirmed]. Database changes: [Firestore updates made]."

### Issue Resolution
"Issue encountered: [specific problem] in [QR/Hold Tag component]. Root cause: [analysis]. Solution implemented: [fix applied]. QR assignment impact: [any effects on QR system]. Testing confirms [resolution verification]."

---

## Critical Implementation Notes

### QR System Architecture
- QR codes are physical assets managed independently of Hold Tags
- Assignment system allows flexible reuse of QR codes across Hold Tags
- All QR assignments tracked with complete history
- Admin/QC control over QR assignment prevents unauthorized changes

### Mobile & Warehouse Considerations
- Design mobile-first for warehouse floor QR scanning
- Handle poor lighting conditions for QR scanning
- Add haptic feedback for successful QR scans and assignments
- Ensure offline capability for production logging
- Quick QR assignment confirmation flows

### Performance & Scale Requirements
- Real-time updates must render within 500ms
- QR scan to Hold Tag resolution under 2 seconds
- Support 100+ concurrent warehouse users
- Handle 1000+ QR codes in assignment system
- Efficient queries for QR assignment lookups

### Data Integrity
- Prevent orphaned QR assignments
- Maintain referential integrity between QR assignments and Hold Tags
- Audit all QR management actions
- Handle edge cases (QR damaged during active assignment, etc.)

### Demo & Production Deployment
- Generate demo QR codes with sequential IDs (QR-001 through QR-020)
- Create print-ready layouts for lamination at local print shops
- Support both generated QR codes and manually registered existing codes
- Enable batch operations for warehouse deployment scenarios

This comprehensive specification contains everything needed to build the complete Warehouse QC QR-Tag System with reusable QR infrastructure, QR code generation and printing capabilities, and flexible text-based logging. Each phase builds incrementally with clear success criteria and proper QR management integration.