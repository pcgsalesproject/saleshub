"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { Asset, AssetType } from "@/lib/types";
import SubmitButton from "@/components/SubmitButton";
import { regenerateAssetTag } from "@/lib/actions/assets";

interface Props {
  action: (formData: FormData) => Promise<void>;
  assetTypes: AssetType[];
  asset?: Asset;
  holderName?: string | null;
}

function Card({
  n,
  title,
  subtitle,
  children,
}: {
  n: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#102E5A] text-sm font-semibold text-white">
          {n}
        </span>
        <div>
          <h2 className="text-base font-semibold text-[#102E5A] leading-tight">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
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

const NAME_MAX = 100;

type WarrantyUnit = "ปี" | "เดือน";

const STATUS_DOT: Record<string, string> = {
  available: "bg-green-500",
  repair: "bg-orange-500",
  damaged: "bg-red-500",
  retired: "bg-gray-400",
};

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

export default function AssetForm({ action, assetTypes, asset, holderName }: Props) {
  const isAssigned = !!holderName;
  const [assetTag, setAssetTag] = useState(asset?.asset_tag ?? "");
  const [status, setStatus] = useState(asset?.status ?? "available");
  const [assetTypeId, setAssetTypeId] = useState(asset?.asset_type_id ? String(asset.asset_type_id) : "");
  const [regenPending, setRegenPending] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [brand, setBrand] = useState(asset?.brand ?? "");
  const [model, setModel] = useState(asset?.model ?? "");
  const autoName = [brand, model].filter(Boolean).join(" ");
  const [nameEdited, setNameEdited] = useState(!!asset && asset.asset_name !== autoName);
  const [typedName, setAssetName] = useState(asset?.asset_name ?? "");
  const assetName = nameEdited ? typedName : autoName;

  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ""
  );
  const checkUrl = origin && assetTag ? `${origin}/assets/check/${assetTag}` : assetTag;

  const [phoneNumber, setPhoneNumber] = useState(asset?.phone_number ?? "");

  const [priceDisplay, setPriceDisplay] = useState(
    asset?.purchase_price ? Number(asset.purchase_price).toLocaleString("en-US") : ""
  );
  const priceRaw = priceDisplay.replace(/,/g, "");

  const [purchaseDate, setPurchaseDate] = useState(
    asset?.purchase_date ? new Date(asset.purchase_date).toISOString().slice(0, 10) : ""
  );
  const [warrantyDuration, setWarrantyDuration] = useState(
    asset?.warranty_conditions?.match(/\d+/)?.[0] ?? ""
  );
  const [warrantyUnit, setWarrantyUnit] = useState<WarrantyUnit>(
    asset?.warranty_conditions?.includes("เดือน") ? "เดือน" : "ปี"
  );
  const warrantyConditions = warrantyDuration ? `${warrantyDuration} ${warrantyUnit}` : "";
  const [warrantyExpiry, setWarrantyExpiry] = useState(
    asset?.warranty_expiry ? new Date(asset.warranty_expiry).toISOString().slice(0, 10) : ""
  );

  function calcExpiry(date: string, duration: string, unit: WarrantyUnit) {
    if (!date || !duration) return;
    const d = new Date(date);
    if (unit === "ปี") d.setFullYear(d.getFullYear() + Number(duration));
    else d.setMonth(d.getMonth() + Number(duration));
    d.setDate(d.getDate() - 1);
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
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(checkUrl)}&bgcolor=ffffff&color=102E5A&margin=4`;
    const res = await fetch(url);
    const blob = await res.blob();
    const qrImage = await createImageBitmap(blob);

    const labelHeight = 24;
    const canvas = document.createElement("canvas");
    canvas.width = qrImage.width;
    canvas.height = qrImage.height + labelHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(qrImage, 0, 0);
    ctx.fillStyle = "#102E5A";
    ctx.font = "bold 13px sans-serif";
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
    <form action={action} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-start">
      <div className="space-y-5 min-w-0">

      {/* ════════════════ 1. ข้อมูลทั่วไป ════════════════ */}
      <Card n={1} title="ข้อมูลทั่วไป" subtitle="ประเภท ยี่ห้อ รุ่น ชื่อทรัพย์สิน และรหัสระบุตัวตน">
        <div className="grid gap-5 mb-5 md:[grid-template-columns:1.2fr_1.3fr_2fr_3fr]">
          <div>
            <Label text="ประเภททรัพย์สิน" required />
            <select
              name="asset_type_id"
              value={assetTypeId}
              required
              className={inputCls}
              onChange={(e) => {
                setAssetTypeId(e.target.value);
                // New asset: tag follows the type. Existing asset: keep the printed tag (use ↻ to regenerate).
                if (e.target.value && (!asset || !assetTag)) setAssetTag(generateAssetTag(e.target.value));
              }}
            >
              <option value="">- เลือกประเภท -</option>
              {assetTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label text="ยี่ห้อ (Brand)" />
            <input
              name="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <Label text="รุ่น (Model)" />
            <input
              name="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <Label text="ชื่อทรัพย์สิน" />
            <input
              name="asset_name"
              value={assetName}
              maxLength={NAME_MAX}
              onChange={(e) => {
                setAssetName(e.target.value);
                setNameEdited(true);
              }}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid gap-5 mb-5 md:[grid-template-columns:1.6fr_0.8fr_1.6fr_0.8fr]">
          <div>
            <Label text="หมายเลขซีเรียล (Serial Number)" />
            <input
              name="serial_number"
              defaultValue={asset?.serial_number ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <Label text="เบอร์โทรศัพท์ (ถ้ามี)" />
            <input
              name="phone_number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              inputMode="numeric"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="EID" />
            <input
              name="eid"
              defaultValue={asset?.eid ?? ""}
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
                className="flex-shrink-0 whitespace-nowrap text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-2.5 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                {regenPending ? "…" : "↻"}
              </button>
            </div>
            {regenError && <p className="text-xs text-red-600 mt-1">{regenError}</p>}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
        {/* ════════════════ 2. ข้อมูลการจัดซื้อ ════════════════ */}
        <Card n={2} title="ข้อมูลการจัดซื้อ" subtitle="ข้อมูลการสั่งซื้อ ราคา และผู้จำหน่าย">
          <div className="grid gap-5 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <Label text="เลขที่ใบสั่งซื้อ (PO Number)" />
              <input
                name="po_number"
                defaultValue={asset?.po_number ?? ""}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-3">
              <Label text="วันที่ซื้อ" />
              <input
                type="date"
                name="purchase_date"
                value={purchaseDate}
                onChange={(e) => {
                  setPurchaseDate(e.target.value);
                  calcExpiry(e.target.value, warrantyDuration, warrantyUnit);
                }}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-4">
              <Label text="ผู้จัดจำหน่าย" />
              <input
                name="vendor"
                defaultValue={asset?.vendor ?? ""}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <Label text="ราคาซื้อ (บาท)" />
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
                className={inputCls}
              />
            </div>
          </div>
        </Card>

        {/* ════════════════ 3. ข้อมูลรับประกัน ════════════════ */}
        <Card n={3} title="ข้อมูลรับประกัน" subtitle="กำหนดระยะเวลารับประกัน">
          <input type="hidden" name="warranty_conditions" value={warrantyConditions} />
          <div className="mb-5">
            <Label text="ระยะเวลารับประกัน" />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                value={warrantyDuration}
                onChange={(e) => {
                  setWarrantyDuration(e.target.value);
                  calcExpiry(purchaseDate, e.target.value, warrantyUnit);
                }}
                className={inputCls}
              />
              <select
                value={warrantyUnit}
                onChange={(e) => {
                  setWarrantyUnit(e.target.value as WarrantyUnit);
                  calcExpiry(purchaseDate, warrantyDuration, e.target.value as WarrantyUnit);
                }}
                className={inputCls}
              >
                <option value="ปี">ปี</option>
                <option value="เดือน">เดือน</option>
              </select>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label text="วันที่เริ่มประกัน" />
              <input
                type="date"
                value={purchaseDate}
                readOnly
                tabIndex={-1}
                className={`${inputCls} bg-gray-50 text-gray-500`}
              />
            </div>
            <div>
              <Label text="วันที่หมดประกัน" />
              <input
                type="date"
                name="warranty_expiry"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
                className={`${inputCls} ${warrantyDuration ? "bg-gray-50 text-gray-500" : ""}`}
              />
            </div>
          </div>
        </Card>
      </div>

        <div className="flex items-center justify-end gap-3">
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

      </div>

      {/* ════════════════ Sidebar: QR + สถานะ ════════════════ */}
      <aside className="space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-[#102E5A] mb-3">สถานะ</h2>
          <div className="relative">
            <span className={`pointer-events-none absolute left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${STATUS_DOT[status] ?? STATUS_DOT.available}`} />
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${inputCls} pl-8`}
            >
              <option value="available">{isAssigned ? "Assigned" : "Available"}</option>
              <option value="repair">In Repair</option>
              <option value="damaged">Damaged</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-[#102E5A] mb-3">QR Code</h2>
          {assetTag ? (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(checkUrl)}&bgcolor=ffffff&color=102E5A&margin=4`}
                alt={`QR: ${assetTag}`}
                width={80}
                height={80}
              />
              <span className="text-sm font-semibold text-[#102E5A] tracking-wide">{assetTag}</span>
              <button
                type="button"
                onClick={downloadQrCode}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12L12 16.5m0 0l4.5-4.5M12 16.5V3" />
                </svg>
                ดาวน์โหลด
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400">เลือกประเภทเพื่อสร้าง QR Code</p>
          )}
        </section>

        {holderName && (
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold text-[#102E5A] mb-3">ผู้ใช้งาน</h2>
            <p className="text-center text-[13px] text-gray-800">{holderName}</p>
          </section>
        )}
      </aside>
      </div>

    </form>
  );
}
