"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { workflowApi } from "@/lib/api";
import { Workflow } from "@/types";
import { useAuthStore } from "@/store/authStore";

export default function WorkflowsPage() {
  const router = useRouter();
  const { isAuthenticated, initAuth } = useAuthStore();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchWorkflows();
  }, [isAuthenticated]);

  const fetchWorkflows = async () => {
    try {
      const response = await workflowApi.getAll();
      setWorkflows(response.data);
    } catch (err) {
      setError("Workflow'lar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const processTypeLabel: Record<string, string> = {
    PURCHASE_REQUEST: "Satınalma Talebi",
    SUPPLIER_APPROVAL: "Tedarikçi Onayı",
    CONTRACT_APPROVAL: "Sözleşme Onayı",
    ORDER_APPROVAL: "Sipariş Onayı",
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
          <a href="/requests" className="text-gray-600 hover:text-blue-600">
            Talepler
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
          <h2 className="text-2xl font-bold text-gray-800">Workflow Listesi</h2>
          <button
            onClick={() => router.push("/workflows/new")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + Yeni Workflow
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
        )}

        {workflows.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Henüz workflow oluşturulmamış.</p>
            <button
              onClick={() => router.push("/workflows/new")}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              İlk Workflow'u Oluştur
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
                      {workflow.steps.length} Adım
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/workflows/${workflow.id}`)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Detay →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}