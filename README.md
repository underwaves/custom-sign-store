# Custom Sign Studio — ระบบ E-Commerce สั่งทำป้ายออนไลน์แบบสำเร็จรูป (Full-Stack React + TypeScript + Supabase)

เว็บไซต์ร้านรับทำป้ายออนไลน์สไตล์ **Cute Pastel + Minimal** ที่ให้ลูกค้าเลือกประเภทป้าย เลือกสไตล์ (`Minimal` / `Decorative`) เลือกเทมเพลตต้นแบบ เลือกของตกแต่งฟรี (0 บาททุกชิ้น) กรอกข้อมูลตามประเภทป้าย และส่งคำสั่งซื้อเข้าสู่ฐานข้อมูลพร้อมระบบหลังบ้าน **Admin Studio Backoffice** ครบวงจร

---

## สารบัญโครงสร้างระบบ

1. **หน้าเว็บไซต์สาธารณะ (18 หน้า)**
   - `/` — หน้าแรก (Hero Banner, หมวดหมู่ยอดนิยม, สินค้าแนะนำ, เทมเพลตยอดนิยม, ผลงานตัวอย่าง, วิธีสั่งทำ, จุดเด่นร้าน, รีวิวลูกค้า, FAQ, ช่องทางติดต่อ)
   - `/categories` — เลือกประเภทป้ายทั้งหมด (15 ประเภทป้าย แบ่งตามกลุ่มหมวดหมู่)
   - `/products` — รายการป้ายและเรทราคาเปรียบเทียบสไตล์ Minimal vs Decorative
   - `/templates` — แกลเลอรีเทมเพลตสำเร็จรูปพร้อมตัวกรองและค้นหา
   - `/templates/:code` — รายละเอียดเทมเพลตและปุ่มเริ่มสั่งทำด้วยเทมเพลตนั้นทันที
   - `/order-wizard` — ระบบสั่งทำป้าย 7 ขั้นตอน (Custom Order Wizard รองรับสั่งหลายป้ายใน 1 ออเดอร์)
   - `/order-summary` — สรุปตะกร้าสั่งทำป้ายและคำนวณส่วนลดโปรโมชั่น
   - `/order-confirmation/:orderNumber` — หน้ายืนยันคำสั่งซื้อสำเร็จพร้อมรหัสติดตามงาน
   - `/track-order` — หน้าติดตามสถานะออเดอร์อย่างปลอดภัย (ต้องยืนยันทั้งรหัสออเดอร์ + ข้อมูลติดต่อ และพรางเลขบัญชีธนาคารอัตโนมัติ)
   - `/login`, `/register`, `/profile`, `/my-orders`, `/favorites` — ระบบสมาชิก ประวัติการสั่งซื้อ ปุ่มสั่งทำซ้ำ (Reorder) และรายการเทมเพลตโปรด
   - `/contact`, `/faq`, `/privacy-policy`, `/terms` — หน้าข้อมูลติดต่อ คำถามพบบ่อย นโยบายความเป็นส่วนตัว และข้อกำหนดการใช้บริการ

