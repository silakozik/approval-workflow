"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { workflowApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Workflow } from "@/types";

export default function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, initAuth } = useAuthStore();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchWorkflow();
  }, [isAuthenticated]);

  const fetchWorkflow = async () => {
    try {
      const response = await workflowApi.getById(Number(params.id));
      setWorkflow(response.data);
    } catch (err) {
      setError("Workflow yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bu workflow'u silmek istediğinize emin misiniz?")) return;
    try {
      await workflowApi.delete(Number(params.id));
      router.push("/workflows");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Silme işlemi başarısız");
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

  if (!workflow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Workflow bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Approval Workflow</h1>
        <button
          onClick={() => router.push("/workflows")}
          className="text-gray-600 hover:text-blue-600"
        >
          ← Geri
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Workflow Bilgileri */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {workflow.name}
              </h2>
              {workflow.description && (
                <p className="text-gray-500 mt-2">{workflow.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                {processTypeLabel[workflow.process_type]}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {workflow.steps.length} Adım
            </p>
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Workflow'u Sil
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
        )}

        {/* Adımlar */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Onay Adımları</h3>

          {workflow.steps.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">
              Bu workflow'da henüz adım yok.
            </p>
          ) : (
            <div className="space-y-4">
              {workflow.steps.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  {/* Sol numara */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                      {step.step_order}
                    </div>
                    {index < workflow.steps.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-1" />
                    )}
                  </div>

                  {/* Sağ içerik */}
                  <div className="flex-1 pb-4">
                    <div className="flex gap-2 items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Adım {step.step_order}
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                        {step.step_type === "SERIAL" ? "Sıralı" : "Paralel"}
                      </span>
                      {step.parallel_rule && (
                        <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded">
                          {step.parallel_rule === "ALL"
                            ? "Hepsi Onaylamalı"
                            : "Biri Onaylarsa Yeter"}
                        </span>
                      )}
                    </div>

                    {/* Onaycılar */}
                    <div className="space-y-1">
                      {step.approvers.map((approver) => (
                        <div
                          key={approver.id}
                          className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded text-sm"
                        >
                          <span className="text-gray-700">
                            Kullanıcı #{approver.user_id}
                          </span>
                          {approver.approval_limit && (
                            <span className="text-gray-400 text-xs">
                              Limit: {approver.approval_limit.toLocaleString("tr-TR")} TL
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}