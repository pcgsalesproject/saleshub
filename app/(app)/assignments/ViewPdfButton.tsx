"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { getDocumentForReprint, getReturnDocumentForReprint } from "@/lib/actions/assets";
import { ACKNOWLEDGED_BY } from "@/lib/acknowledge";
import AcknowledgePdf from "./new/AcknowledgePdf";
import AcknowledgeReturnPdf from "./new/AcknowledgeReturnPdf";

export default function ViewPdfButton({ docNumber, docType = "receive" }: { docNumber: string; docType?: "receive" | "return" }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const blob = docType === "return"
        ? await buildReturnPdf(docNumber)
        : await buildReceivePdf(docNumber);

      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "ไม่สามารถเปิดเอกสารได้");
    } finally {
      setIsLoading(false);
    }
  }

  async function buildReceivePdf(docNumber: string) {
    const doc = await getDocumentForReprint(docNumber);

    return pdf(
      <AcknowledgePdf
        employee={doc.employee}
        assets={doc.assets}
        assignedAt={doc.assignedAt}
        docNumber={doc.docNumber}
        proposedBy={doc.proposedBy}
        endorsedBy={doc.endorsedBy}
        approvedBy={doc.approvedBy}
        acknowledgedBy={ACKNOWLEDGED_BY}
      />
    ).toBlob();
  }

  async function buildReturnPdf(docNumber: string) {
    const doc = await getReturnDocumentForReprint(docNumber);

    return pdf(
      <AcknowledgeReturnPdf
        employee={doc.employee}
        assets={doc.assets}
        returnedAt={doc.returnedAt}
        docNumber={doc.docNumber}
        proposedBy={doc.proposedBy}
        endorsedBy={doc.endorsedBy}
        approvedBy={doc.approvedBy}
        receivedBy={ACKNOWLEDGED_BY}
      />
    ).toBlob();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {isLoading ? "กำลังเปิด…" : "ดู PDF"}
    </button>
  );
}
