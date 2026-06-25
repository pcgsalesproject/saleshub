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
  row: { flexDirection: "row", marginBottom: 8 },
  label: { width: 70, color: "#333" },
  value: { flex: 0.75, borderBottomWidth: 1, borderBottomColor: "#999", paddingBottom: 2 },
  labelGap: { width: 70, marginLeft: 28, color: "#333" },
  valueGap: { flex: 0.7, borderBottomWidth: 1, borderBottomColor: "#999", paddingBottom: 2 },
  section: { marginTop: 18, marginBottom: 6, fontWeight: "bold" },
  divider: { borderBottomWidth: LINE_W, borderBottomColor: LINE_C, marginTop: 12 },

  tableFrame: { backgroundColor: LINE_C, padding: LINE_W, marginTop: 6 },
  tr: { flexDirection: "row" },
  rowBorder: { borderBottomWidth: LINE_W, borderBottomColor: LINE_C },
  colDivider: { width: LINE_W, minWidth: LINE_W, flexShrink: 0, backgroundColor: LINE_C },
  th: { flex: 1, padding: 4, fontWeight: "bold", textAlign: "center", backgroundColor: "#f2f2f2" },
  td: { flex: 1, padding: 4, backgroundColor: "#fff" },
  colNo: { flex: 0.25, textAlign: "center" },
  colItem: { flex: 0.75 },
  colBrand: { flex: 1 },
  colSerial: { flex: 0.95 },
  colPhoneNum: { flex: 0.7, textAlign: "center" },

  signContainer: { marginTop: 72 },
  signRow: { flexDirection: "row" },
  signRowRight: { justifyContent: "flex-end" },
  signRowLeft: { justifyContent: "flex-start" },
  signBlock: { alignItems: "center", marginBottom: 36 },

  approvalFrame: { flexDirection: "row", backgroundColor: LINE_C, padding: LINE_W, marginTop: 36 },
  approvalCell: { flex: 1, backgroundColor: "#fff" },
  approvalHead: { textAlign: "center", fontWeight: "bold", padding: 6, backgroundColor: "#f2f2f2", borderBottomWidth: LINE_W, borderBottomColor: LINE_C },
  approvalBody: { padding: 6, minHeight: 70, backgroundColor: "#fff", alignItems: "center", justifyContent: "flex-start" },
  approvalSign: { height: 30, marginBottom: 10 },
  approvalNameBox: { height: 28, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  approvalName: { textAlign: "center", fontSize: 9 },
  approvalSub: { textAlign: "center", marginTop: 2, fontSize: 9, color: "#333" },
});

function formatPhoneNumber(phone: string | null): string {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) return phone;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

interface SignPerson {
  name: string;
  position_name: string | null;
  department_name: string | null;
}

export interface AcknowledgeReturnPdfProps {
  employee: { employee_id: string | null; name: string; position_name: string | null; department_name: string | null };
  assets: { asset_name: string; asset_type_name: string | null; brand: string | null; model: string | null; serial_number: string | null; phone_number: string | null; asset_tag: string; condition: string }[];
  returnedAt: string;
  docNumber: string;
  proposedBy: SignPerson | null;
  endorsedBy: SignPerson | null;
  approvedBy: SignPerson | null;
  receivedBy: SignPerson;
}

export default function AcknowledgeReturnPdf({
  employee,
  assets,
  returnedAt,
  docNumber,
  proposedBy,
  endorsedBy,
  approvedBy,
  receivedBy,
}: AcknowledgeReturnPdfProps) {
  const approvals: [string, SignPerson | null][] = [
    ["เสนอ", proposedBy],
    ["เห็นชอบ", endorsedBy],
    ["อนุมัติ", approvedBy],
    ["รับทราบ", receivedBy],
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>แบบฟอร์มคืนทรัพย์สิน (Asset Return Form)</Text>
        <Text style={{ marginBottom: 10 }}>เลขที่ {docNumber || "-"}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>ชื่อ - นามสกุล</Text>
          <Text style={styles.value}>{employee.name}</Text>
          <Text style={styles.labelGap}>รหัสพนักงาน</Text>
          <Text style={styles.valueGap}>{employee.employee_id ?? "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>ตำแหน่ง </Text>
          <Text style={styles.value}>{employee.position_name ?? "-"}</Text>
          <Text style={styles.labelGap}>ฝ่าย</Text>
          <Text style={styles.valueGap}>{employee.department_name ?? "-"}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.section}>รายการทรัพย์สินที่ส่งคืน</Text>
        <View style={styles.tableFrame}>
          <View style={[styles.tr, assets.length > 0 ? styles.rowBorder : {}]}>
            <Text style={[styles.th, styles.colNo]}>ลำดับ{" "}</Text>
            <View style={styles.colDivider} />
            <Text style={[styles.th, styles.colItem]}>รายการทรัพย์สิน</Text>
            <View style={styles.colDivider} />
            <Text style={[styles.th, styles.colBrand]}>ยี่ห้อ/รุ่น</Text>
            <View style={styles.colDivider} />
            <Text style={[styles.th, styles.colSerial]}>Serial Number</Text>
            <View style={styles.colDivider} />
            <Text style={[styles.th, styles.colPhoneNum]}>หมายเลข</Text>
          </View>
          {assets.map((a, i) => (
            <View style={[styles.tr, i < assets.length - 1 ? styles.rowBorder : {}]} key={i}>
              <Text style={[styles.td, styles.colNo]}>{i + 1}</Text>
              <View style={styles.colDivider} />
              <Text style={[styles.td, styles.colItem]}>{a.asset_type_name ?? "-"}</Text>
              <View style={styles.colDivider} />
              <Text style={[styles.td, styles.colBrand]}>{[a.brand, a.model].filter(Boolean).join(" ") || "-"}</Text>
              <View style={styles.colDivider} />
              <Text style={[styles.td, styles.colSerial]}>{a.serial_number ?? "-"}</Text>
              <View style={styles.colDivider} />
              <Text style={[styles.td, styles.colPhoneNum]}>{formatPhoneNumber(a.phone_number)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>คำรับรอง{" "}</Text>
        <Text>
          ข้าพเจ้าได้ส่งคืนทรัพย์สินของบริษัทฯ ตามที่ได้รับมอบหมายข้างต้นเรียบร้อยแล้ว และรับทราบว่าบริษัทฯมีสิทธิ์ตรวจสอบและประเมิน
          สภาพทรัพย์สินที่คืน หากพบความเสียหายที่เกิดจากความประมาทเลินเล่อ
          ข้าพเจ้ายินดีรับผิดชอบค่าเสียหายตามระเบียบของบริษัทฯ{" "}
        </Text>

        <View style={styles.signContainer}>
          <View style={[styles.signRow, styles.signRowRight]}>
            <View style={styles.signBlock}>
              <Text>ลงชื่อ ................................................. ผู้คืนทรัพย์สิน</Text>
              <Text style={{ alignSelf: "flex-start", marginTop: 8 }}>วันที่   .................................................</Text>
            </View>
          </View>

          <View style={[styles.signRow, styles.signRowLeft]}>
            <View style={styles.signBlock}>
              <Text>ลงชื่อ ................................................. ผู้รับคืนทรัพย์สิน</Text>
              <Text style={{ alignSelf: "flex-start", marginTop: 8 }}>วันที่   .................................................</Text>
            </View>
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
