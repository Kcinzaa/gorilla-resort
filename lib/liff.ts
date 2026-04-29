export type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  isDevMode?: boolean;
};

function getDevProfile(): LineProfile {
  const devUserId =
    process.env.NEXT_PUBLIC_DEV_LINE_USER_ID || "test-line-user-001";

  const isAdmin = devUserId === "test-line-admin-001";

  return {
    userId: devUserId,
    displayName: isAdmin ? "Admin Tester" : "Test Customer",
    pictureUrl: "",
    isDevMode: true,
  };
}

export async function getLiffProfile(): Promise<LineProfile> {
  try {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    // ยังไม่มี LIFF ID ให้ใช้ Dev Mode ทันที
    if (!liffId || liffId.trim() === "") {
      return getDevProfile();
    }

    // ถ้าเปิดนอก browser ให้ fallback
    if (typeof window === "undefined") {
      return getDevProfile();
    }

    const liff = (await import("@line/liff")).default;

    await liff.init({
      liffId,
    });

    if (!liff.isLoggedIn()) {
      liff.login();
      return getDevProfile();
    }

    const profile = await liff.getProfile();

    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || "",
      isDevMode: false,
    };
  } catch (error) {
    // สำคัญ: ห้าม throw error เพราะจะทำให้ Next.js overlay เด้ง
    console.warn("LIFF load failed, fallback to dev profile:", error);

    return getDevProfile();
  }
}