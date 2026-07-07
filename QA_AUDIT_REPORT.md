# QA Audit Report — SalesHub

วันที่ตรวจ: 3 กรกฎาคม 2026  
ขอบเขต: ระบบจัดเก็บข้อมูลพนักงาน ทรัพย์สิน การมอบ–คืนทรัพย์สิน และการตรวจนับทรัพย์สิน

## สรุปภาพรวม

Production build และ TypeScript ผ่าน แต่ยังมีความเสี่ยงสูงด้านความถูกต้องของข้อมูล การควบคุมสิทธิ์ และ audit trail โดยเฉพาะกระบวนการมอบ–คืนทรัพย์สินและรายงานตรวจนับ

ควรแก้รายการระดับ P0 ก่อนนำระบบไปใช้งานจริงหรือขยายจำนวนผู้ใช้

## P0 — ควรแก้ทันที

### 1. ทรัพย์สินหนึ่งชิ้นสามารถถูกมอบให้หลายคนพร้อมกันได้

ไม่มี unique constraint ที่บังคับให้ทรัพย์สินมี active assignment ได้เพียงรายการเดียว และ Server Action ไม่ตรวจว่าทรัพย์สินว่างก่อนบันทึก

การมอบทรัพย์สินหลายรายการใช้ `Promise.all` โดยไม่มี transaction ทำให้เกิด partial success ได้ หากบางรายการบันทึกสำเร็จและบางรายการล้มเหลว

ไฟล์ที่เกี่ยวข้อง:

- `database/schema.sql:82`
- `lib/actions/assets.ts:156`
- `app/(app)/assets/[id]/assign/page.tsx`

ข้อเสนอแนะ:

- เพิ่ม partial unique index บน `asset_assignments(asset_id)` เมื่อ `returned_at IS NULL`
- ตรวจสถานะทรัพย์สินและพนักงานซ้ำใน Server Action
- ใช้ database transaction สำหรับการมอบทรัพย์สินแบบหลายรายการ
- ไม่อนุญาตให้มอบทรัพย์สินที่อยู่ระหว่างซ่อม จำหน่าย หรือสูญหาย

### 2. การคืนทรัพย์สินสามารถแก้ assignment ผิดรายการหรือคืนซ้ำได้

ระบบอัปเดตจาก `assignmentId` เพียงอย่างเดียว โดยไม่ตรวจว่า:

- assignment เป็นของพนักงานที่เลือกหรือไม่
- ทรัพย์สินยังไม่ถูกคืน
- ผู้ใช้มีสิทธิ์คืนทรัพย์สินหรือไม่
- วันที่คืนอยู่หลังวันที่รับหรือไม่

ไฟล์ที่เกี่ยวข้อง:

- `lib/actions/assets.ts:182`
- `lib/actions/assets.ts:409`
- `lib/actions/assets.ts:418`

ข้อเสนอแนะ:

- เพิ่มเงื่อนไข `WHERE returned_at IS NULL`
- ตรวจ ownership ของ assignment
- ตรวจจำนวนแถวที่ถูกอัปเดต
- ทำรายการคืนหลายชิ้นใน transaction เดียว

### 3. รายงานตรวจนับย้อนหลังอาจถูกผูกกับพนักงานผิดคน

รายงานนำผู้ถือครองปัจจุบันของทรัพย์สินไป join กับผลตรวจเดิมผ่าน `asset_id` เมื่อมีการโอนทรัพย์สิน ผลตรวจในรอบเก่าอาจย้ายไปแสดงใต้พนักงานคนใหม่

แม้ `inspection_sessions` จะเก็บ `employee_id` ไว้แล้ว แต่ query รายงานไม่ได้ใช้ข้อมูลนี้ในการระบุผู้ถือครอง ณ เวลาตรวจ

ไฟล์ที่เกี่ยวข้อง:

- `lib/inspection.ts:29`
- `lib/inspection.ts:44`
- `lib/actions/checks.ts:60`

ข้อเสนอแนะ:

- ใช้ `inspection_sessions.employee_id` เป็นเจ้าของผลตรวจ
- เก็บ snapshot ของ assignment หรือ employee ณ วันที่ตรวจ
- แยกผลตรวจจากสถานะผู้ถือครองปัจจุบัน

### 4. ไม่มี Role-Based Access Control

Proxy ตรวจเพียงว่ามีผู้ใช้ล็อกอิน แต่ไม่ได้แบ่งสิทธิ์ เช่น Admin, HR, Asset Officer, Inspector และ Read-only

ผู้ใช้ที่ล็อกอินได้จึงสามารถเพิ่ม แก้ไข หรือลบข้อมูลพนักงาน ทรัพย์สิน รอบตรวจ และดูข้อมูลส่วนบุคคลได้ทั้งหมด