2. **หน้าผู้ดูแลระบบ Admin Dashboard (19 หน้า)**
   - `/admin/login` — เข้าสู่ระบบผู้ดูแล
   - `/admin/dashboard` — ภาพรวมร้านค้า (แยกยอดขายจริงออกจากออเดอร์ตัวอย่าง `is_demo` อย่างชัดเจน)
   - `/admin/categories` — จัดการกลุ่มหมวดหมู่หลัก (`category_groups`)
   - `/admin/sign-types` — จัดการประเภทป้าย 15+ ประเภท (`sign_categories`)
   - `/admin/styles` — จัดการสไตล์ป้าย Minimal / Decorative (`sign_styles`)
   - `/admin/templates` — จัดการเทมเพลตและอัปโหลดรูปภาพ (`sign_templates`)
   - `/admin/decoration-colors` — จัดการหมวดหมู่สีของตกแต่ง (`decoration_colors`)
   - `/admin/decoration-categories` — จัดการหมวดหมู่ย่อยของตกแต่งหลายระดับ (`decoration_categories`)
   - `/admin/decorations` — จัดการคลังของตกแต่งฟรี ล็อกราคา 0 บาททุกชิ้น (`decorations`)
   - `/admin/form-fields` — จัดการช่องฟอร์มกรอกข้อมูลรายประเภทป้าย (`product_fields`)
   - `/admin/orders` — จัดการคำสั่งซื้อ เปลี่ยนสถานะ 10 ขั้นตอน และบันทึกประวัติ (`orders`, `order_status_history`)
   - `/admin/customers` — ข้อมูลลูกค้าและยอดสั่งซื้อสะสม
   - `/admin/pricing` — จัดการโครงสร้างราคาเริ่มต้น ราคาเพิ่มตามสไตล์ และค่าบริการ (มีผลเฉพาะออเดอร์ใหม่ ไม่กระทบ Snapshot ออเดอร์เก่า)
   - `/admin/promotions` — จัดการโค้ดส่วนลด (`promotions`)
   - `/admin/reviews` — อนุมัติ/ซ่อนรีวิวลูกค้า (`reviews`)
   - `/admin/website-content` — แก้ไขเนื้อหาหน้าแรก Hero Banner, ขั้นตอนสั่งซื้อ, จุดเด่น, FAQ และช่องทางติดต่อ (`site_settings`)
   - `/admin/site-settings` — ตั้งค่าชื่อร้าน โลโก้ สีธีมพาสเทล (Dynamic CSS Variables) และจัดการข้อมูล Demo
   - `/admin/users` — จัดการสิทธิ์ผู้ใช้งาน (`user_roles`: `customer`, `staff`, `admin`, `super_admin`)
   - `/admin/activity-logs` — ประวัติการทำงานของแอดมิน (`audit_logs`)

---

## สถานะการเชื่อมต่อฐานข้อมูล (ความโปร่งใสตามข้อกำหนดโปรเจกต์)

- **สถานะปัจจุบันของสภาพแวดล้อม**: โปรเจกต์ได้จัดเตรียมโค้ดเชื่อมต่อ **Supabase Client (`@supabase/supabase-js`)**, **SQL Migrations ทั้ง 20 ตาราง**, **Row Level Security (RLS)**, **Storage Buckets 4 ถัง**, **Server-Side PostgreSQL RPC Functions** และ **Seed Data** ไว้ครบถ้วนแล้ว
- **สิ่งที่เจ้าของโปรเจกต์ต้องตั้งค่าเพื่อเชื่อมต่อ Cloud Supabase จริง**: เนื่องจากยังไม่ได้ระบุค่า `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` ของบัญชี Supabase ของคุณในไฟล์ `.env.local` ระบบจึงทำงานใน **โหมดเริ่มต้นพร้อมข้อมูล Placeholder & Demo** เพื่อให้สามารถเปิดดูและทดสอบทุกหน้าจอได้ทันที และเมื่อคุณใส่ค่า `.env.local` ตามขั้นตอนด้านล่าง ระบบจะสลับไปอ่าน/เขียนฐานข้อมูล **Supabase PostgreSQL จริง** โดยอัตโนมัติ

---

## การตั้งค่าใช้งานจริงด้วย Firebase & Render (Production Setup)

โปรเจกต์นี้ได้รับการปรับปรุงให้รองรับ **Google Firebase** (Firestore + Firebase Storage + Firebase Auth) อย่างสมบูรณ์:

