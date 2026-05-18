"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { ApprovalRequest } from "@/types";

export default function RequestsPage() {
  const router = useRouter();
  const { isAuthenticated, initAuth } = useAuthStore();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchRequests();
  }, [isAuthenticated]);

  const fetchRequests = async () => {
    try {
      const response = await requestApi.getMy();
      setRequests(response.data);
    } catch (err) {
      setError("Talepler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const statusLabel: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Bekliyor", color: "bg-yellow-100 text-yellow-700" },
    APPROVED: { label: "Onaylandı", color: "bg-green-100 text-green-700" },
    REJECTED: { label: "Reddedildi", color: "bg-red-100 text-red-700" },
    CANCELLED: { label: "İptal Edildi", color: "bg-gray-100 text-gray-600" },
    REVISED: { label: "Revize Edildi", color: "bg-blue-100 text-blue-700" },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Approval Workflow</h1>
        <div className="flex gap-4">
          <a href="/workflows" className="text-gray-600 hover:text-blue-600">
            Workflows
          </a>
          <a href="/approvals" className="text-gray-600 hover:text-blue-600">
            Onaylarım
          </a>
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              router.push("/login");
            }}
            className="text-red-500 hover:text-red-700"
          >
            Çıkış
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Taleplerim</h2>
          <button
            onClick={() => router.push("/requests/new")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + Yeni Talep
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Henüz talep oluşturulmamış.</p>
            <button
              onClick={() => router.push("/requests/new")}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              İlk Talebi Oluştur
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow p-6 flex justify-between items-center hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/requests/${request.id}`)}
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {request.title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {request.amount.toLocaleString("tr-TR")} TL
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(request.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      statusLabel[request.status]?.color
                    }`}
                  >
                    {statusLabel[request.status]?.label}
                  </span>
                  <span className="text-blue-600 text-sm">Detay →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}