ไฟล์ที่เกี่ยวข้อง:

- `proxy.ts:29`
- `lib/actions/employees.ts`
- `lib/actions/assets.ts`
- `lib/actions/rounds.ts`
- `lib/actions/checks.ts`

ข้อเสนอแนะ:

- เพิ่ม role และ permission matrix
- ตรวจสิทธิ์ซ้ำภายในทุก Server Action
- จำกัดการดูเลขบัตรประชาชน วันเกิด และข้อมูลส่วนบุคคล
- บันทึกผู้ดำเนินการใน audit log

### 5. Service Worker cache ข้อมูลส่วนบุคคลทุก GET request

Service Worker ใช้ network-first และ cache response ของ GET request ทั้งหมด รวมถึงหน้าพนักงาน รายงาน และ export

หลัง logout ผู้ใช้บนเครื่องร่วมกันอาจเปิดข้อมูลที่ cache ไว้ได้เมื่อ offline

ไฟล์ที่เกี่ยวข้อง:

- `public/sw.js:19`
- `app/register-sw.tsx`

ข้อเสนอแนะ:

- ไม่ cache authenticated HTML, API, CSV และหน้าที่มีข้อมูลส่วนบุคคล
- cache เฉพาะ static assets ที่กำหนดไว้
- ล้าง user-specific cache ตอน logout
- พิจารณาปิด offline mode สำหรับหน้าข้อมูลละเอียดอ่อน

## P1 — Bug และความเสี่ยงสำคัญ

### 1. ลิงก์ชื่อพนักงานในประวัติทรัพย์สินใช้ ID ผิด

หน้า Asset Detail ใช้ assignment ID สร้าง URL พนักงาน แทนที่จะใช้ employee ID ทำให้เปิดพนักงานผิดคนหรือพบหน้า 404

ไฟล์ที่เกี่ยวข้อง:

- `app/(app)/assets/[id]/page.tsx:204`

### 2. Schema ไม่ตรงกับ query ของระบบ

Schema สร้างคอลัมน์ `sales_areas.name` แต่หน้าจอพนักงาน query `sales_areas.area_name`

นอกจากนี้ script ยังไม่ได้ drop ตาราง inspection และ document sequence ก่อน drop ตารางที่ถูกอ้างอิง จึงอาจรัน schema ซ้ำไม่ได้

ไฟล์ที่เกี่ยวข้อง:

- `database/schema.sql:22`
- `app/(app)/employees/new/page.tsx:11`
- `app/(app)/employees/information/page.tsx:36`
- `app/(app)/inspection/new/page.tsx:58`

### 3. KPI Available นับทรัพย์สินที่อยู่ระหว่างซ่อม

ค่าปัจจุบันคำนวณจาก `total - assigned` โดยไม่ได้หักทรัพย์สินสถานะ `repair`

ไฟล์ที่เกี่ยวข้อง:

- `app/(app)/assets/page.tsx:258`

### 4. หน้า Assign รายชิ้นยังยอมมอบทรัพย์สินที่ไม่พร้อม

เมื่อทรัพย์สินถูกมอบอยู่แล้ว ระบบแสดงเพียงคำเตือน แต่ฟอร์มยังใช้งานได้ และ Server Action ไม่ตรวจสถานะอีกครั้ง

ทรัพย์สินสถานะซ่อมก็สามารถเข้าหน้านี้และถูกมอบได้

ไฟล์ที่เกี่ยวข้อง:

- `app/(app)/assets/[id]/assign/page.tsx`
- `lib/actions/assets.ts:101`

### 5. การตรวจทรัพย์สินรายชิ้นยอมบันทึกโดยไม่มีรอบตรวจ

`createAssetCheck` สามารถบันทึก `round_id = null` และรับค่า status จาก client โดยไม่มี allowlist

ไฟล์ที่เกี่ยวข้อง:

- `lib/actions/checks.ts:26`

### 6. CSV Import ไม่รองรับรูปแบบ CSV มาตรฐาน

ระบบแยกข้อมูลด้วย comma โดยตรง จึงไม่รองรับ:

- comma ภายในข้อความที่มี quote
- newline ภายใน field
- escaped quote
- BOM และ header ที่แตกต่าง

ระบบยังไม่ตรวจ `asset_type_id`, วันที่ หรือข้อมูลก่อนเริ่ม insert และอาจนำเข้าสำเร็จเพียงบางแถว

ไฟล์ที่เกี่ยวข้อง:

- `lib/actions/assets.ts:452`
- `lib/actions/assets.ts:473`
- `lib/actions/assets.ts:506`

### 7. CSV Export เสี่ยง Excel Formula Injection

