export interface Certificate {
  id: string;
  userId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAtUtc: string;
  pdfUrl: string;
  qrCodeUrl: string;
  verificationUrl: string;
}

export interface VerifyCertificateResult {
  isValid: boolean;
  certificateNumber?: string;
  studentName?: string;
  courseTitle?: string;
  issuedAtUtc?: string;
  organizationName?: string;
  verificationMessage?: string;
}
