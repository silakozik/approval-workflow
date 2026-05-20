"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types";
import { useThemeStore } from "@/store/themeStore";

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, initAuth, user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { isDark, toggleTheme, initTheme } = useThemeStore();

  useEffect(() => {
    initAuth();
    initTheme();
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
      setError("Kullanıcılar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await authApi.updateUserRole(userId, newRole);
      setSuccessMessage("Rol güncellendi!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Rol güncellenemedi");
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      await authApi.toggleUserActive(userId);
      setSuccessMessage("Kullanıcı durumu güncellendi!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Durum güncellenemedi");
    }
  };

  const roleLabel: Record<string, { label: string; color: string }> = {
    ADMIN: { label: "Admin", color: "bg-red-100 text-red-700" },
    MANAGER: { label: "Manager", color: "bg-purple-100 text-purple-700" },
    EMPLOYEE: { label: "Employee", color: "bg-gray-100 text-gray-600" },
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
            Workflow'lar
          </a>
          <a href="/requests" className="text-gray-600 hover:text-blue-600">
            Talepler
          </a>
          <button
            onClick={toggleTheme}
            className="text-gray-600 hover:text-gray-800"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Paneli</h2>

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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Limit</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">İşlemler</th>
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
                    {u.approval_limit ? `${u.approval_limit.toLocaleString("tr-TR")} TL` : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {u.is_active ? "Aktif" : "Pasif"}
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
                            <option value="EMPLOYEE">Employee</option>
                            <option value="MANAGER">Manager</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            className={`text-xs px-2 py-1 rounded ${u.is_active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                          >
                            {u.is_active ? "Pasif Yap" : "Aktif Yap"}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Sen</span>
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