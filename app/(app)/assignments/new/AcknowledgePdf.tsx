"use client";

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Sarabun",
  fonts: [
    { src: "/fonts/Sarabun-Regular.ttf" },
    { src: "/fonts/Sarabun-Bold.ttf", fontWeight: "bold" },
  ],
});

const LINE_W = 1;
const LINE_C = "#999";

const styles = StyleSheet.create({
  page: { fontFamily: "Sarabun", fontSize: 10, paddingTop: 54, paddingBottom: 36, paddingLeft: 36, paddingRight: 36, color: "#111" },
  title: { fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  row: { flexDirection: "row", marginBottom: 6 },
  label: { width: 80, color: "#333" },
  value: { flex: 1, borderBottomWidth: 1, borderBottomColor: "#999", paddingBottom: 2 },
  labelGap: { width: 60, marginLeft: 12, color: "#333" },
  valueGap: { flex: 0.7, borderBottomWidth: 1, borderBottomColor: "#999", paddingBottom: 2 },
  section: { marginTop: 14, marginBottom: 6, fontWeight: "bold" },

  // Grid lines are drawn as solid filled rectangles (not `border`) so every
  // line renders at the exact same thickness regardless of PDF viewer.
  tableFrame: { backgroundColor: LINE_C, padding: LINE_W, marginTop: 4 },
  tr: { flexDirection: "row" },
  rowBorder: { borderBottomWidth: LINE_W, borderBottomColor: LINE_C },
  colDivider: { width: LINE_W, minWidth: LINE_W, flexShrink: 0, backgroundColor: LINE_C },
  th: { flex: 1, padding: 4, fontWeight: "bold", textAlign: "center", backgroundColor: "#f2f2f2" },
  td: { flex: 1, padding: 4, backgroundColor: "#fff" },
  colNo: { flex: 0.3, textAlign: "center" },
  colItem: { flex: 0.7 },
  colTag: { flex: 0.6 },

  termItem: { marginBottom: 3, flexDirection: "row" },
  termNo: { width: 16 },
  termText: { flex: 1 },
  signContainer: { flexDirection: "row", justifyContent: "flex-end", marginTop: 32 },
  signBlock: { alignItems: "center", width: 200 },

  approvalFrame: { flexDirection: "row", backgroundColor: LINE_C, padding: LINE_W, marginTop: 24 },
  approvalCell: { flex: 1, backgroundColor: "#fff" },
  approvalHead: { textAlign: "center", fontWeight: "bold", padding: 6, backgroundColor: "#f2f2f2", borderBottomWidth: LINE_W, borderBottomColor: LINE_C },
  approvalBody: { padding: 6, minHeight: 70, backgroundColor: "#fff", alignItems: "center", justifyContent: "flex-start" },
  approvalSign: { height: 30, marginBottom: 10 },
  approvalNameBox: { height: 28, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  approvalName: { textAlign: "center", fontSize: 9 },
  approvalSub: { textAlign: "center", marginTop: 2, fontSize: 9, color: "#333" },
});

const TERMS = [
  "ทรัพย์สินที่ได้รับถือเป็นกรรมสิทธิ์ของบริษัทฯ ใช้เพื่อการปฏิบัติงานเท่านั้น",
  "ผู้ครอบครองต้องดูแลรักษาทรัพย์สินให้อยู่ในสภาพพร้อมใช้งาน ห้ามโอน ยืม หรือส่งต่อให้บุคคลภายนอก",
  "ห้ามใช้ทรัพย์สินในทางที่ไม่เหมาะสม เช่น ใช้เพื่อประโยชน์ส่วนตัว ผิดศีลธรรม ผิดกฎหมาย หรือกระทบต่อชื่อเสียงของบริษัทฯ",
  "ห้ามติดตั้ง แก้ไข หรือดัดแปลงอุปกรณ์และซอฟต์แวร์โดยไม่ได้รับอนุญาตจากบริษัทฯ",
  "บริษัทฯ มีสิทธิ์ตรวจสอบสภาพและการใช้งานของทรัพย์สินได้ทุกเมื่อ ผู้ครอบครองต้องให้ความร่วมมือ",
  "หากทรัพย์สินสูญหายหรือชำรุด ต้องรีบแจ้งหัวหน้างานหรือฝ่ายที่เกี่ยวข้องทันที ",
];

interface SignPerson {
  name: string;
  position_name: string | null;
  department_name: string | null;
}

export interface AcknowledgePdfProps {
  employee: { employee_id: string; name: string; position_name: string | null; department_name: string | null };
  assets: { asset_name: string; asset_type_name: string | null; brand: string | null; model: string | null; serial_number: string | null; phone_number: string | null; asset_tag: string }[];
  assignedAt: string;
  docNumber: string;
  proposedBy: SignPerson | null;
  endorsedBy: SignPerson | null;
  approvedBy: SignPerson | null;
  acknowledgedBy: SignPerson;
}

export default function AcknowledgePdf({
  employee,
  assets,
  assignedAt,
  docNumber,
  proposedBy,
  endorsedBy,
  approvedBy,
  acknowledgedBy,
}: AcknowledgePdfProps) {
  const approvals: [string, SignPerson | null][] = [
    ["เสนอ", proposedBy],
    ["เห็นชอบ", endorsedBy],
    ["อนุมัติ", approvedBy],
    ["รับทราบ", acknowledgedBy],
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>แบบฟอร์มรับทรัพย์สิน (Asset Acknowledgement Form)</Text>
        <Text style={{ marginBottom: 10 }}>เลขที่ {docNumber || "-"}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>ชื่อ - นามสกุล</Text>
          <Text style={styles.value}>{employee.name}</Text>
          <Text style={styles.labelGap}>รหัสพนักงาน</Text>
          <Text style={styles.valueGap}>{employee.employee_id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>ตำแหน่ง </Text>
          <Text style={styles.value}>{employee.position_name ?? "-"}</Text>
          <Text style={styles.labelGap}>ฝ่าย</Text>
          <Text style={styles.valueGap}>{employee.department_name ?? "-"}</Text>
        </View>

        <Text style={styles.section}>รายการทรัพย์สินที่ได้รับ</Text>
        <View style={styles.tableFrame}>
          <View style={[styles.tr, assets.length > 0 ? styles.rowBorder : {}]}>
            <Text style={[styles.th, styles.colNo]}>ลำดับ{" "}</Text>
            <View style={styles.colDivider} />
            <Text style={[styles.th, styles.colItem]}>รายการทรัพย์สิน</Text>
            <View style={styles.colDivider} />
            <Text style={styles.th}>ยี่ห้อ/รุ่น</Text>
            <View style={styles.colDivider} />
            <Text style={styles.th}>Serial Number</Text>
            <View style={styles.colDivider} />
            <Text style={[styles.th, styles.colTag]}>หมายเลข</Text>
          </View>
          {assets.map((a, i) => (
            <View style={[styles.tr, i < assets.length - 1 ? styles.rowBorder : {}]} key={i}>
              <Text style={[styles.td, styles.colNo]}>{i + 1}</Text>
              <View style={styles.colDivider} />
              <Text style={[styles.td, styles.colItem]}>{a.asset_type_name ?? "-"}</Text>
              <View style={styles.colDivider} />
              <Text style={styles.td}>{[a.brand, a.model].filter(Boolean).join(" ") || "-"}</Text>
              <View style={styles.colDivider} />
              <Text style={styles.td}>{a.serial_number ?? "-"}</Text>
              <View style={styles.colDivider} />
              <Text style={[styles.td, styles.colTag]}>{a.phone_number ?? "-"}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>ข้อกำหนดในการดูแลรักษาทรัพย์สิน </Text>
        {TERMS.map((t, i) => (
          <View style={styles.termItem} key={i}>
            <Text style={styles.termNo}>{i + 1}.</Text>
            <Text style={styles.termText}>{t}</Text>
          </View>
        ))}

        <Text style={styles.section}>คำรับรอง{" "}</Text>
        <Text>
          ข้าพเจ้าขอรับรองว่าจะดูแลรักษาทรัพย์สินของบริษัทฯ ตามข้อกำหนดข้างต้น และจะคืนทรัพย์สินดังกล่าวเมื่อบริษัทฯมีการเรียกคืน
          หรือเมื่อพ้นสภาพการเป็นพนักงาน{" "}
        </Text>

        <View style={styles.signContainer}>
          <View style={styles.signBlock}>
            <Text>ลงชื่อ ......................................... ผู้รับทรัพย์สิน</Text>
            <Text style={{ marginTop: 4 }}>({employee.name})</Text>
            <Text style={{ marginTop: 4 }}>วันที่ {assignedAt}</Text>
          </View>
        </View>

        <View style={styles.approvalFrame}>
          {approvals.flatMap(([label, person], i) => [
            <View style={styles.approvalCell} key={`cell-${label}`}>
              <Text style={styles.approvalHead}>{label}</Text>
              <View style={styles.approvalBody}>
                <View style={styles.approvalSign} />
                <View style={styles.approvalNameBox}>
                  <Text style={styles.approvalName}>({person?.name ?? "-"})</Text>
                </View>
                <Text style={styles.approvalSub}>{person?.position_name ?? "-"}</Text>
                <Text style={styles.approvalSub}>{person?.department_name ?? "-"}</Text>
              </View>
            </View>,
            i < approvals.length - 1 ? <View style={styles.colDivider} key={`div-${i}`} /> : null,
          ])}
        </View>
      </Page>
    </Document>
  );
}
