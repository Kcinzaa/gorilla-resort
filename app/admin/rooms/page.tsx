"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BedDouble,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
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

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<RoomForm>(emptyForm);

  const activeRooms = useMemo(() => rooms.filter((r) => r.isActive !== false), [rooms]);
  const inactiveRooms = useMemo(() => rooms.filter((r) => r.isActive === false), [rooms]);
  const totalRoomCount = useMemo(() => activeRooms.reduce((sum, r) => sum + (r.totalRooms ?? 1), 0), [activeRooms]);
  const minPrice = useMemo(() => {
    if (activeRooms.length === 0) return 0;
    return Math.min(...activeRooms.map((r) => r.pricePerNight));
  }, [activeRooms]);

  const filteredRooms = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && room.isActive !== false) ||
        (statusFilter === "INACTIVE" && room.isActive === false);
      const text = [room.name, room.description, room.pricePerNight, room.capacity, room.totalRooms, room.imageUrl, room.isActive ? "active" : "inactive"]
        .filter(Boolean).join(" ").toLowerCase();
      const matchSearch = !search || text.includes(search);
      return matchStatus && matchSearch;
    });
  }, [rooms, keyword, statusFilter]);

  async function fetchRooms() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/rooms", { method: "GET", cache: "no-store", credentials: "include" });
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
    if (!form.name.trim()) return "กรุณากรอกชื่อห้องพัก";
    if (!form.pricePerNight || Number(form.pricePerNight) <= 0) return "กรุณากรอกราคาต่อคืนให้ถูกต้อง";
    if (!form.capacity || Number(form.capacity) <= 0) return "กรุณากรอกจำนวนผู้เข้าพักให้ถูกต้อง";
    if (!form.totalRooms || Number(form.totalRooms) <= 0) return "กรุณากรอกจำนวนห้องให้ถูกต้อง";
    if (Number(form.reservedRooms || 0) < 0) return "จำนวนห้องที่ล็อกไว้ต้องไม่ติดลบ";
    if (Number(form.reservedRooms || 0) > Number(form.totalRooms)) return "จำนวนห้องที่ล็อกไว้ต้องไม่มากกว่าจำนวนห้องทั้งหมด";
    return "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
        prev.map((item) => item.id === room.id ? { ...item, isActive: room.isActive === false } : item),
      );
      setSuccess(room.isActive === false ? "เปิดใช้งานห้องพักแล้ว" : "ปิดใช้งานห้องพักแล้ว");
    } catch (err) {
      console.warn(err);
      setError("เกิดข้อผิดพลาดในการอัปเดตสถานะห้องพัก");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteRoom(room: RoomItem) {
    const confirmed = window.confirm(`ต้องการลบ "${room.name}" จริงหรือไม่?\nถ้าห้องนี้มีรายการจองอยู่ อาจลบไม่ได้ แนะนำให้ปิดใช้งานแทน`);
    if (!confirmed) return;

    try {
      setUpdatingId(room.id);
      setError("");
      setSuccess("");

      const params = new URLSearchParams({ id: String(room.id) });
      const response = await fetch(`/api/admin/rooms?${params.toString()}`, { method: "DELETE", credentials: "include" });
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

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Stat + Add button row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100">
            <BedDouble size={22} className="text-emerald-600" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-500">ประเภทที่เปิดใช้</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{activeRooms.length}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100">
            <Users size={22} className="text-blue-600" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-500">จำนวนห้องรวม</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{totalRoomCount}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
            <Wallet size={22} className="text-amber-600" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-500">ราคาเริ่มต้น</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{minPrice > 0 ? formatCurrency(minPrice) : "-"}</p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="flex min-h-32 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 sm:col-span-2 xl:col-span-1 xl:min-h-0"
        >
          <Plus size={20} />
          เพิ่มห้องพักใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ค้นหาชื่อห้อง, รายละเอียด, ราคา..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="ACTIVE">เปิดใช้งาน</option>
            <option value="INACTIVE">ปิดใช้งาน</option>
          </select>

          <button
            type="button"
            onClick={fetchRooms}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-700"
          >
            <RefreshCcw size={16} />
            โหลดใหม่
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <Plus size={16} />
            เพิ่มห้อง
          </button>
        </div>
      </div>

      {/* Notifications */}
      {(error || success) && (
        <div className={["mt-5 flex items-start gap-4 rounded-2xl border p-5", error ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"].join(" ")}>
          <div className={["flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", error ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"].join(" ")}>
            {error ? <AlertCircle size={22} /> : <CheckCircle2 size={22} />}
          </div>
          <div>
            <p className={["font-black", error ? "text-red-700" : "text-emerald-700"].join(" ")}>
              {error ? "เกิดข้อผิดพลาด" : "สำเร็จ"}
            </p>
            <p className={["mt-1 text-sm", error ? "text-red-600" : "text-emerald-700"].join(" ")}>
              {error || success}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <Loader2 size={36} className="animate-spin text-emerald-600" />
          <p className="mt-4 font-bold text-slate-600">กำลังโหลดรายการห้องพัก...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filteredRooms.length === 0 && (
        <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <BedDouble size={40} className="text-slate-300" />
          <p className="mt-4 font-black text-slate-700">ไม่พบห้องพัก</p>
          <p className="mt-1 text-sm text-slate-500">ยังไม่มีห้องพัก หรือไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา</p>
          <button type="button" onClick={openCreateForm} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700">
            <Plus size={16} />
            เพิ่มห้องพักแรก
          </button>
        </div>
      )}

      {/* Room cards */}
      {!loading && filteredRooms.length > 0 && (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map((room) => (
            <article
              key={room.id}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden bg-slate-200">
                {room.imageUrl ? (
                  <img src={room.imageUrl} alt={room.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <ImageIcon size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                <div className={["absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black shadow-sm ring-1", room.isActive === false ? "bg-red-50 text-red-700 ring-red-100" : "bg-emerald-50 text-emerald-700 ring-emerald-100"].join(" ")}>
                  {room.isActive === false ? <EyeOff size={14} /> : <Eye size={14} />}
                  {room.isActive === false ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-2xl font-black text-white">{room.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-200">{room.description || "ยังไม่มีรายละเอียดห้องพัก"}</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Users size={14} />
                      <p className="text-xs font-bold">พักได้</p>
                    </div>
                    <p className="mt-1.5 font-black text-slate-900">{room.capacity} คน</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <BedDouble size={14} />
                      <p className="text-xs font-bold">ทั้งหมด</p>
                    </div>
                    <p className="mt-1.5 font-black text-slate-900">{room.totalRooms ?? 1} ห้อง</p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-2.5 ring-1 ring-amber-100">
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <ShieldCheck size={14} />
                      <p className="text-xs font-bold">ล็อกไว้</p>
                    </div>
                    <p className="mt-1.5 font-black text-amber-700">{room.reservedRooms ?? 0} ห้อง</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Wallet size={14} />
                      <p className="text-xs font-bold">ราคา</p>
                    </div>
                    <p className="mt-1.5 font-black text-slate-900">{formatCurrency(room.pricePerNight)}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(room)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-700"
                  >
                    <Edit3 size={16} />
                    แก้ไข
                  </button>

                  <button
                    type="button"
                    disabled={updatingId === room.id}
                    onClick={() => toggleActive(room)}
                    className={["inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50", room.isActive === false ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-500 hover:bg-amber-600"].join(" ")}
                  >
                    {updatingId === room.id ? <Loader2 size={16} className="animate-spin" /> : room.isActive === false ? <Eye size={16} /> : <EyeOff size={16} />}
                    {room.isActive === false ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </button>
                </div>

                <button
                  type="button"
                  disabled={updatingId === room.id}
                  onClick={() => deleteRoom(room)}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  ลบห้องพัก
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {openForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 p-5 backdrop-blur-xl">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-600">
                  {form.id ? "Edit Room" : "Create Room"}
                </p>
                <h2 className="mt-0.5 text-2xl font-black text-slate-900">
                  {form.id ? "แก้ไขห้องพัก" : "เพิ่มห้องพักใหม่"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSubmit} className="grid gap-5 p-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    ชื่อห้องพัก <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="เช่น Deluxe Room"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">รูปภาพ URL</label>
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="/images/deluxe.jpg"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">รายละเอียดห้องพัก</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="รายละเอียด เช่น ห้องพักวิวสวน สำหรับ 2 ท่าน"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
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
                    onChange={(e) => setForm((prev) => ({ ...prev, pricePerNight: e.target.value }))}
                    placeholder="1200"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
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
                    onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
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
                    onChange={(e) => setForm((prev) => ({ ...prev, totalRooms: e.target.value }))}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">ห้องที่ล็อกไว้</label>
                  <input
                    type="number"
                    min="0"
                    value={form.reservedRooms}
                    onChange={(e) => setForm((prev) => ({ ...prev, reservedRooms: e.target.value }))}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                  />
                  <p className="mt-1 text-xs text-slate-500">เช่น ลูกค้ารายเดือน 6 ห้อง</p>
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div>
                  <p className="font-black text-slate-900">เปิดใช้งานห้องพัก</p>
                  <p className="mt-0.5 text-sm text-slate-500">ถ้าเปิดใช้งาน ลูกค้าจะเห็นห้องนี้ในหน้าเว็บ</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-5 w-5 accent-emerald-600"
                />
              </label>

              {/* Image preview */}
              {form.imageUrl && (
                <div className="overflow-hidden rounded-xl bg-slate-200">
                  <img src={form.imageUrl} alt="Preview" className="h-48 w-full object-cover" />
                </div>
              )}

              {/* Form error */}
              {error && (
                <div className="flex items-center gap-3 rounded-xl bg-red-50 p-3 ring-1 ring-red-100">
                  <AlertCircle size={18} className="text-red-600" />
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-black text-slate-700 transition hover:bg-slate-200"
                >
                  <XCircle size={17} />
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {form.id ? "บันทึกการแก้ไข" : "เพิ่มห้องพัก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
