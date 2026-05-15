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

function canUseDevProfile() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_DEV_LINE_PROFILE === "true"
  );
}

function getLiffRequiredError() {
  return new Error(
    "ยังไม่ได้ตั้งค่า LINE LIFF สำหรับระบบจอง กรุณาตั้งค่า NEXT_PUBLIC_LIFF_ID"
  );
}

export async function getLiffProfile(): Promise<LineProfile> {
  try {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    if (!liffId || liffId.trim() === "") {
      if (!canUseDevProfile()) {
        throw getLiffRequiredError();
      }

      return getDevProfile();
    }

    if (typeof window === "undefined") {
      if (!canUseDevProfile()) {
        throw getLiffRequiredError();
      }

      return getDevProfile();
    }

    const liff = (await import("@line/liff")).default;

    await liff.init({
      liffId,
    });

    if (!liff.isLoggedIn()) {
      liff.login({
        redirectUri: window.location.href,
      });

      if (!canUseDevProfile()) {
        throw new Error("กำลังพาเข้าสู่ระบบ LINE");
      }

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
    if (!canUseDevProfile()) {
      throw error;
    }

    console.warn("LIFF load failed, fallback to dev profile:", error);

    return getDevProfile();
  }
}
