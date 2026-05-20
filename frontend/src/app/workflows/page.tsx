"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { workflowApi } from "@/lib/api";
import { Workflow } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useLangStore } from "@/store/langStore";

export default function WorkflowsPage() {
  const router = useRouter();
  const { isAuthenticated, initAuth, user } = useAuthStore();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
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
    fetchWorkflows();
  }, [isAuthenticated]);

  const fetchWorkflows = async () => {
    try {
      const response = await workflowApi.getAll();
      setWorkflows(response.data);
    } catch (err) {
      setError(t.workflowsLoadError);
    } finally {
      setLoading(false);
    }
  };

  const processTypeLabel: Record<string, string> = {
    PURCHASE_REQUEST: t.purchaseRequest,
    SUPPLIER_APPROVAL: t.supplierApproval,
    CONTRACT_APPROVAL: t.contractApproval,
    ORDER_APPROVAL: t.orderApproval,
  };

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
          <a href="/requests" className="text-gray-600 hover:text-blue-600">
            {t.requests}
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
          <h2 className="text-2xl font-bold text-gray-800">{t.workflowList}</h2>
          {user?.role === "ADMIN" && (
            <button
              onClick={() => router.push("/workflows/new")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {t.newWorkflow}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
        )}

        {workflows.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">{t.noWorkflow}</p>
            <button
              onClick={() => router.push("/workflows/new")}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {t.createFirstWorkflow}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-white rounded-lg shadow p-6 flex justify-between items-center hover:shadow-md transition"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {workflow.name}
                  </h3>
                  {workflow.description && (
                    <p className="text-gray-500 text-sm mt-1">
                      {workflow.description}
                    </p>
                  )}
                  <div className="flex gap-3 mt-2">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                      {processTypeLabel[workflow.process_type]}
                    </span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      {workflow.steps.length} {t.stepCount}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/workflows/${workflow.id}`)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {t.detail}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