ข้อมูลที่ขึ้นต้นด้วย `=`, `+`, `-` หรือ `@` อาจถูก Excel ประมวลผลเป็นสูตรเมื่อเปิดไฟล์

ไฟล์ที่เกี่ยวข้อง:

- `app/(app)/inspection/summary/export/route.ts:11`

### 8. รูปพนักงานเป็น Public URL

ระบบใช้ `getPublicUrl` ทำให้รูปสามารถเข้าถึงได้โดยไม่ผ่าน permission ของแอป และไม่มีการลบไฟล์เดิมเมื่อเปลี่ยนรูป

ไฟล์ที่เกี่ยวข้อง:

- `lib/actions/employees.ts:31`

ข้อเสนอแนะ:

- ใช้ private bucket และ signed URL
- ตรวจชนิดไฟล์จากเนื้อหา ไม่ใช่เฉพาะ MIME จาก client
- ลบหรือ archive รูปเดิมเมื่อเปลี่ยนรูป

### 9. QR Code พึ่งพาบริการภายนอก

ระบบส่ง URL และ Asset Tag ไปยัง `api.qrserver.com` เพื่อสร้าง QR Code ทำให้เกิด dependency ภายนอกและอาจเปิดเผย hostname หรือรหัสทรัพย์สิน

ไฟล์ที่เกี่ยวข้อง:

- `app/(app)/assets/AssetForm.tsx:127`

ข้อเสนอแนะ:

- สร้าง QR Code ภายในระบบ
- เพิ่ม error handling เมื่อบริการ QR ไม่ตอบสนอง

### 10. ไม่มี validation และ constraint สำคัญ

ตัวอย่างข้อมูลที่ยังไม่มีการบังคับ:

- วันที่คืนต้องไม่ก่อนวันที่รับ
- วันที่ลาออกต้องไม่ก่อนวันเริ่มงาน
- ผู้จัดการต้องไม่เป็นพนักงานคนเดียวกัน
- สถานะทรัพย์สินและผลตรวจต้องอยู่ในค่าที่กำหนด
- `employee_id` และ `asset_id` ของ assignment ควรเป็น `NOT NULL`
- อีเมลที่ใช้ผูกผู้ตรวจควรไม่ซ้ำ

## P2 — UX และคุณภาพระบบ

- ปุ่ม Transfer ในหน้ารายการทรัพย์สินยังไม่มีการทำงาน
- Remember me แสดงในหน้าล็อกอิน แต่ไม่ถูกนำไปใช้
- Dashboard ยังเป็นหน้า `coming soon`
- `updated_at` ของพนักงานไม่ถูกอัปเดตเมื่อแก้ไข
- หลายหน้ากำหนด 4–5 columns และ sidebar คงที่ ทำให้เสี่ยงใช้งานบนมือถือไม่ได้
- รายชื่อพนักงานและประวัติเอกสารยังไม่มี pagination
- `<html lang="en">` ไม่ตรงกับเนื้อหาหลักภาษาไทย
- ข้อความภาษาไทยและอังกฤษยังไม่สม่ำเสมอกัน
- ไม่มีหน้า error ที่อธิบายสาเหตุเมื่อฐานข้อมูลหรือบริการภายนอกล้มเหลว

## สิ่งที่ควรเพิ่มสำหรับระบบพนักงาน

### ข้อมูลการทำงาน

- ประเภทการจ้างงาน
- บริษัทหรือหน่วยงาน
- สาขาและสถานที่ทำงาน
- Cost center
- วันที่ผ่านทดลองงาน
- สถานะลาออกและเหตุผล
- ผู้ดูแลข้อมูลหรือ HR owner

### Offboarding

- Checklist เมื่อพนักงานลาออก
- รายการทรัพย์สินที่ยังไม่คืน
- การปิดบัญชีและสิทธิ์เข้าถึง
- ผู้รับผิดชอบและกำหนดคืน
- สถานะดำเนินการและหลักฐาน

### PDPA และความปลอดภัย

- Masking เลขบัตรประชาชน
- Encryption สำหรับข้อมูลสำคัญ
- Field-level permission
- Retention และ deletion policy
- Audit log การเปิดดูและแก้ไขข้อมูล
- หลีกเลี่ยงการเก็บข้อมูลส่วนบุคคลที่ไม่จำเป็น

## สิ่งที่ควรเพิ่มสำหรับระบบทรัพย์สิน

