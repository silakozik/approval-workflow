"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types";
import { useThemeStore } from "@/store/themeStore";
import { useLangStore } from "@/store/langStore";

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, initAuth, user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { isDark, toggleTheme, initTheme } = useThemeStore();
  const { t, lang, toggleLang, initLang } = useLangStore();

  useEffect(() => {
    initAuth();
    initTheme();
    initLang();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.role !== "ADMIN") {
      router.push("/workflows");
      return;
    }
    fetchUsers();
  }, [isAuthenticated, user]);

  const fetchUsers = async () => {
    try {
      const response = await authApi.getUsers();
      setUsers(response.data);
    } catch (err) {
      setError(t.usersLoadError);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await authApi.updateUserRole(userId, newRole);
      setSuccessMessage(t.roleUpdated);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
    } catch (err: unknown) {
      const detail =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "detail" in err.response.data
          ? String(err.response.data.detail)
          : t.roleUpdateFailed;
      setError(detail);
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      await authApi.toggleUserActive(userId);
      setSuccessMessage(t.statusUpdated);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
    } catch (err: unknown) {
      const detail =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "detail" in err.response.data
          ? String(err.response.data.detail)
          : t.statusUpdateFailed;
      setError(detail);
    }
  };

  const roleLabel: Record<string, { label: string; color: string }> = {
    ADMIN: { label: t.roleAdmin, color: "bg-red-100 text-red-700" },
    MANAGER: { label: t.roleManager, color: "bg-purple-100 text-purple-700" },
    EMPLOYEE: { label: t.roleEmployee, color: "bg-gray-100 text-gray-600" },
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
          <a href="/approvals" className="text-gray-600 hover:text-blue-600">
            {t.approvals}
          </a>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t.adminPanelTitle}</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
        )}
        {successMessage && (
          <div className="bg-green-50 text-green-600 p-3 rounded mb-4">{successMessage}</div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t.user}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t.email}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t.role}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t.limit}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t.status}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t.operations}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{u.full_name}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleLabel[u.role]?.color}`}>
                      {roleLabel[u.role]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {u.approval_limit ? `${u.approval_limit.toLocaleString(dateLocale)} TL` : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {u.is_active ? t.active : t.passive}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {u.id !== user?.id ? (
                        <>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="EMPLOYEE">{t.roleEmployee}</option>
                            <option value="MANAGER">{t.roleManager}</option>
                            <option value="ADMIN">{t.roleAdmin}</option>
                          </select>
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            className={`text-xs px-2 py-1 rounded ${u.is_active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                          >
                            {u.is_active ? t.makePassive : t.makeActive}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">{t.you}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
