"use client";

import { useEffect, useState } from "react";
import { getLiffProfile, type LineProfile } from "@/lib/liff";

type UserRole = "CUSTOMER" | "ADMIN";

type LineProfileWithRole = LineProfile & {
  role?: UserRole;
  isAdmin?: boolean;
};

function getProfileWithRole(profile: LineProfile): LineProfileWithRole {
  const adminLineUserIds = [
    "test-line-admin-001",

    // อนาคตถ้ามี LINE LIFF จริง ให้เอา LINE userId ของแอดมินมาใส่ตรงนี้
    // "Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  ];

  const isAdmin = adminLineUserIds.includes(profile.userId);

  return {
    ...profile,
    displayName:
      profile.userId === "test-line-admin-001"
        ? "Admin Tester"
        : profile.displayName,
    role: isAdmin ? "ADMIN" : "CUSTOMER",
    isAdmin,
  };
}

export function useLineProfile() {
  const [profile, setProfile] = useState<LineProfileWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const lineProfile = await getLiffProfile();

        if (!lineProfile) {
          setProfile(null);
          return;
        }

        const profileWithRole = getProfileWithRole(lineProfile);

        setProfile(profileWithRole);

        await fetch("/api/liff-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lineUserId: profileWithRole.userId,
            displayName: profileWithRole.displayName,
            pictureUrl: profileWithRole.pictureUrl || "",
            role: profileWithRole.role,
            isAdmin: profileWithRole.isAdmin,
          }),
        });
      } catch (err) {
        console.error(err);
        setError("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    isDevMode: profile?.isDevMode ?? false,
    isAdmin: profile?.isAdmin ?? false,
    role: profile?.role ?? "CUSTOMER",
  };
}