function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  const rows = data.bookings || [];

  const headers = [
    "รหัสจอง",
    "ลูกค้า", "เบอร์โทร",
    "ห้องพัก",
    "เช็คอิน", "เช็คเอาท์", "คืน",
    "คน", "ห้อง",
    "ยอดรวม", "มัดจำ",
    "สถานะจอง", "สถานะชำระ", "วิธีชำระ",
    "เลขอ้างอิง", "สลิป",
    "หมายเหตุ",
    "สร้างเมื่อ", "อัปเดตเมื่อ",
  ];

  // ใส่ header ถ้ายังไม่มี
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  // ล้างข้อมูลเก่า (เก็บแถว header)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }

  // เขียนข้อมูลใหม่ทั้งหมด
  rows.forEach(b => {
    sheet.appendRow([
      b.booking_code,
      b.customer_name, b.customer_phone,
      b.room_name,
      b.check_in, b.check_out, b.nights,
      b.guests, b.room_count,
      b.total_price, b.deposit_amount,
      b.booking_status, b.payment_status, b.payment_method,
      b.payment_reference, b.payment_slip_url,
      b.note,
      b.created_at, b.updated_at,
    ]);
  });

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, count: rows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}
