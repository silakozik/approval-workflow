"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { ApprovalRequest } from "@/types";
import { useThemeStore } from "@/store/themeStore";
import { useLangStore } from "@/store/langStore";

export default function RequestsPage() {
  const router = useRouter();
  const { isAuthenticated, initAuth, user } = useAuthStore();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isDark, toggleTheme, initTheme } = useThemeStore();
  const { t, lang, toggleLang, initLang } = useLangStore();

  useEffect(() => {
    initAuth();
    initTheme();
    initLang();
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
      setError(t.requestsLoadError);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel: Record<string, { label: string; color: string }> = {
    PENDING: { label: t.pending, color: "bg-yellow-100 text-yellow-700" },
    APPROVED: { label: t.approved, color: "bg-green-100 text-green-700" },
    REJECTED: { label: t.rejected, color: "bg-red-100 text-red-700" },
    CANCELLED: { label: t.cancelled, color: "bg-gray-100 text-gray-600" },
    REVISED: { label: t.revised, color: "bg-blue-100 text-blue-700" },
  };

  const dateLocale = lang === "tr" ? "tr-TR" : "en-US";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">{t.appName}</h1>
        <div className="flex gap-4">
          <a href="/workflows" className="text-gray-600 hover:text-blue-600">
            {t.workflows}
          </a>
          <a href="/approvals" className="text-gray-600 hover:text-blue-600">
            {t.approvals}
          </a>
          {user?.role === "ADMIN" && (
            <a href="/admin" className="text-purple-600 hover:text-purple-800 font-medium">
              {t.adminPanel}
            </a>
          )}
          <button
            onClick={toggleTheme}
            className="text-gray-600 hover:text-gray-800"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          <button
            onClick={toggleLang}
            className="text-gray-600 hover:text-gray-800"
          >
            {lang === "tr" ? "EN" : "TR"}
          </button>
          <button
            onClick={() => {
              useAuthStore.getState().logout();
              router.push("/login");
            }}
            className="text-red-500 hover:text-red-700"
          >
            {t.logout}
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{t.myRequests}</h2>
          <button
            onClick={() => router.push("/requests/new")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {t.newRequest}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">{t.noRequest}</p>
            <button
              onClick={() => router.push("/requests/new")}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {t.createFirstRequest}
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
                    {request.amount.toLocaleString(dateLocale)} TL
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(request.created_at).toLocaleDateString(dateLocale)}
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
                  <span className="text-blue-600 text-sm">{t.detail}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
