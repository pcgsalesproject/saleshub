"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Asset, AssetType } from "@/lib/types";
import SubmitButton from "@/components/SubmitButton";
import { regenerateAssetTag } from "@/lib/actions/assets";

interface Props {
  action: (formData: FormData) => Promise<void>;
  assetTypes: AssetType[];
  asset?: Asset;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-sm font-semibold text-[#102E5A] uppercase tracking-wide whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const inputCls = "input";

const RANDOM_TAG_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

function generateAssetTag(typeId: string) {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += RANDOM_TAG_CHARS[Math.floor(Math.random() * RANDOM_TAG_CHARS.length)];
  }
  return `A${typeId}${suffix}`;
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function AssetForm({ action, assetTypes, asset }: Props) {
  const [assetTag, setAssetTag] = useState(asset?.asset_tag ?? "");
  const [assetTypeId, setAssetTypeId] = useState(asset?.asset_type_id ? String(asset.asset_type_id) : "");
  const [regenPending, setRegenPending] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [brand, setBrand] = useState(asset?.brand ?? "");
  const [model, setModel] = useState(asset?.model ?? "");
  const assetName = [brand, model].filter(Boolean).join(" ");

  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const checkUrl = origin && assetTag ? `${origin}/assets/check/${assetTag}` : assetTag;

  const [phoneNumber, setPhoneNumber] = useState(asset?.phone_number ?? "");

  const [priceDisplay, setPriceDisplay] = useState(
    asset?.purchase_price ? Number(asset.purchase_price).toLocaleString("en-US") : ""
  );
  const priceRaw = priceDisplay.replace(/,/g, "");

  const [purchaseDate, setPurchaseDate] = useState(
    asset?.purchase_date ? new Date(asset.purchase_date).toISOString().slice(0, 10) : ""
  );
  const [usefulYears, setUsefulYears] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState(
    asset?.warranty_expiry ? new Date(asset.warranty_expiry).toISOString().slice(0, 10) : ""
  );

  function calcExpiry(date: string, years: string) {
    if (!date || !years) return;
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + Number(years));
    setWarrantyExpiry(d.toISOString().slice(0, 10));
  }

  async function handleRegenerateTag() {
    if (!assetTypeId) return;
    setRegenError(null);

    if (asset) {
      if (!confirm("ต้องการสร้างรหัสทรัพย์สิน (Asset Tag) ใหม่หรือไม่? รหัสเดิมจะใช้ไม่ได้อีก")) return;
      setRegenPending(true);
      const result = await regenerateAssetTag(asset.id);
      setRegenPending(false);
      if (!result.ok) {
        setRegenError(result.error);
        return;
      }
      setAssetTag(result.tag);
    } else {
      setAssetTag(generateAssetTag(assetTypeId));
    }
  }

  async function downloadQrCode() {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkUrl)}&bgcolor=ffffff&color=102E5A&margin=4`;
    const res = await fetch(url);
    const blob = await res.blob();
    const qrImage = await createImageBitmap(blob);

    const labelHeight = 36;
    const canvas = document.createElement("canvas");
    canvas.width = qrImage.width;
    canvas.height = qrImage.height + labelHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(qrImage, 0, 0);
    ctx.fillStyle = "#102E5A";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(assetTag, canvas.width / 2, qrImage.height + labelHeight / 2);

    const finalBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!finalBlob) return;

    const blobUrl = URL.createObjectURL(finalBlob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `qr_${assetTag}.png`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <form action={action} className="space-y-8">

      {/* ════════════════ ข้อมูลทรัพย์สิน ════════════════ */}
      <section>
        <SectionTitle>ข้อมูลทรัพย์สิน</SectionTitle>

        {/* Row 1: ประเภท | ยี่ห้อ | รุ่น | ชื่อทรัพย์สิน */}
        <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: "2fr 2fr 3fr 4fr" }}>
          <div>
            <Label text="ประเภท" required />
            <select
              name="asset_type_id"
              value={assetTypeId}
              className={inputCls}
              onChange={(e) => {
                setAssetTypeId(e.target.value);
                if (!assetTag && e.target.value) setAssetTag(generateAssetTag(e.target.value));
              }}
            >
              <option value="">- เลือกประเภท -</option>
              {assetTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label text="ยี่ห้อ" />
            <input
              name="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="เช่น Dell"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="รุ่น" />
            <input
              name="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="เช่น Latitude 5420"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="ชื่อทรัพย์สิน" />
            <input
              name="asset_name"
              value={assetName}
              readOnly
              placeholder="สร้างอัตโนมัติจากยี่ห้อ + รุ่น"
              className={`${inputCls} bg-gray-50 text-gray-500`}
            />
          </div>
        </div>

        {/* Row 2: Serial | เบอร์โทรศัพท์ | Asset Tag | รหัสทรัพย์สิน | QR */}
        <div className="grid grid-cols-5 gap-5">
          <div>
            <Label text="หมายเลขซีเรียล" />
            <input
              name="serial_number"
              defaultValue={asset?.serial_number ?? ""}
              placeholder="Serial Number"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="เบอร์โทรศัพท์" />
            <input
              name="phone_number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              placeholder="เช่น 081-234-5678"
              inputMode="numeric"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="Asset Tag" />
            <div className="flex items-center gap-2">
              <input
                name="asset_tag"
                value={assetTag}
                readOnly
                className={`${inputCls} bg-gray-50 text-gray-500`}
              />
              <button
                type="button"
                onClick={handleRegenerateTag}
                disabled={regenPending || !assetTypeId}
                title="สร้างรหัสทรัพย์สินใหม่"
                className="flex-shrink-0 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-2 py-2 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                {regenPending ? "…" : "↻"}
              </button>
            </div>
            {regenError && <p className="text-xs text-red-600 mt-1">{regenError}</p>}
          </div>
          <div>
            <Label text="รหัสทรัพย์สิน (บัญชี)" />
            <input
              name="asset_code"
              defaultValue={asset?.asset_code ?? ""}
              placeholder="เช่น AST001"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="QR Code" />
            {assetTag ? (
              <div className="flex flex-col items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg w-fit">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(checkUrl)}&bgcolor=ffffff&color=102E5A&margin=4`}
                    alt={`QR: ${assetTag}`}
                    width={80}
                    height={80}
                  />
                  <span className="text-xs text-gray-400 tracking-widest font-mono">{assetTag}</span>
                </div>
                <button
                  type="button"
                  onClick={downloadQrCode}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:bg-gray-50 transition-colors w-full"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12L12 16.5m0 0l4.5-4.5M12 16.5V3" />
                  </svg>
                  บันทึก
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mt-2">เลือกประเภทเพื่อสร้าง QR Code</p>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════ รายละเอียดเพิ่มเติม ════════════════ */}
      <section>
        <SectionTitle>รายละเอียดเพิ่มเติม</SectionTitle>
        <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: "1.2fr 1.2fr 3fr 4fr" }}>
          <div>
            <Label text="ราคาซื้อ" />
            <input type="hidden" name="purchase_price" value={priceRaw} />
            <input
              type="text"
              value={priceDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, "");
                if (!/^\d*\.?\d*$/.test(raw)) return;
                const [intPart, decPart] = raw.split(".");
                const formatted = intPart ? Number(intPart).toLocaleString("en-US") : "";
                setPriceDisplay(decPart !== undefined ? `${formatted}.${decPart}` : formatted);
              }}
              placeholder="0"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="เลขที่ใบสั่งซื้อ" />
            <input
              name="po_number"
              defaultValue={asset?.po_number ?? ""}
              placeholder="เช่น PO-2026-001"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="ผู้จัดจำหน่าย" />
            <input
              name="vendor"
              defaultValue={asset?.vendor ?? ""}
              placeholder="ชื่อบริษัท / ร้านค้า"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="เงื่อนไขการรับประกัน" />
            <input
              name="warranty_conditions"
              defaultValue={asset?.warranty_conditions ?? ""}
              placeholder="เช่น 3 ปี onsite"
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-5 mb-5">
          <div>
            <Label text="สถานะ" />
            <select
              name="status"
              defaultValue={asset?.status ?? "available"}
              className={inputCls}
            >
              <option value="available">Available</option>
              <option value="repair">In Repair</option>
            </select>
          </div>
          <div>
            <Label text="วันที่ซื้อ" />
            <input
              type="date"
              name="purchase_date"
              value={purchaseDate}
              onChange={(e) => {
                setPurchaseDate(e.target.value);
                calcExpiry(e.target.value, usefulYears);
              }}
              className={inputCls}
            />
          </div>
          <div>
            <Label text="อายุการใช้งาน (ปี)" />
            <input
              type="number"
              name="useful_years"
              value={usefulYears}
              onChange={(e) => {
                setUsefulYears(e.target.value);
                calcExpiry(purchaseDate, e.target.value);
              }}
              placeholder="เช่น 3"
              min="1"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="วันที่หมดประกัน" />
            <input
              type="date"
              name="warranty_expiry"
              value={warrantyExpiry}
              onChange={(e) => setWarrantyExpiry(e.target.value)}
              className={`${inputCls} ${usefulYears ? "bg-gray-50 text-gray-500" : ""}`}
            />
          </div>
        </div>
      </section>

      {/* ════════════════ Actions ════════════════ */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <SubmitButton
          label={asset ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มทรัพย์สิน"}
          pendingLabel="กำลังบันทึก…"
        />
        <Link
          href="/assets"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ยกเลิก
        </Link>
      </div>

    </form>
  );
}