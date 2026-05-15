/**
 * Google Apps Script — Gorilla Resort Booking Sync
 *
 * วิธีติดตั้ง:
 * 1. เปิด Google Sheet ที่ต้องการ → Extensions → Apps Script
 * 2. วางโค้ดทั้งหมดนี้แทนที่โค้ดเดิม
 * 3. กด Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. คัดลอก URL ที่ได้ → ใส่ใน .env ของ Gorilla เป็น GOOGLE_SHEETS_WEBHOOK_URL
 */

// ชื่อ sheet tab ที่จะเขียนข้อมูล
var SHEET_NAME = "Bookings";

// หัวตาราง — ต้องตรงกับ fields ที่ส่งมาจาก Gorilla
var HEADERS = [
  "รหัสจอง",
  "ชื่อลูกค้า",
  "เบอร์โทร",
  "ห้องพัก",
  "เช็คอิน",
  "เช็คเอาท์",
  "จำนวนคืน",
  "จำนวนผู้เข้าพัก",
  "จำนวนห้อง",
  "ราคารวม (฿)",
  "มัดจำ (฿)",
  "สถานะจอง",
  "สถานะชำระ",
  "วิธีชำระ",
  "เลขอ้างอิงชำระ",
  "URL สลิป",
  "หมายเหตุ",
  "วันที่จอง",
  "อัปเดตล่าสุด",
];

// map field name → column index (0-based)
var FIELD_ORDER = [
  "booking_code",
  "customer_name",
  "customer_phone",
  "room_name",
  "check_in",
  "check_out",
  "nights",
  "guests",
  "room_count",
  "total_price",
  "deposit_amount",
  "booking_status",
  "payment_status",
  "payment_method",
  "payment_reference",
  "payment_slip_url",
  "note",
  "created_at",
  "updated_at",
];

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function ensureHeaders(sheet) {
  var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var hasHeaders = firstRow[0] === HEADERS[0];
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    // จัด style หัวตาราง
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground("#1e3a5f");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
}

function bookingToRow(booking) {
  return FIELD_ORDER.map(function (field) {
    var val = booking[field];
    if (val === null || val === undefined) return "";
    return val;
  });
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var bookings = payload.bookings || [];

    if (!Array.isArray(bookings) || bookings.length === 0) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, message: "ไม่มีข้อมูล bookings" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, SHEET_NAME);
    ensureHeaders(sheet);

    // ล้างข้อมูลเก่า (เก็บแถวหัว)
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }

    // เขียนข้อมูลใหม่ทั้งหมด
    var rows = bookings.map(bookingToRow);
    sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);

    // จัด format คอลัมน์ราคา (index 9, 10 → col 10, 11)
    sheet.getRange(2, 10, rows.length, 2).setNumberFormat("#,##0");

    // auto resize columns
    for (var i = 1; i <= HEADERS.length; i++) {
      sheet.autoResizeColumn(i);
    }

    // สลับสีแถว
    for (var r = 0; r < rows.length; r++) {
      var rowRange = sheet.getRange(r + 2, 1, 1, HEADERS.length);
      rowRange.setBackground(r % 2 === 0 ? "#ffffff" : "#f8fafc");
    }

    // ไฮไลท์สถานะ
    var statusColIdx = FIELD_ORDER.indexOf("booking_status") + 1;
    var paymentColIdx = FIELD_ORDER.indexOf("payment_status") + 1;
    for (var r = 0; r < rows.length; r++) {
      var booking = bookings[r];
      var statusCell = sheet.getRange(r + 2, statusColIdx);
      var payCell = sheet.getRange(r + 2, paymentColIdx);

      // สีสถานะจอง
      if (booking.booking_status === "CONFIRMED" || booking.booking_status === "CHECKED_IN") {
        statusCell.setBackground("#d1fae5").setFontColor("#065f46");
      } else if (booking.booking_status === "CANCELLED") {
        statusCell.setBackground("#fee2e2").setFontColor("#991b1b");
      } else {
        statusCell.setBackground("#fef9c3").setFontColor("#713f12");
      }

      // สีสถานะชำระ
      if (booking.payment_status === "PAID") {
        payCell.setBackground("#d1fae5").setFontColor("#065f46");
      } else if (booking.payment_status === "PENDING") {
        payCell.setBackground("#fef9c3").setFontColor("#713f12");
      } else if (booking.payment_status === "REJECTED") {
        payCell.setBackground("#fee2e2").setFontColor("#991b1b");
      } else {
        payCell.setBackground("#f1f5f9").setFontColor("#475569");
      }
    }

    // อัปเดต timestamp ใน cell A1 แบบ comment
    sheet.getRange(1, HEADERS.length).setNote(
      "ซิงก์ล่าสุด: " + new Date().toLocaleString("th-TH")
    );

    return ContentService.createTextOutput(
      JSON.stringify({
        ok: true,
        message: "ซิงก์สำเร็จ",
        count: rows.length,
        syncedAt: new Date().toISOString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error("GORILLA_SYNC_ERROR", err);
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// สำหรับทดสอบจาก browser (GET request)
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, message: "Gorilla Sheet Sync ready" })
  ).setMimeType(ContentService.MimeType.JSON);
}
