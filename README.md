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