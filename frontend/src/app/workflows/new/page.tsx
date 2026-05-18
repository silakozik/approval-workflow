"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { workflowApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User, ProcessType, StepType, ParallelRule } from "@/types";

interface ApproverForm {
  user_id: number;
  approval_limit: string;
}

interface StepForm {
  step_order: number;
  step_type: StepType;
  parallel_rule: ParallelRule | null;
  approvers: ApproverForm[];
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const { isAuthenticated, initAuth } = useAuthStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [processType, setProcessType] = useState<ProcessType>("PURCHASE_REQUEST");
  const [steps, setSteps] = useState<StepForm[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUsers();
  }, [isAuthenticated]);

  const fetchUsers = async () => {
    try {
      const response = await workflowApi.getApprovers();
      setUsers(response.data);
    } catch (err) {
      setError("Kullanıcılar yüklenemedi");
    }
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        step_order: steps.length + 1,
        step_type: "SERIAL",
        parallel_rule: null,
        approvers: [],
      },
    ]);
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      step_order: i + 1,
    }));
    setSteps(updated);
  };

  const updateStep = (index: number, field: keyof StepForm, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    // SERIAL seçilince parallel_rule'u temizle
    if (field === "step_type" && value === "SERIAL") {
      updated[index].parallel_rule = null;
    }
    setSteps(updated);
  };

  const addApprover = (stepIndex: number) => {
    const updated = [...steps];
    updated[stepIndex].approvers.push({ user_id: 0, approval_limit: "" });
    setSteps(updated);
  };

  const removeApprover = (stepIndex: number, approverIndex: number) => {
    const updated = [...steps];
    updated[stepIndex].approvers = updated[stepIndex].approvers.filter(
      (_, i) => i !== approverIndex
    );
    setSteps(updated);
  };

  const updateApprover = (
    stepIndex: number,
    approverIndex: number,
    field: keyof ApproverForm,
    value: any
  ) => {
    const updated = [...steps];
    updated[stepIndex].approvers[approverIndex] = {
      ...updated[stepIndex].approvers[approverIndex],
      [field]: value,
    };
    setSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (steps.length === 0) {
      setError("En az bir adım eklemelisiniz");
      return;
    }

    for (const step of steps) {
      if (step.approvers.length === 0) {
        setError(`Adım ${step.step_order} için en az bir onaycı seçmelisiniz`);
        return;
      }
      if (step.step_type === "PARALLEL" && !step.parallel_rule) {
        setError(`Adım ${step.step_order} için ALL veya ANY seçmelisiniz`);
        return;
      }
    }

    setLoading(true);
    try {
      await workflowApi.create({
        name,
        description,
        process_type: processType,
        steps: steps.map((s) => ({
          step_order: s.step_order,
          step_type: s.step_type,
          parallel_rule: s.parallel_rule,
          approvers: s.approvers.map((a) => ({
            user_id: Number(a.user_id),
            approval_limit: a.approval_limit ? Number(a.approval_limit) : null,
          })),
        })),
      });
      router.push("/workflows");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Workflow oluşturulurken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Yeni Workflow Oluştur
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="font-semibold text-gray-700">Temel Bilgiler</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workflow Adı
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Satınalma Onay Akışı"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Opsiyonel açıklama"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Süreç Tipi
              </label>
              <select
                value={processType}
                onChange={(e) => setProcessType(e.target.value as ProcessType)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PURCHASE_REQUEST">Satınalma Talebi</option>
                <option value="SUPPLIER_APPROVAL">Tedarikçi Onayı</option>
                <option value="CONTRACT_APPROVAL">Sözleşme Onayı</option>
                <option value="ORDER_APPROVAL">Sipariş Onayı</option>
              </select>
            </div>
          </div>

          {/* Adımlar */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Onay Adımları</h3>
              <button
                type="button"
                onClick={addStep}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                + Adım Ekle
              </button>
            </div>

            {steps.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">
                Henüz adım eklenmedi. "Adım Ekle" butonuna tıklayın.
              </p>
            )}

            {steps.map((step, stepIndex) => (
              <div
                key={stepIndex}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-700">
                    Adım {step.step_order}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeStep(stepIndex)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Sil
                  </button>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">
                      Adım Tipi
                    </label>
                    <select
                      value={step.step_type}
                      onChange={(e) =>
                        updateStep(stepIndex, "step_type", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="SERIAL">Serial (Sıralı)</option>
                      <option value="PARALLEL">Parallel (Paralel)</option>
                    </select>
                  </div>

                  {step.step_type === "PARALLEL" && (
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">
                        Onay Kuralı
                      </label>
                      <select
                        value={step.parallel_rule || ""}
                        onChange={(e) =>
                          updateStep(stepIndex, "parallel_rule", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="">Seçin</option>
                        <option value="ALL">ALL (Hepsi onaylamalı)</option>
                        <option value="ANY">ANY (Biri onaylarsa yeter)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Onaycılar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-600">Onaycılar</label>
                    <button
                      type="button"
                      onClick={() => addApprover(stepIndex)}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      + Onaycı Ekle
                    </button>
                  </div>

                  {step.approvers.map((approver, approverIndex) => (
                    <div key={approverIndex} className="flex gap-2 items-center">
                      <select
                        value={approver.user_id}
                        onChange={(e) =>
                          updateApprover(
                            stepIndex,
                            approverIndex,
                            "user_id",
                            e.target.value
                          )
                        }
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value={0}>Kullanıcı Seçin</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name} ({user.approval_limit ? `${user.approval_limit} TL` : "Limitsiz"})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={approver.approval_limit}
                        onChange={(e) =>
                          updateApprover(
                            stepIndex,
                            approverIndex,
                            "approval_limit",
                            e.target.value
                          )
                        }
                        className="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="Limit (TL)"
                      />
                      <button
                        type="button"
                        onClick={() => removeApprover(stepIndex, approverIndex)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Oluşturuluyor..." : "Workflow Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}