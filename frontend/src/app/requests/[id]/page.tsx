"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { requestApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { ApprovalRequest, ApprovalAction } from "@/types";

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, initAuth, user } = useAuthStore();

  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [actions, setActions] = useState<ApprovalAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchRequest();
  }, [isAuthenticated]);

  const fetchRequest = async () => {
    try {
      const [reqRes, actionsRes] = await Promise.all([
        requestApi.getById(Number(params.id)),
        requestApi.getActions(Number(params.id)),
      ]);
      setRequest(reqRes.data);
      setActions(actionsRes.data);
    } catch (err) {
      setError("Talep yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await requestApi.approve(Number(params.id), comment);
      await fetchRequest();
      setComment("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Onay işlemi başarısız");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment) {
      setError("Red açıklaması zorunludur");
      return;
    }
    setActionLoading(true);
    try {
      await requestApi.reject(Number(params.id), rejectComment);
      await fetchRequest();
      setRejectComment("");
      setShowRejectForm(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Red işlemi başarısız");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Talebi iptal etmek istediğinize emin misiniz?")) return;
    setActionLoading(true);
    try {
      await requestApi.cancel(Number(params.id));
      await fetchRequest();
    } catch (err: any) {
      setError(err.response?.data?.detail || "İptal işlemi başarısız");
    } finally {
      setActionLoading(false);
    }
  };

  const statusLabel: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Bekliyor", color: "bg-yellow-100 text-yellow-700" },
    APPROVED: { label: "Onaylandı", color: "bg-green-100 text-green-700" },
    REJECTED: { label: "Reddedildi", color: "bg-red-100 text-red-700" },
    CANCELLED: { label: "İptal Edildi", color: "bg-gray-100 text-gray-600" },
    REVISED: { label: "Revize Edildi", color: "bg-blue-100 text-blue-700" },
  };

  const actionLabel: Record<string, { label: string; color: string; icon: string }> = {
    APPROVED: { label: "Onaylandı", color: "text-green-600", icon: "✓" },
    REJECTED: { label: "Reddedildi", color: "text-red-600", icon: "✕" },
    CANCELLED: { label: "İptal Edildi", color: "text-gray-500", icon: "⊘" },
    AUTO_APPROVED: { label: "Otomatik Onaylandı", color: "text-blue-600", icon: "⚡" },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Yükleniyor...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Talep bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Approval Workflow</h1>
        <button
          onClick={() => router.push("/requests")}
          className="text-gray-600 hover:text-blue-600"
        >
          ← Geri
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Talep Bilgileri */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {request.title}
              </h2>
              {request.description && (
                <p className="text-gray-500 mt-2">{request.description}</p>
              )}
            </div>
            <span
              className={`text-sm px-3 py-1 rounded-full font-medium ${
                statusLabel[request.status]?.color
              }`}
            >
              {statusLabel[request.status]?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-400">Tutar</p>
              <p className="font-semibold text-gray-800">
                {request.amount.toLocaleString("tr-TR")} TL
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Mevcut Adım</p>
              <p className="font-semibold text-gray-800">
                {request.current_step_order
                  ? `Adım ${request.current_step_order}`
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Oluşturulma Tarihi</p>
              <p className="font-semibold text-gray-800">
                {new Date(request.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Workflow ID</p>
              <p className="font-semibold text-gray-800">#{request.workflow_id}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {actions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Onay Geçmişi</h3>
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div key={action.id} className="flex gap-4">
                  {/* Sol çizgi */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        action.action === "APPROVED" || action.action === "AUTO_APPROVED"
                          ? "bg-green-100 text-green-600"
                          : action.action === "REJECTED"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {actionLabel[action.action]?.icon}
                    </div>
                    {index < actions.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-1" />
                    )}
                  </div>

                  {/* Sağ içerik */}
                  <div className="flex-1 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`font-medium text-sm ${
                            actionLabel[action.action]?.color
                          }`}
                        >
                          {actionLabel[action.action]?.label}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Adım {action.step_id} • Kullanıcı #{action.user_id}
                        </p>
                        {action.comment && (
                          <p className="text-sm text-gray-600 mt-1 bg-gray-50 px-3 py-2 rounded">
                            "{action.comment}"
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(action.created_at).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
        )}

        {/* Aksiyon Butonları */}
        {request.status === "PENDING" && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="font-semibold text-gray-700">İşlemler</h3>

            <div className="space-y-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Onay açıklaması (opsiyonel)"
              />
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                ✓ Onayla
              </button>
            </div>

            {!showRejectForm ? (
              <button
                onClick={() => setShowRejectForm(true)}
                className="w-full bg-red-50 text-red-600 py-2 rounded-md hover:bg-red-100 border border-red-200"
              >
                ✕ Reddet
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  className="w-full border border-red-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Red açıklaması (zorunlu)"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Reddi Onayla
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-md hover:bg-gray-200"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="w-full bg-gray-100 text-gray-600 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              İptal Et
            </button>
          </div>
        )}

        {/* Revize */}
        {request.status === "REJECTED" && request.created_by === user?.id && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-3">Revize Et</h3>
            <button
              onClick={() => router.push(`/requests/${request.id}/revise`)}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Talebi Düzenle ve Tekrar Gönder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}