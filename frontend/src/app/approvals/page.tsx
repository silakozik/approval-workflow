"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { ApprovalRequest } from "@/types";
import { useThemeStore } from "@/store/themeStore";
import { useLangStore } from "@/store/langStore";

export default function ApprovalsPage() {
  const router = useRouter();
  const { isAuthenticated, initAuth, user } = useAuthStore();
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
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
    fetchPendingApprovals();
  }, [isAuthenticated]);

  const fetchPendingApprovals = async () => {
    try {
      const response = await requestApi.getAll();
      const pending = response.data.filter(
        (req: ApprovalRequest) => req.status === "PENDING"
      );
      setPendingRequests(pending);
    } catch (err) {
      setError(t.approvalsLoadError);
    } finally {
      setLoading(false);
    }
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
          <a href="/requests" className="text-gray-600 hover:text-blue-600">
            {t.requests}
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
          <h2 className="text-2xl font-bold text-gray-800">
            {t.pendingApprovals}
          </h2>
          <span className="bg-yellow-100 text-yellow-700 text-sm px-3 py-1 rounded-full">
            {pendingRequests.length} {t.pendingBadge}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
        )}

        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">{t.noPendingApprovals}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow p-6 flex justify-between items-center hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/requests/${request.id}`)}
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {request.title}
                  </h3>
                  {request.description && (
                    <p className="text-gray-500 text-sm mt-1">
                      {request.description}
                    </p>
                  )}
                  <div className="flex gap-3 mt-2">
                    <span className="text-gray-600 text-sm">
                      {request.amount.toLocaleString(dateLocale)} TL
                    </span>
                    <span className="text-gray-400 text-sm">
                      {t.stepLabel} {request.current_step_order}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {new Date(request.created_at).toLocaleDateString(dateLocale)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-medium">
                    {t.awaitingApproval}
                  </span>
                  <span className="text-blue-600 text-sm">{t.approveAction}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
