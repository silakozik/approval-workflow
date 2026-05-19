"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { requestApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function ReviseRequestPage() {
    const router = useRouter();
    const params = useParams();
    const { isAuthenticated, initAuth } = useAuthStore();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [workflowId, setWorkflowId] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        initAuth();
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetchRequest();
    }, [isAuthenticated]);

    const fetchRequest = async () => {
        try {
            const response = await requestApi.getById(Number(params.id));
            const req = response.data;
            if (req.status !== "REJECTED") {
                router.push(`/requests/${req.id}`);
                return;
            }
            setTitle(req.title);
            setDescription(req.description || "");
            setAmount(req.amount.toString());
            setWorkflowId(req.workflow_id);
        } catch (err) {
            setError("Talep yüklenemedi");
        } finally {
            setPageLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        setLoading(true);
        try {
            await requestApi.revise(Number(params.id), {
                title,
                description,
                amount: Number(amount),
                workflow_id: workflowId,
            });
            router.push(`/requests/${params.id}`);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Talep revize edilirken hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Approval Workflow</h1>
                <button
                    onClick={() => router.push(`/requests/${params.id}`)}
                    className="text-gray-600 hover:text-blue-600"
                >
                    ← Geri
                </button>
            </nav>

            <div className="max-w-2xl mx-auto px-6 py-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Talebi Revize Et
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
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                        {loading ? "Kaydediliyor..." : "Revize Edip Tekrar Gönder"}
                    </button>
                </form>
            </div>
        </div>
    );
}
