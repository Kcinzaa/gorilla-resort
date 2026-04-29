import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.roomType.createMany({
    data: [
      {
        name: "Standard Room",
        description: "ห้องพักมาตรฐาน สำหรับ 2 ท่าน",
        pricePerNight: 1200,
        capacity: 2,
        imageUrl: "/images/standard.jpg",
        isActive: true,
      },
      {
        name: "Deluxe Room",
        description: "ห้องพักวิวสวน สำหรับ 2 ท่าน",
        pricePerNight: 1800,
        capacity: 2,
        imageUrl: "/images/deluxe.jpg",
        isActive: true,
      },
      {
        name: "Family Room",
        description: "ห้องพักสำหรับครอบครัว",
        pricePerNight: 2500,
        capacity: 4,
        imageUrl: "/images/family.jpg",
        isActive: true,
      },
    ],
  });
}

main()
  .then(async () => {
    console.log("Seed completed");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });