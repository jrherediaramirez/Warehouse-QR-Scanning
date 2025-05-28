QR Code System Research for Warehouse Operations (May 2025)
Executive Summary
Purpose: To research and recommend technologies and best practices for generating, managing, and scanning QR codes within the warehouse QC system, focusing on durability, printability, and mobile usability.
Key Technologies: react-qr-code (Client-side), qrcode (Server/PDF), jspdf/html2canvas (PDF), @yudiel/react-qr-scanner (Scanning).
Critical Decisions: Utilize High (H) Error Correction Level for durability. Implement PDF batch generation for efficient printing. Adopt @yudiel/react-qr-scanner for mobile integration. Leverage Firestore for comprehensive assignment tracking.
1. QR Generation Libraries 📦
For a Next.js application, a combination of client-side and server-side/build-time generation is often best.

Library	Type	Pros	Cons	Best Use Case
react-qr-code	React Component	Very easy integration in React; SVG-based (scalable); good for UI previews.	Client-side only; less control over raw image formats for PDF.	Live previews in the admin/QC dashboard; displaying existing QR codes.
qrcode	JS Library	Flexible (Node.js/Browser); generates various formats (PNG, SVG, DataURL); fine-grained control over version/ECL.	Requires more setup than a React component; often used server-side or in build scripts.	Batch generation, PDF export, server-side tasks.
qr-code-generator	JS Library	Lightweight; can be faster for simple cases.	Less feature-rich; potentially less maintained/popular than qrcode.	Basic generation if qrcode feels too heavy.

Export to Sheets
Recommendation: Use react-qr-code for UI display/previews and qrcode (likely via a Cloud Function or a dedicated admin interface using its browser capabilities) for batch generation and creating high-quality DataURLs or SVGs for PDF export.

TypeScript

// Using react-qr-code for display
import QRCode from "react-qr-code";

function DisplayQR({ qrId }: { qrId: string }) {
  return <QRCode value={qrId} size={128} level="H" />;
}

// Using qrcode for DataURL (e.g., for PDF)
import QRCodeLib from 'qrcode';

async function getQRDataURL(qrId: string): Promise<string> {
  try {
    // 'H' = High Error Correction Level
    const url = await QRCodeLib.toDataURL(qrId, { errorCorrectionLevel: 'H', width: 300 });
    return url;
  } catch (err) {
    console.error(err);
    return '';
  }
}
2. Print Optimization 🖨️
Generating durable, scannable, and professionally laminated tags requires careful PDF layout.

PDF Generation: Use jspdf combined with html2canvas or directly using qrcode's toDataURL output. jspdf allows precise control over positioning and page layout.
Sizing & Layout:
Size: Aim for 2x2 inches (50x50mm) or 3x3 inches (75x75mm). Larger is generally better for warehouse scanning distances.
Quiet Zone: Ensure a significant white border (at least 4x the module size, or ~1/4 inch) around the QR code. This is critical for scanner reliability.
Layout: For batch printing, arrange QRs in a grid (e.g., 3x4 on an A4/Letter page) using jspdf's positioning functions. Include the human-readable qrId below each code.
Batch Printing:
Generate a list of qrIds.
In a loop, generate each QR code's DataURL using qrcode.
Create a new jsPDF document.
In another loop, use doc.addImage() to place each QR DataURL onto the page at calculated grid coordinates. Add doc.text() for the ID.
Handle page breaks (doc.addPage()) as needed.
Save the PDF (doc.save()).
JavaScript

import jsPDF from 'jspdf';
import QRCodeLib from 'qrcode';

async function generateQRPdf(qrIds: string[]) {
  const doc = new jsPDF();
  const qrSize = 50; // mm
  const margin = 10; // mm
  const padding = 5; // mm
  let x = margin;
  let y = margin;

  for (const qrId of qrIds) {
    const dataUrl = await QRCodeLib.toDataURL(qrId, { errorCorrectionLevel: 'H', width: 200, margin: 2 });
    doc.addImage(dataUrl, 'PNG', x, y, qrSize, qrSize);
    doc.setFontSize(10);
    doc.text(qrId, x + (qrSize / 2), y + qrSize + padding, { align: 'center' });

    x += qrSize + padding;
    if (x + qrSize > doc.internal.pageSize.getWidth() - margin) {
      x = margin;
      y += qrSize + padding * 3;
      if (y + qrSize > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        x = margin;
        y = margin;
      }
    }
  }
  doc.save('Warehouse_QRCodes.pdf');
}
3. Scanning Libraries 📱
Mobile scanning needs to be fast, reliable, and integrated.