### ขั้นตอนที่ 1: สร้างโปรเจกต์บน Firebase Console
1. ไปที่ [Firebase Console](https://console.firebase.google.com/) แล้วกด **Add project** (ตั้งชื่อ เช่น `custom-sign-store`)
2. เปิดใช้งานบริการ 3 ตัว:
   - **Authentication**: เมนู Build > Authentication > Get started > Sign-in method > เลือกเปิดใช้งาน **Email/Password**
   - **Cloud Firestore**: เมนู Build > Firestore Database > Create database > เลือก Location (เช่น `asia-southeast1`) และเลือก Start in production mode (หรือ test mode)
   - **Storage**: เมนู Build > Storage > Get started
3. นำค่า Web App Config:
   - ไปที่ **Project Settings** (ไอคอนฟันเฟือง) > แท็บ General
   - เลื่อนลงมาที่หัวข้อ **Your apps** > กดไอคอนเว็บ `</>` เพื่อลงทะเบียน Web App
   - คัดลอกค่า Config ทั้ง 6 ตัว:
     - `apiKey`
     - `authDomain`
     - `projectId`
     - `storageBucket`
     - `messagingSenderId`
     - `appId`

### ขั้นตอนที่ 2: ตั้งค่าไฟล์ `.env.local`
สร้างหรือคัดลอกไฟล์ `.env.example` เป็น `.env.local`:

```env
VITE_FIREBASE_API_KEY=YOUR-FIREBASE-API-KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR-PROJECT-ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR-PROJECT-ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR-PROJECT-ID.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR-MESSAGING-SENDER-ID
VITE_FIREBASE_APP_ID=YOUR-FIREBASE-APP-ID
```

### ขั้นตอนที่ 3: ระบบสร้างข้อมูลและสิทธิ์ Admin อัตโนมัติ (Auto-Seeding & First Super Admin)
- **Auto-Seeding**: เมื่อคุณเปิดใช้งานเว็บครั้งแรก ระบบจะตรวจพบ Firestore ว่าง และทำการนำเข้าข้อมูลประเภทป้าย 15 รายการ, 2 สไตล์, 20 เทมเพลต และของตกแต่งฟรี 30 ชิ้นให้โดยอัตโนมัติ
- **First Admin**: ผู้ใช้งานที่ลงทะเบียนผ่านหน้า `/register` คนแรกสุดของระบบ จะได้รับสิทธิ์ **`super_admin`** โดยอัตโนมัติทันที

---

## ขั้นตอนการเชื่อมต่อ Supabase (ทางเลือกเดิม)

### ขั้นตอนที่ 1: สร้างโปรเจกต์บน Supabase
1. ไปที่ [https://supabase.com/dashboard](https://supabase.com/dashboard) และสร้างโปรเจกต์ใหม่ชื่อ `custom-sign-studio`
2. ไปที่เมนู **Project Settings > API** แล้วคัดลอก:
   - `Project URL`
   - `anon public key`

### ขั้นตอนที่ 2: ตั้งค่าไฟล์ `.env.local`
คัดลอกไฟล์ `.env.example` เป็น `.env.local` ที่โฟลเดอร์รากของโปรเจกต์ แล้วใส่ค่าจริงของคุณ:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

### ขั้นตอนที่ 3: รันไฟล์ SQL Migration และ Seed Data
เปิดเมนู **SQL Editor** ใน Supabase Dashboard (หรือใช้คำสั่ง `supabase db push` ผ่าน Supabase CLI) แล้วรันไฟล์ตามลำดับดังนี้:

1. `supabase/migrations/20261027000001_initial_schema.sql`
   - สร้างตารางทั้ง 20 ตาราง พร้อม Primary Keys, Foreign Keys, Indexes และ `CHECK (price = 0.00 AND is_free = true)` สำหรับตารางของตกแต่ง
2. `supabase/migrations/20261027000002_rls_and_storage.sql`
   - เปิดใช้งาน Row Level Security (RLS) ทุกตาราง สร้างฟังก์ชันตรวจสอบสิทธิ์ `public.is_admin_or_staff()` และสร้าง Storage Buckets ทั้ง 4 ถัง (`site-assets`, `sign-templates`, `decorations`, `customer-references`)
3. `supabase/migrations/20261027000003_order_rpc.sql`
   - สร้างฟังก์ชัน `public.submit_custom_sign_order(p_payload jsonb)` สำหรับคำนวณราคาและบันทึกออเดอร์แบบ Atomic Transaction บนเซิร์ฟเวอร์
4. `supabase/migrations/20261027000004_security_and_pricing_fixes.sql`
   - ใช้ Tracking Token แบบสุ่มหรือสิทธิ์เจ้าของบัญชีแทนการยืนยันด้วยเบอร์โทรศัพท์, จำกัดการลองค้นหาซ้ำ, ตรวจฟิลด์บังคับและค่าความอ่อนไหวจากฐานข้อมูล, คิดค่าบริการจาก `contact_footer` ฝั่งเซิร์ฟเวอร์ และล็อกโควตาโปรโมชันระหว่างการสั่งซื้อ
5. `supabase/seed.sql`
   - เพิ่มข้อมูลเริ่มต้น (15 ประเภทป้าย, 2 สไตล์, 20 เทมเพลต, 9 สีของตกแต่ง, 13 หมวดหมู่ย่อยของตกแต่ง, 30 ของตกแต่งฟรี, ฟอร์มกรอกข้อมูลรายป้าย และตัวอย่างออเดอร์ Demo)

### ขั้นตอนที่ 4: กำหนดสิทธิ์ Admin คนแรกในฐานข้อมูล
หลังจากสมัครสมาชิกผ่านหน้า `/register` (หรือสร้างผู้ใช้ในเมนู Authentication > Users บน Supabase) ให้รันคำสั่ง SQL นี้ใน Supabase SQL Editor เพื่อมอบสิทธิ์ `super_admin`:

```sql
insert into public.user_roles (user_id, role)
select id, 'super_admin'
from auth.users
where email = 'อีเมลแอดมินของคุณ@example.com'
on conflict (user_id) do update set role = 'super_admin';
```

---

## การรันโปรเจกต์ในเครื่อง (Local Development)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. สร้างภาพ SVG Placeholder (หากต้องการสร้างใหม่)
npm run placeholders

# 3. รันเซิร์ฟเวอร์พัฒนา (Vite Dev Server)
npm run dev

# 4. ตรวจสอบ TypeScript และ Build สำหรับ Production
npm run build
```

## นำขึ้น Render

ไฟล์ `render.yaml` ตั้งค่าโปรเจกต์เป็น Static Site, build ด้วย `npm ci && npm run build`, เผยแพร่โฟลเดอร์ `dist` และ rewrite เส้นทาง SPA กลับไปที่ `index.html` เพื่อรองรับ React Router

1. เชื่อม Git repository กับ Render และเลือกใช้ Blueprint จาก `render.yaml`
2. กรอก `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY` ใน Environment ของ Render แล้วสั่ง deploy ใหม่ทุกครั้งที่เปลี่ยนค่าเหล่านี้ เพราะ Vite ฝังค่าไว้ในไฟล์ตอน build
3. ห้ามใส่ `service_role` key ใน Render Environment ของเว็บไซต์นี้หรือในไฟล์ที่ขึ้น Git; เว็บไซต์ใช้เฉพาะ anon/publishable key และให้ RLS/RPC ควบคุมสิทธิ์

ก่อนเปิดรับออเดอร์จริง ให้ติดตั้ง/เรียก Supabase CLI แล้วรัน `npx supabase login`, `npx supabase link --project-ref <project-ref>` และ `npx supabase db push` เพื่อใช้ migrations ตามลำดับ หากฐานข้อมูลปลายทางมี schema ที่สร้างจาก Dashboard อยู่แล้ว ให้ตรวจและจัดการ migration history ให้ตรงก่อน push อย่ารัน `db reset` กับฐานข้อมูล production เพราะคำสั่งนั้นลบและสร้างฐานข้อมูลใหม่ จากนั้นตรวจว่าตาราง `site_settings` มีแถว `contact_footer` และค่า `service_fee` ตรงกับที่ร้านต้องการ ตั้งบัญชีผู้ดูแลผ่านขั้นตอนในหัวข้อ Admin ด้านบน แล้ว deploy Static Site บน Render
