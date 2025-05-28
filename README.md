# Warehouse QC QR-Tag System

> **Digital Quality Control System** - Replace paper Hold-Tags with durable, reusable QR codes linked to live digital records

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18+-blue?logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange?logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript)](https://www.typescriptlang.org/)

## 📋 Overview

Transform warehouse quality control operations from fragile paper-based Hold-Tags to a robust digital system using reusable QR codes. This system provides real-time tracking, flexible text-based logging, audit trails, and role-based workflows designed specifically for warehouse floor operations.

## ✨ Key Features

### 🏷️ **Reusable QR Infrastructure**
- Generate and print durable QR codes for physical lamination
- Assign/reassign QR codes to different Hold Tags as needed
- Complete assignment history and tracking
- QR replacement workflow for damaged tags

### 📱 **Mobile-First Design**
- Optimized for warehouse floor scanning with mobile devices
- Camera integration for QR code scanning
- Offline capability for production logging
- Progressive Web App (PWA) for device installation

### 🔐 **Role-Based Access Control**
- **Admin**: Full system access, user management, QR administration
- **QC Technicians**: Hold Tag creation, QR assignment, approval workflows
- **Warehouse Users**: Production logging via QR scan
- **Viewers**: Read-only access (no login required)

### 📝 **Flexible Logging System**
- Free-text disposition instructions from QC
- Detailed production log entries from operators
- QC review and approval workflow
- Automatic audit trail generation

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS 3
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **QR Generation**: qrcode + react-qr-code libraries
- **Mobile**: PWA with camera integration

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    QR Code Layer                        │
│  Physical QR Tags ←→ Assignment Database ←→ Hold Tags   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                            │
│  Hold Tags → Production Logs → History (Audit Trail)   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                   Access Layer                          │
│     Admin → QC → Warehouse Users → Viewers             │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Workflow Overview

1. **QR Creation** → Admin generates and prints QR codes for lamination
2. **Hold Tag Creation** → QC creates Hold Tag with disposition instructions  
3. **QR Assignment** → QC assigns physical QR code to Hold Tag
4. **Mobile Scanning** → Warehouse users scan QR to access Hold Tag
5. **Production Logging** → Users log actions taken with detailed text entries
6. **QC Review** → QC approves/denies production logs with notes
7. **Automation** → System updates disposition and creates audit snapshots
8. **Tag Closure** → QC closes Hold Tag when work complete

## 📊 Data Models

### Hold Tag
```typescript
interface HoldTag {
  tagId: string;              // "HT-3F6A9B"
  tagNumber: string;          // "123456" 
  qualityControl: {
    product: string;          // "Canola Oil"
    location: string;         // "Aisle-12-Bay-3"
    disposition: string;      // Free text instructions
    // ... other QC fields
  };
  latestDisposition: string;  // Latest approved log entry
  status: 'open' | 'closed';
}
```

### QR Assignment
```typescript
interface QRAssignment {
  qrId: string;              // "QR-ABC123"
  currentTagId?: string;     // Currently assigned Hold Tag
  assignedBy: string;        // Who made assignment
  previousAssignments: [];   // Complete history
}
```

### Production Log
```typescript
interface ProductionLog {
  logEntry: string;          // Free text: "Sorted pallet - found 45 good cases..."
  operatorId: string;        // Who logged the action
  status: 'pending' | 'approved' | 'denied';
  notes?: string;            // QC notes during approval
}
```

## 🚀 Quick Start

```bash
# Clone repository
git clone [repository-url]
cd warehouse-qc-system

# Install dependencies
npm install

# Set up Firebase configuration
cp .env.example .env.local
# Add your Firebase config values

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure

```
warehouse-qc-system/
├── app/                    # Next.js 14 App Router
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── holdTags/      # Hold Tag management
│   │   ├── qr/            # QR generation & scanning
│   │   ├── production/    # Production logging
│   │   └── ui/            # Shared UI components
│   ├── lib/               # Utilities & Firebase config
│   └── types/             # TypeScript definitions
├── research-docs/         # Technical documentation
├── public/                # Static assets
└── README.md
```

## 🔒 Security Features

- **Firebase Security Rules** with role-based field access
- **Custom Claims** for granular permissions
- **Audit Trail** for all data changes
- **Server-side Validation** via Cloud Functions
- **QR Assignment Controls** restricted to Admin/QC roles

## 📱 Mobile Optimizations

- **Camera Integration** for QR scanning
- **Offline Support** for production logging
- **Touch-Optimized UI** for warehouse conditions
- **PWA Installation** for native app experience
- **Responsive Design** across all device sizes

## 🎯 Production Ready

- **Scalable Architecture** supporting 100+ concurrent users
- **Real-time Synchronization** across all devices
- **Error Handling** and user feedback systems
- **Performance Optimization** for mobile networks
- **Compliance Ready** with complete audit trails

## 📖 Documentation

- [Technical Specifications](./research-docs/) - Complete system architecture
- [API Documentation](./docs/api.md) - Firebase collections and functions
- [Deployment Guide](./docs/deployment.md) - Production setup instructions
- [User Guide](./docs/user-guide.md) - Role-based feature documentation

## 🤝 Contributing

This project follows a research-driven development approach. All architectural decisions are documented in `/research-docs/` with current best practices and implementation patterns.

## 📄 License

[Your License Here]

---

**Built for warehouse operations** 🏪 **Designed for durability** 💪 **Optimized for mobile** 📱