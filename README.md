# Gorilla Resort Booking

ระบบจองห้องพักรีสอร์ทออนไลน์ ออกแบบสำหรับใช้งานผ่าน LINE OA และ LINE LIFF ลูกค้าสามารถเข้าหน้า Home ของรีสอร์ท ดูห้องพัก เช็กห้องว่าง ส่งคำขอจอง แนบสลิปค่ามัดจำ และติดตามสถานะการจองได้ ส่วนแอดมินสามารถจัดการห้องพัก ตรวจสอบรายการจอง ตรวจสลิป ยืนยันการชำระเงิน และอัปเดตสถานะการจองได้

## Features

### Customer

- หน้า Home สำหรับโชว์รีสอร์ท
- ดึงโปรไฟล์ผู้ใช้จาก LINE LIFF
- ดูรายการห้องพักจากฐานข้อมูล
- เช็กห้องว่างตามวันที่เข้าพักและวันที่ออก
- จองห้องพักออนไลน์
- แนบสลิปค่ามัดจำ
- ดูรายการจองของฉัน
- ส่งสลิปใหม่เมื่อแอดมินปฏิเสธสลิป
- รองรับการเปิดใช้งานผ่าน LINE OA / LIFF

### Admin

- Login สำหรับแอดมิน
- Dashboard สรุปข้อมูลการจอง
- จัดการห้องพัก
- ดูรายการจองทั้งหมด
- ดูรายละเอียดรายการจอง
- ตรวจสอบรูปสลิป
- ยืนยันการชำระเงิน
- ปฏิเสธสลิป
- ยืนยัน / ยกเลิกรายการจอง

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Prisma ORM
- Supabase PostgreSQL
- LINE LIFF
- Vercel
- Lucide React

## Project Structure

```txt
app/
  api/
    admin/
    bookings/
    liff-user/
    rooms/
    upload/
  admin/
    bookings/
    dashboard/
    login/
    rooms/
  booking/
  home/
  my-bookings/
  rooms/

components/
  Navbar.tsx
  BookingForm.tsx
  RoomCard.tsx
  AdminSidebar.tsx

lib/
  prisma.ts
  liff.ts
  useLineProfile.ts
  auth.ts
  promptpay.ts

prisma/
  schema.prisma
  migrations/

## Production Setup

### Vercel Environment Variables

Set these variables in Vercel before production deploy:

- `DATABASE_URL`: Supabase PostgreSQL connection string
- `ADMIN_USERNAME`: admin login username
- `ADMIN_PASSWORD`: admin login password
- `ADMIN_TOKEN_SECRET`: long random secret for the admin session cookie
- `SUPABASE_URL`: Supabase project URL, for example `https://xxxx.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key, server-side only
- `SUPABASE_STORAGE_BUCKET`: Storage bucket for payment slips, for example `payment-slips`
- `SUPABASE_STORAGE_PUBLIC_URL`: optional public base URL for the bucket
- `PAYMENT_WEBHOOK_SECRET`: secret used by future payment gateway webhooks
- `AUTO_CONFIRM_BOOKING_ON_PAYMENT`: set to `true` if paid webhooks should confirm bookings automatically

### LINE LIFF

The app is ready for LIFF but does not require a real LIFF ID during early testing.

- Temporary Vercel testing without LIFF: set `NEXT_PUBLIC_ENABLE_DEV_LINE_PROFILE=true`
- Real LINE mode: set `NEXT_PUBLIC_LIFF_ID` and remove/disable `NEXT_PUBLIC_ENABLE_DEV_LINE_PROFILE`
- Optional admin LINE IDs: `NEXT_PUBLIC_ADMIN_LINE_USER_IDS=Uxxxx,Uyyyy`

### Supabase Storage

Create a Supabase Storage bucket named the same as `SUPABASE_STORAGE_BUCKET`.
Uploaded payment slips are stored under `slips/<year>/...`.

For the current UI to preview slip images directly, the bucket or `SUPABASE_STORAGE_PUBLIC_URL` must serve readable image URLs. If you want a private bucket later, add a signed-url image proxy endpoint before switching the bucket to private-only access.

### Payment Automation

PromptPay QR by itself does not provide automatic payment confirmation. The project now includes a generic endpoint at:

```txt
POST /api/payments/webhook
```

A future payment provider can call it with `x-payment-webhook-secret`, `bookingCode` or `paymentReference`, and a paid status such as `PAID`, `SUCCESS`, `SUCCEEDED`, or `COMPLETED`.
