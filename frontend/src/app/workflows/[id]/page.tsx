"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { workflowApi } from "@/lib/api";
import { Workflow, User } from "@/types";
import { useAuthStore } from "@/store/authStore";

export default function WorkflowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workflowId = Number(params.id);

  const { isAuthenticated, initAuth } = useAuthStore();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      if (loading === false) {
        router.push("/login");
      }
      return;
    }
    fetchData();
  }, [isAuthenticated, workflowId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Hem workflow detayını hem de kullanıcıları (isim eşleştirmesi için) paralel çekiyoruz
      const [workflowRes, usersRes] = await Promise.all([
        workflowApi.getById(workflowId),
        workflowApi.getApprovers(),
      ]);
      setWorkflow(workflowRes.data);
      setUsers(usersRes.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Workflow detayı yüklenirken hata oluştu"
      );
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.full_name : `Bilinmeyen Kullanıcı (ID: ${userId})`;
  };

  const processTypeLabel: Record<string, string> = {
    PURCHASE_REQUEST: "Satınalma Talebi",
    SUPPLIER_APPROVAL: "Tedarikçi Onayı",
    CONTRACT_APPROVAL: "Sözleşme Onayı",
    ORDER_APPROVAL: "Sipariş Onayı",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Yükleniyor...</p>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-red-500 mb-4">{error || "Workflow bulunamadı"}</p>
        <button
          onClick={() => router.push("/workflows")}
          className="text-blue-600 hover:underline"
        >
          ← Listeye Dön
        </button>
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
            Workflowlar
          </a>
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

      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push("/workflows")}
          className="text-gray-500 hover:text-gray-800 flex items-center gap-2 mb-6 transition"
        >
          ← Geri Dön
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8 mb-6 border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {workflow.name}
              </h2>
              {workflow.description && (
                <p className="text-gray-600">{workflow.description}</p>
              )}
            </div>
            <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md font-medium text-sm">
              {processTypeLabel[workflow.process_type] || workflow.process_type}
            </span>
          </div>

          <div className="mt-6 flex gap-6 text-sm text-gray-500 border-t pt-4">
            <p>
              <span className="font-medium">Durum:</span>{" "}
              <span className={workflow.is_active !== false ? "text-green-600" : "text-red-600"}>
                {workflow.is_active !== false ? "Aktif" : "Pasif"}
              </span>
            </p>
            <p>
              <span className="font-medium">Toplam Adım:</span> {workflow.steps.length}
            </p>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-4 ml-1">Onay Adımları</h3>

        <div className="space-y-4">
          {workflow.steps
            .sort((a, b) => a.step_order - b.step_order)
            .map((step, index) => (
              <div
                key={step.id || index}
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden"
              >
                {/* Sol Taraf: Adım Numarası ve Tipi */}
                <div className="md:w-1/4 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4 flex flex-col justify-center items-start">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {step.step_order}
                    </div>
                    <h4 className="font-semibold text-gray-800 text-lg">
                      Adım
                    </h4>
                  </div>

                  <div className="mt-2 text-sm">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">
                      {step.step_type === "SERIAL" ? "Sıralı (Serial)" : "Paralel (Parallel)"}
                    </span>
                  </div>

                  {step.step_type === "PARALLEL" && step.parallel_rule && (
                    <div className="mt-2 text-sm text-gray-500">
                      Kural: <span className="font-medium text-gray-700">{step.parallel_rule === "ALL" ? "Herkes Onaylamalı" : "1 Kişi Yeterli"}</span>
                    </div>
                  )}
                </div>

                {/* Sağ Taraf: Onaycılar */}
                <div className="md:w-3/4">
                  <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Onaycılar
                  </h5>
                  {step.approvers && step.approvers.length > 0 ? (
                    <div className="grid gap-3">
                      {step.approvers.map((approver, aIdx) => (
                        <div
                          key={approver.id || aIdx}
                          className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-md px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                              {getUserName(approver.user_id).charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800">
                              {getUserName(approver.user_id)}
                            </span>
                          </div>

                          {approver.approval_limit !== null && approver.approval_limit !== undefined && (
                            <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded">
                              Limit: {approver.approval_limit} TL
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      Bu adımda onaycı bulunmuyor.
                    </p>
                  )}
                </div>
              </div>
            ))}

          {workflow.steps.length === 0 && (
            <div className="text-center p-8 bg-white rounded-lg border border-gray-100">
              <p className="text-gray-500">Bu iş akışına henüz adım eklenmemiş.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