- สถานะ `available`, `assigned`, `reserved`, `repair`, `lost`, `disposed`
- ผู้ดูแลหรือ custodian
- สถานที่ตั้งปัจจุบัน
- บริษัทเจ้าของและ cost center
- สภาพตอนรับและตอนคืน
- รูปถ่ายหลักฐาน
- อุปกรณ์เสริมที่มากับทรัพย์สิน
- ประวัติซ่อมและค่าใช้จ่าย
- วันจำหน่ายและวิธีจำหน่าย
- ค่าเสื่อมราคาและมูลค่าคงเหลือ
- เอกสาร PO, invoice และใบรับประกัน
- ลายเซ็นหรือการยืนยันรับทรัพย์สิน
- การแจ้งเตือนประกันหมดและกำหนดคืน

## ข้อเสนอแนะด้าน Data Model

ควรเพิ่มหรือปรับตารางต่อไปนี้:

- `roles` และ `user_roles`
- `audit_logs`
- `asset_status_history`
- `asset_maintenance`
- `asset_attachments`
- `employee_offboarding`
- `offboarding_tasks`
- `inspection_snapshots`

ควรเพิ่ม index สำหรับ:

- active assignments
- `asset_assignments.employee_id`
- `asset_assignments.asset_id`
- `asset_checks.asset_id`
- `asset_checks.round_id`
- `employees.department_id`
- การค้นหา asset tag, employee code และ serial number

## Test Cases ที่ควรมี

### Automated Integration Tests

- มอบทรัพย์สินชิ้นเดียวพร้อมกันจากสอง request
- มอบทรัพย์สินที่ถูกใช้งานหรืออยู่ระหว่างซ่อม
- คืน assignment ที่คืนไปแล้ว
- ส่ง assignment ID ของพนักงานคนอื่น
- rollback เมื่อการมอบหรือคืนบางรายการล้มเหลว
- ตรวจนับแล้วโอนทรัพย์สิน จากนั้นเปิดรายงานรอบเก่า
- บันทึกผลตรวจโดยไม่มีรอบเปิด
- ทดสอบ status ที่ไม่ได้รับอนุญาต
- นำเข้า CSV ที่มี comma, quote, BOM และวันที่ผิด
- export ข้อมูลที่ขึ้นต้นด้วยอักขระสูตร Excel

### End-to-End Tests

- Login และ logout
- สิทธิ์ Admin, HR, Asset Officer, Inspector และ Read-only
- เพิ่ม แก้ไข และยกเลิกพนักงาน
- เพิ่ม มอบ โอน คืน ส่งซ่อม และจำหน่ายทรัพย์สิน
- ตรวจนับทรัพย์สินแบบรายพนักงานและ QR
- สร้างและปิดรอบตรวจ
- Reprint เอกสารรับ–คืน
- การใช้งานบนมือถือและแท็บเล็ต
- ตรวจว่าข้อมูลไม่สามารถเปิดจาก offline cache หลัง logout

## ผลตรวจอัตโนมัติ

### Production Build

ผล: ผ่าน

```text
Next.js 16.2.6
Compiled successfully
TypeScript passed
Static page generation passed
```

### ESLint

ผล: ไม่ผ่าน

- 1 error ที่ `app/(app)/assets/AssetForm.tsx:63`
- 5 warnings

Error หลักเกิดจากการเรียก `setState` ภายใน `useEffect` โดยตรงเพื่ออ่าน `window.location.origin`

### Automated Tests

ไม่พบไฟล์ automated test หรือ test script ใน `package.json`

### Database Data Quality Check

ไม่สามารถตรวจข้อมูลจริงได้ เนื่องจากปลายทางฐานข้อมูลปฏิเสธการเชื่อมต่อ จึงยังไม่สามารถยืนยันได้ว่ามี:

- active assignment ซ้ำ
- status ผิดรูปแบบ
- ผลตรวจที่ไม่มีรอบ
- วันที่คืนก่อนวันที่รับ
- วันที่ลาออกก่อนวันเริ่มงาน

### Dependency Security Audit

`npm audit` ไม่สำเร็จเนื่องจากปัญหา certificate ของ npm registry จึงยังไม่สามารถยืนยันสถานะช่องโหว่ของ dependencies ได้

## ลำดับการดำเนินงานที่แนะนำ

1. ป้องกัน active assignment ซ้ำและทำ transaction สำหรับมอบ–คืน
2. แก้ inspection report ให้ใช้ snapshot หรือ session owner
3. เพิ่ม RBAC และป้องกันการ cache ข้อมูลส่วนบุคคล
4. แก้ schema ให้ตรงกับระบบและสร้าง migration ที่ปลอดภัย
5. เพิ่ม server-side validation และ database constraints
6. แก้ direct bugs เช่น employee link, KPI และการ assign เครื่องซ่อม
7. เพิ่ม audit log และ offboarding workflow
8. เพิ่ม integration tests และ end-to-end tests สำหรับ flow สำคัญ
9. ปรับ responsive UI และหน้า Dashboard

