"use client";

import { useEffect, useState } from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { clsx } from 'clsx';
import { supabase } from '@/utils/supabase';
import { Trash2, Edit2, Check, X, RefreshCcw } from 'lucide-react';

interface Document {
    id: number;
    car_info: string;
    doc_type: string;
    expiry_date: string;
    alert_email: string;
    alert_30_days: boolean;
    alert_7_days: boolean;
    alert_1_day: boolean;
    created_at: string;
}

export default function DashboardTable() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Document>>({});
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fetchDocuments = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const res = await fetch('/api/documents');
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setDocuments(data || []);
        } catch (err: any) {
            setErrorMsg(`Eroare de conexiune (API): ${err.message || 'Necunoscută'}`);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDocuments();
        const interval = setInterval(fetchDocuments, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Sigur vrei să ștergi acest document?')) return;

        try {
            const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error((await res.json()).error);
            fetchDocuments();
        } catch (err: any) {
            alert('Eroare la ștergere: ' + err.message);
        }
    };

    const startEdit = (doc: Document) => {
        setEditingId(doc.id);
        setEditForm(doc);
    };

    const saveEdit = async () => {
        if (!editingId) return;

        try {
            const res = await fetch('/api/documents', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (!res.ok) throw new Error((await res.json()).error);
            setEditingId(null);
            fetchDocuments();
        } catch (err: any) {
            alert('Eroare la actualizare: ' + err.message);
        }
    };

    const getStatusColor = (expiryDate: string) => {
        const today = new Date();
        const expiry = parseISO(expiryDate);
        const daysLeft = differenceInDays(expiry, today);

        if (daysLeft < 0) return 'bg-red-100 text-red-800 border-red-200';
        if (daysLeft <= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    const getStatusText = (expiryDate: string) => {
        const today = new Date();
        const expiry = parseISO(expiryDate);
        const daysLeft = differenceInDays(expiry, today);

        if (daysLeft < 0) return `Expirat (${Math.abs(daysLeft)} zile)`;
        if (daysLeft === 0) return 'Expiră azi';
        return `${daysLeft} zile rămase`;
    }

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {errorMsg && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p className="font-bold">Eroare!</p>
                    <p>{errorMsg}</p>
                </div>
            )}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-700">Flotă Monitorizată</h3>
                <button
                    onClick={fetchDocuments}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    disabled={loading}
                >
                    <RefreshCcw className={clsx("w-4 h-4", loading && "animate-spin")} />
                    Reîmprospătează
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-100 text-gray-700 uppercase font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">Auto / Șofer</th>
                            <th className="px-6 py-3">Tip</th>
                            <th className="px-6 py-3">Expirare</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading && documents.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Se încarcă...</td></tr>
                        ) : documents.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Niciun document găsit. Adaugă unul!</td></tr>
                        ) : (
                            documents.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        {editingId === item.id ? (
                                            <input
                                                value={editForm.car_info}
                                                onChange={e => setEditForm({ ...editForm, car_info: e.target.value })}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : item.car_info}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === item.id ? (
                                            <select
                                                value={editForm.doc_type}
                                                onChange={e => setEditForm({ ...editForm, doc_type: e.target.value })}
                                                className="border rounded px-2 py-1"
                                            >
                                                <option value="ITP">ITP</option>
                                                <option value="RCA">RCA</option>
                                                <option value="Rovinieta">Rovinietă</option>
                                                <option value="Casco">Casco</option>
                                            </select>
                                        ) : item.doc_type}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === item.id ? (
                                            <input
                                                type="date"
                                                value={editForm.expiry_date}
                                                onChange={e => setEditForm({ ...editForm, expiry_date: e.target.value })}
                                                className="border rounded px-2 py-1"
                                            />
                                        ) : format(parseISO(item.expiry_date), 'dd.MM.yyyy')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                                            getStatusColor(item.expiry_date)
                                        )}>
                                            {getStatusText(item.expiry_date)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {editingId === item.id ? (
                                                <>
                                                    <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 text-gray-600 hover:bg-gray-50 rounded"><X className="w-4 h-4" /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => startEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
