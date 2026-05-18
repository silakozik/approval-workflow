"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestApi, workflowApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Workflow } from "@/types";

export default function NewRequestPage() {
    const router = useRouter();
    const { isAuthenticated, initAuth } = useAuthStore();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [workflowId, setWorkflowId] = useState<number>(0);
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        initAuth();
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
            setError("Workflow'lar yüklenemedi");
        }
    };

    const processTypeLabel: Record<string, string> = {
        PURCHASE_REQUEST: "Satınalma Talebi",
        SUPPLIER_APPROVAL: "Tedarikçi Onayı",
        CONTRACT_APPROVAL: "Sözleşme Onayı",
        ORDER_APPROVAL: "Sipariş Onayı",
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!workflowId) {
            setError("Lütfen bir workflow seçin");
            return;
        }

        setLoading(true);
        try {
            await requestApi.create({
                title,
                description,
                amount: Number(amount),
                workflow_id: workflowId,
            });
            router.push("/requests");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Talep oluşturulurken hata oluştu");
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
                    onClick={() => router.push("/requests")}
                    className="text-gray-600 hover:text-blue-600"
                >
                    ← Geri
                </button>
            </nav>

            <div className="max-w-2xl mx-auto px-6 py-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Yeni Talep Oluştur
                </h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Başlık
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Laptop Satınalma Talebi"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Açıklama
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Talep açıklaması..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tutar (TL)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="50000"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Onay Akışı
                        </label>
                        <select
                            value={workflowId}
                            onChange={(e) => setWorkflowId(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value={0}>Workflow Seçin</option>
                            {workflows.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name} — {processTypeLabel[w.process_type]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                        {loading ? "Oluşturuluyor..." : "Talep Oluştur"}
                    </button>
                </form>
            </div>
        </div>
    );
}