Library	Type	Pros	Cons
@yudiel/react-qr-scanner	React Component	Modern, actively maintained, hooks-based, good getUserMedia handling, customizable viewfinder.	Relatively new compared to some others.
react-qr-reader	React Component	Was popular, but check maintenance status.	Might have older dependencies or less modern features.
zxing-js/library	Core JS Library	Powerful, supports many barcode types, highly configurable.	Not a React component; requires more manual integration work.

Export to Sheets
Recommendation: Use @yudiel/react-qr-scanner as it offers a good balance of features and ease of use for React/Next.js.

Integration: Mount the scanner component within your mobile view. Use its onResult prop to handle successful scans.
Error Handling: Implement logic for scans that don't match your qrId format, or handle cases where the camera fails to initialize. Provide clear user feedback.
TypeScript

import { QrScanner } from '@yudiel/react-qr-scanner';

function MobileScanner({ onScan }: { onScan: (result: string) => void }) {
  return (
    <QrScanner
        onDecode={(result) => onScan(result)}
        onError={(error) => console.log(error?.message)}
        constraints={{ facingMode: 'environment' }} // Use rear camera
    />
  );
}
4. Physical Durability 💪
Warehouse environments are harsh. QR codes must withstand abuse.

Error Correction Level (ECL): Always use 'H' (High). This allows the code to be read even if up to 30% of it is damaged or obscured. It increases density but is worth it.
Material:
Avoid Paper: It tears, smudges, and degrades quickly.
Laminated Synthetic Paper: Good balance of cost and durability. Brands like Teslin or Polyart are designed for harsh environments.
Engraved/Etched Metal/Plastic: For extreme durability on permanent assets, though less practical for reusable Hold Tags.
Durable Labels: Industrial-grade polyester or polyimide labels with strong adhesive can work if applied to smooth, clean surfaces (like reusable plastic totes).
Size & Density: Larger codes (3x3 inches) with 'H' ECL are more resilient. Ensure high-contrast printing (black on white).
5. Assignment Tracking 🔗
Your Firestore structure (/qrAssignments/{qrId}) is a good starting point.

Database Pattern: The QRAssignment interface is well-suited.
TypeScript

interface QRAssignment {
  qrId: string;
  currentTagId?: string;
  assignedAt?: string;
  assignedBy?: string;
  isActive: boolean;
  createdAt: string;
  previousAssignments: {
    tagId: string;
    assignedAt: string;
    assignedBy: string;
    unassignedAt: string; // Add this field
    reason: string;
  }[];
}
Reassignment Workflow:
User scans QR, wants to assign to New Tag (HT-5678).
System checks /qrAssignments/{qrId}. Finds currentTagId is HT-1234.
System prompts: "This QR is assigned to HT-1234. Reassign to HT-5678?"
User confirms.
Firestore Batch Write:
Get current QRAssignment document.
Push the currentTagId (HT-1234) into previousAssignments (adding unassignedAt and reason).
Update currentTagId to HT-5678, set new assignedAt, assignedBy.
Commit batch.
Replacement Workflow:
User reports QR-ABC123 (assigned to HT-9999) is damaged.
Admin finds QR-ABC123 in /qrAssignments.
Admin sets isActive: false and adds a note to previousAssignments (or a dedicated field).
Admin gets a new QR (QR-DEF456).
Admin assigns QR-DEF456 to HT-9999.
6. Mobile Camera UX 🤳
A smooth scanning experience is crucial for user adoption.

Permissions:
Request camera access only when the user initiates scanning. Don't ask on page load.
Clearly explain why you need access.
Handle denial gracefully: Show a message explaining how to enable permissions in browser settings.
Lighting & Focus:
Warehouses often have poor/uneven lighting. The scanner needs to work in these conditions.
While controlling the phone's torch via browser APIs is often not feasible or reliable, encourage users to move to better-lit areas if possible.
Ensure the scanner UI provides a clear focus area or viewfinder.
Scan Confirmation:
Visual: Flash the screen, show the qrId, or display a success icon.
Haptic: Use the Vibration API (navigator.vibrate(200);) for a physical cue (test on target devices).
Auditory: Play a short 'beep' sound (use Web Audio API, but consider warehouse noise levels and user preferences).
Feedback: If a scan fails or an invalid QR is scanned, provide immediate, clear feedback (e.g., "Invalid QR Code" or "Scan Failed, Try Again").