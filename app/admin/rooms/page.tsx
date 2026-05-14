"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Home,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

type RoomItem = {
  id: number;
  name: string;
  description?: string | null;
  pricePerNight: number;
  capacity: number;
  totalRooms?: number | null;
  reservedRooms?: number | null;
  imageUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type RoomForm = {
  id?: number;
  name: string;
  description: string;
  pricePerNight: string;
  capacity: string;
  totalRooms: string;
  reservedRooms: string;
  imageUrl: string;
  isActive: boolean;
};

const emptyForm: RoomForm = {
  name: "",
  description: "",
  pricePerNight: "",
  capacity: "2",
  totalRooms: "1",
  reservedRooms: "0",
  imageUrl: "",
  isActive: true,
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(amount);
}

function toArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rooms)) return payload.rooms;
  if (Array.isArray(payload?.data?.rooms)) return payload.data.rooms;

  return [];
}

function AdminRoomStatCard({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: typeof BedDouble;
  iconClass: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
      <div
        className={[
          "flex h-14 w-14 items-center justify-center rounded-2xl ring-1",
          iconClass,
        ].join(" ")}
      >
        <Icon size={26} />
      </div>
      <p className="mt-5 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-black text-slate-950">{value}</p>
    </div>
  );
}

export default function AdminRoomsPage() {
  const router = useRouter();

  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL"
  );

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<RoomForm>(emptyForm);

  const activeRooms = useMemo(() => {
    return rooms.filter((room) => room.isActive !== false);
  }, [rooms]);

  const inactiveRooms = useMemo(() => {
    return rooms.filter((room) => room.isActive === false);
  }, [rooms]);

  const totalRoomCount = useMemo(() => {
    return activeRooms.reduce((sum, room) => sum + (room.totalRooms ?? 1), 0);
  }, [activeRooms]);

  const minPrice = useMemo(() => {
    if (activeRooms.length === 0) return 0;

    return Math.min(...activeRooms.map((room) => room.pricePerNight));
  }, [activeRooms]);

  const filteredRooms = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && room.isActive !== false) ||
        (statusFilter === "INACTIVE" && room.isActive === false);

      const text = [
        room.name,
        room.description,
        room.pricePerNight,
        room.capacity,
        room.totalRooms,
        room.imageUrl,
        room.isActive ? "active" : "inactive",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchSearch = !search || text.includes(search);

      return matchStatus && matchSearch;
    });
  }, [rooms, keyword, statusFilter]);

  async function fetchRooms() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/rooms", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        setError("API /api/admin/rooms ยังไม่ส่ง JSON กลับมา");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถโหลดรายการห้องพักได้");
        return;
      }

      setRooms(toArray<RoomItem>(result));
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการโหลดรายการห้องพัก");
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setForm(emptyForm);
    setOpenForm(true);
    setError("");
    setSuccess("");
  }

  function openEditForm(room: RoomItem) {
    setForm({
      id: room.id,
      name: room.name || "",
      description: room.description || "",
      pricePerNight: String(room.pricePerNight || ""),
      capacity: String(room.capacity || "2"),
      totalRooms: String(room.totalRooms ?? 1),
      reservedRooms: String(room.reservedRooms ?? 0),
      imageUrl: room.imageUrl || "",
      isActive: room.isActive !== false,
    });
    setOpenForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setOpenForm(false);
    setForm(emptyForm);
    setError("");
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "กรุณากรอกชื่อห้องพัก";
    }

    if (!form.pricePerNight || Number(form.pricePerNight) <= 0) {
      return "กรุณากรอกราคาต่อคืนให้ถูกต้อง";
    }

    if (!form.capacity || Number(form.capacity) <= 0) {
      return "กรุณากรอกจำนวนผู้เข้าพักให้ถูกต้อง";
    }

    if (!form.totalRooms || Number(form.totalRooms) <= 0) {
      return "กรุณากรอกจำนวนห้องให้ถูกต้อง";
    }

    if (Number(form.reservedRooms || 0) < 0) {
      return "จำนวนห้องที่ล็อกไว้ต้องไม่ติดลบ";
    }

    if (Number(form.reservedRooms || 0) > Number(form.totalRooms)) {
      return "จำนวนห้องที่ล็อกไว้ต้องไม่มากกว่าจำนวนห้องทั้งหมด";
    }

    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        id: form.id,
        name: form.name.trim(),
        description: form.description.trim(),
        pricePerNight: Number(form.pricePerNight),
        capacity: Number(form.capacity),
        totalRooms: Number(form.totalRooms),
        reservedRooms: Number(form.reservedRooms || 0),
        imageUrl: form.imageUrl.trim(),
        isActive: form.isActive,
      };

      const response = await fetch("/api/admin/rooms", {
        method: form.id ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถบันทึกข้อมูลห้องพักได้");
        return;
      }

      setSuccess(form.id ? "แก้ไขห้องพักสำเร็จ" : "เพิ่มห้องพักสำเร็จ");
      setOpenForm(false);
      setForm(emptyForm);
      await fetchRooms();
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการบันทึกข้อมูลห้องพัก");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(room: RoomItem) {
    try {
      setUpdatingId(room.id);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/rooms", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: room.id,
          name: room.name,
          description: room.description || "",
          pricePerNight: room.pricePerNight,
          capacity: room.capacity,
          totalRooms: room.totalRooms ?? 1,
          reservedRooms: room.reservedRooms ?? 0,
          imageUrl: room.imageUrl || "",
          isActive: room.isActive === false,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถอัปเดตสถานะห้องพักได้");
        return;
      }

      setRooms((prev) =>
        prev.map((item) =>
          item.id === room.id
            ? {
                ...item,
                isActive: room.isActive === false,
              }
            : item
        )
      );

      setSuccess(
        room.isActive === false ? "เปิดใช้งานห้องพักแล้ว" : "ปิดใช้งานห้องพักแล้ว"
      );
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการอัปเดตสถานะห้องพัก");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteRoom(room: RoomItem) {
    const confirmed = window.confirm(
      `ต้องการลบ "${room.name}" จริงหรือไม่?\nถ้าห้องนี้มีรายการจองอยู่ อาจลบไม่ได้ แนะนำให้ปิดใช้งานแทน`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(room.id);
      setError("");
      setSuccess("");

      const params = new URLSearchParams({
        id: String(room.id),
      });

      const response = await fetch(`/api/admin/rooms?${params.toString()}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "ไม่สามารถลบห้องพักได้");
        return;
      }

      setRooms((prev) => prev.filter((item) => item.id !== room.id));
      setSuccess("ลบห้องพักสำเร็จ");
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการลบห้องพัก");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });

    router.push("/admin/login");
    router.refresh();
  }

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#edf4f7] text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-emerald-200/45 blur-3xl" />
        <div className="absolute right-0 top-32 h-[30rem] w-[30rem] rounded-full bg-sky-200/50 blur-3xl" />
      </div>
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-3 z-40 mb-5 overflow-hidden rounded-[1.5rem] bg-white/88 px-4 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.10)] ring-1 ring-white/70 backdrop-blur-xl sm:top-4 sm:rounded-[2rem] sm:px-5 sm:py-4">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-orange-400" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <BedDouble size={25} className="text-white" />
              </div>

              <div>
                <h1 className="text-lg font-black text-slate-950">
                  Admin Rooms
                </h1>
                <p className="text-sm text-slate-500">
                  เพิ่ม แก้ไข และปิดใช้งานห้องพัก
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <LayoutDashboard size={17} className="text-slate-700" />
                <span className="text-slate-700">Dashboard</span>
              </Link>

              <Link
                href="/admin/bookings"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <CalendarCheck size={17} className="text-slate-700" />
                <span className="text-slate-700">Bookings</span>
              </Link>

              <Link
                href="/admin/rooms"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <BedDouble size={17} className="text-white" />
                <span className="text-white">Rooms</span>
              </Link>

              <Link
                href="/rooms"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <Home size={17} className="text-slate-700" />
                <span className="text-slate-700">ไปหน้าห้องพัก</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"
              >
                <LogOut size={17} className="text-red-700" />
                <span className="text-red-700">Logout</span>
              </button>
            </nav>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-stretch">
          <AdminRoomStatCard
            icon={BedDouble}
            iconClass="bg-emerald-50 text-emerald-600 ring-emerald-100"
            label="ประเภทที่เปิดใช้"
            value={activeRooms.length}
          />
          <AdminRoomStatCard
            icon={Users}
            iconClass="bg-blue-50 text-blue-600 ring-blue-100"
            label="จำนวนห้องรวม"
            value={totalRoomCount}
          />
          <AdminRoomStatCard
            icon={Wallet}
            iconClass="bg-amber-50 text-amber-600 ring-amber-100"
            label="ราคาเริ่มต้น"
            value={minPrice > 0 ? formatCurrency(minPrice) : "-"}
          />
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex min-h-40 items-center justify-center gap-2 rounded-[2rem] bg-emerald-600 px-6 py-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 md:col-span-2 xl:col-span-1"
          >
            <Plus size={20} className="text-white" />
            <span className="text-white">เพิ่มห้องพักใหม่</span>
          </button>
        </section>

        <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem] sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="ค้นหาชื่อห้อง, รายละเอียด, ราคา..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")
              }
              className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="ACTIVE">เปิดใช้งาน</option>
              <option value="INACTIVE">ปิดใช้งาน</option>
            </select>

            <button
              type="button"
              onClick={fetchRooms}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <RefreshCcw size={18} className="text-white" />
              <span className="text-white">โหลดใหม่</span>
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              <Plus size={18} className="text-white" />
              <span className="text-white">เพิ่มห้อง</span>
            </button>
          </div>
        </section>

        {(error || success) && (
          <section
            className={[
              "mt-5 rounded-[2rem] border p-5 shadow-sm sm:rounded-[2.5rem]",
              error
                ? "border-red-200 bg-red-50"
                : "border-emerald-200 bg-emerald-50",
            ].join(" ")}
          >
            <div className="flex items-start gap-4">
              <div
                className={[
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                  error ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600",
                ].join(" ")}
              >
                {error ? <AlertCircle size={28} /> : <CheckCircle2 size={28} />}
              </div>

              <div>
                <h2
                  className={[
                    "text-xl font-black",
                    error ? "text-red-700" : "text-emerald-700",
                  ].join(" ")}
                >
                  {error ? "เกิดข้อผิดพลาด" : "สำเร็จ"}
                </h2>
                <p
                  className={[
                    "mt-2 text-sm leading-6",
                    error ? "text-red-600" : "text-emerald-700",
                  ].join(" ")}
                >
                  {error || success}
                </p>
              </div>
            </div>
          </section>
        )}

        {loading && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Loader2 size={38} className="animate-spin" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              กำลังโหลดรายการห้องพัก
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              กรุณารอสักครู่ ระบบกำลังดึงข้อมูลประเภทห้องพักทั้งหมด
            </p>
          </section>
        )}

        {!loading && filteredRooms.length === 0 && (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:rounded-[2.5rem]">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <BedDouble size={38} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              ไม่พบห้องพัก
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              ยังไม่มีห้องพัก หรือไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              <Plus size={18} className="text-white" />
              <span className="text-white">เพิ่มห้องพักแรก</span>
            </button>
          </section>
        )}

        {!loading && filteredRooms.length > 0 && (
          <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => (
              <article
                key={room.id}
                className="group overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200 sm:rounded-[2.5rem]"
              >
                <div className="relative h-64 overflow-hidden bg-slate-200">
                  {room.imageUrl ? (
                    <img
                      src={room.imageUrl}
                      alt={room.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <ImageIcon size={44} />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                  <div
                    className={[
                      "absolute left-4 top-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black shadow-sm ring-1",
                      room.isActive === false
                        ? "bg-red-50 text-red-700 ring-red-100"
                        : "bg-emerald-50 text-emerald-700 ring-emerald-100",
                    ].join(" ")}
                  >
                    {room.isActive === false ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                    {room.isActive === false ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-3xl font-black text-white">
                      {room.name}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-200">
                      {room.description || "ยังไม่มีรายละเอียดห้องพัก"}
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Users size={16} />
                        <p className="text-xs font-bold">พักได้</p>
                      </div>
                      <p className="mt-2 font-black text-slate-950">
                        {room.capacity} คน
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                      <div className="flex items-center gap-2 text-slate-500">
                        <BedDouble size={16} />
                        <p className="text-xs font-bold">ทั้งหมด</p>
                      </div>
                      <p className="mt-2 font-black text-slate-950">
                        {room.totalRooms ?? 1} ห้อง
                      </p>
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-100">
                      <div className="flex items-center gap-2 text-amber-700">
                        <ShieldCheck size={16} />
                        <p className="text-xs font-bold">ล็อกไว้</p>
                      </div>
                      <p className="mt-2 font-black text-amber-700">
                        {room.reservedRooms ?? 0} ห้อง
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Wallet size={16} />
                        <p className="text-xs font-bold">ราคา</p>
                      </div>
                      <p className="mt-2 font-black text-slate-950">
                        {formatCurrency(room.pricePerNight)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(room)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      <Edit3 size={18} className="text-white" />
                      <span className="text-white">แก้ไข</span>
                    </button>

                    <button
                      type="button"
                      disabled={updatingId === room.id}
                      onClick={() => toggleActive(room)}
                      className={[
                        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
                        room.isActive === false
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-amber-500 text-white hover:bg-amber-600",
                      ].join(" ")}
                    >
                      {updatingId === room.id ? (
                        <Loader2 size={18} className="animate-spin text-white" />
                      ) : room.isActive === false ? (
                        <Eye size={18} className="text-white" />
                      ) : (
                        <EyeOff size={18} className="text-white" />
                      )}
                      <span className="text-white">
                        {room.isActive === false ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={updatingId === room.id}
                    onClick={() => deleteRoom(room)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-4 text-sm font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={18} className="text-red-700" />
                    <span className="text-red-700">ลบห้องพัก</span>
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

      </section>

      {openForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl sm:rounded-[2.5rem]">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-emerald-600">
                    {form.id ? "Edit Room" : "Create Room"}
                  </p>
                  <h2 className="mt-1 text-3xl font-black text-slate-950">
                    {form.id ? "แก้ไขห้องพัก" : "เพิ่มห้องพักใหม่"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    ชื่อห้องพัก <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="เช่น Deluxe Room"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    รูปภาพ URL
                  </label>
                  <input
                    value={form.imageUrl}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        imageUrl: event.target.value,
                      }))
                    }
                    placeholder="/images/deluxe.jpg"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  รายละเอียดห้องพัก
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="รายละเอียด เช่น ห้องพักวิวสวน สำหรับ 2 ท่าน"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    ราคาต่อคืน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.pricePerNight}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        pricePerNight: event.target.value,
                      }))
                    }
                    placeholder="1200"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    พักได้กี่คน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        capacity: event.target.value,
                      }))
                    }
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    จำนวนห้อง <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.totalRooms}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        totalRooms: event.target.value,
                      }))
                    }
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    ห้องที่ล็อกไว้
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.reservedRooms}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        reservedRooms: event.target.value,
                      }))
                    }
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    เช่น ลูกค้ารายเดือน 6 ห้อง
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div>
                  <p className="font-black text-slate-950">เปิดใช้งานห้องพัก</p>
                  <p className="mt-1 text-sm text-slate-500">
                    ถ้าเปิดใช้งาน ลูกค้าจะเห็นห้องนี้ในหน้าเว็บ
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-emerald-600"
                />
              </label>

              {form.imageUrl && (
                <div className="overflow-hidden rounded-[2rem] bg-slate-200">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="h-64 w-full object-cover"
                  />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-200"
                >
                  <XCircle size={18} className="text-slate-700" />
                  <span className="text-slate-700">ยกเลิก</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <Save size={20} className="text-white" />
                  )}
                  <span className="text-white">
                    {form.id ? "บันทึกการแก้ไข" : "เพิ่มห้องพัก"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
