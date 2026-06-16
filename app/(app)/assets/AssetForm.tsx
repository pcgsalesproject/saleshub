"use client";

import Link from "next/link";
import { useState } from "react";
import type { Asset, AssetType } from "@/lib/types";
import SubmitButton from "@/components/SubmitButton";

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

function generateAssetTag() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `A${year}${random}`;
}

export default function AssetForm({ action, assetTypes, asset }: Props) {
  const [assetTag] = useState(() => asset?.asset_tag ?? generateAssetTag());
  const [brand, setBrand] = useState(asset?.brand ?? "");
  const [model, setModel] = useState(asset?.model ?? "");
  const assetName = [brand, model].filter(Boolean).join(" ");

  return (
    <form action={action} className="space-y-8">

      {/* ════════════════ ข้อมูลทรัพย์สิน ════════════════ */}
      <section>
        <SectionTitle>ข้อมูลทรัพย์สิน</SectionTitle>

        <div className="grid grid-cols-4 gap-5 mb-5">
          <div>
            <Label text="Asset Tag" />
            <input
              name="asset_tag"
              value={assetTag}
              readOnly
              className={`${inputCls} bg-gray-50 text-gray-500`}
            />
          </div>
          <div>
            <Label text="รหัสทรัพย์สิน(บัญชี)" />
            <input
              name="asset_code"
              defaultValue={asset?.asset_code ?? ""}
              placeholder="เช่น AST001"
              className={inputCls}
            />
          </div>
          <div className="col-span-2">
            <Label text="ชื่อทรัพย์สิน" />
            <input
              name="asset_name"
              value={assetName}
              readOnly
              placeholder="กรอกยี่ห้อและรุ่นเพื่อสร้างอัตโนมัติ"
              className={`${inputCls} bg-gray-50 text-gray-500`}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div>
            <Label text="ประเภท" />
            <select
              name="asset_type_id"
              defaultValue={asset?.asset_type_id ?? ""}
              className={inputCls}
            >
              <option value="">— เลือกประเภท —</option>
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
        </div>
      </section>

      {/* ════════════════ รายละเอียดเพิ่มเติม ════════════════ */}
      <section>
        <SectionTitle>รายละเอียดเพิ่มเติม</SectionTitle>
        <div className="grid grid-cols-2 gap-5 mb-5">
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
              defaultValue={asset?.purchase_date ? new Date(asset.purchase_date).toISOString().slice(0, 10) : ""}
              className={inputCls}
            />
          </div>
          <div>
            <Label text="วันที่หมดประกัน" />
            <input
              type="date"
              name="warranty_expiry"
              defaultValue={asset?.warranty_expiry ? new Date(asset.warranty_expiry).toISOString().slice(0, 10) : ""}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <Label text="หมายเหตุ" />
          <textarea
            name="note"
            defaultValue={asset?.note ?? ""}
            rows={3}
            placeholder="หมายเหตุเพิ่มเติม"
            className={inputCls}
          />
        </div>
      </section>

      {/* ════════════════ Actions ════════════════ */}
      <div className="flex items-center justify-end gap-3 pt-1 border-t border-gray-100">
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