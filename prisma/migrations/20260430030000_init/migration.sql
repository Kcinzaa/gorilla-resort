-- Initial schema for resort booking.
CREATE TABLE "User" (
  "id" SERIAL NOT NULL,
  "lineUserId" TEXT NOT NULL,
  "displayName" TEXT,
  "pictureUrl" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoomType" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "pricePerNight" INTEGER NOT NULL,
  "capacity" INTEGER NOT NULL,
  "totalRooms" INTEGER NOT NULL DEFAULT 1,
  "imageUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
  "id" SERIAL NOT NULL,
  "bookingCode" TEXT NOT NULL,
  "lineUserId" TEXT NOT NULL DEFAULT 'test-line-user-001',
  "displayName" TEXT,
  "pictureUrl" TEXT,
  "phone" TEXT,
  "note" TEXT,
  "roomTypeId" INTEGER NOT NULL,
  "checkIn" TIMESTAMP(3) NOT NULL,
  "checkOut" TIMESTAMP(3) NOT NULL,
  "guests" INTEGER NOT NULL,
  "totalPrice" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "depositAmount" INTEGER DEFAULT 0,
  "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
  "paymentMethod" TEXT,
  "paymentSlipUrl" TEXT,
  "paymentReference" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" INTEGER,

  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_lineUserId_key" ON "User"("lineUserId");
CREATE UNIQUE INDEX "Booking_bookingCode_key" ON "Booking"("bookingCode");

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_roomTypeId_fkey"
  FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
