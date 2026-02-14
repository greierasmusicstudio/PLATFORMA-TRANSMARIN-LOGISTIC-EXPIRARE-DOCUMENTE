"use client";

import { useEffect, useState } from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { clsx } from 'clsx';
import { supabase } from '@/utils/supabase';

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

    const fetchDocuments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .order('expiry_date', { ascending: true });

        if (error) {
            console.error('Eroare la încărcarea documentelor:', error);
        } else {
            setDocuments(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDocuments();

        // Auto-refresh la fiecare 30 secunde
        const interval = setInterval(fetchDocuments, 30000);
        return () => clearInterval(interval);
    }, []);

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
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">Auto / Șofer</th>
                            <th className="px-6 py-3">Tip Document</th>
                            <th className="px-6 py-3">Data Expirării</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Email Alertă</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    Se încarcă documentele...
                                </td>
                            </tr>
                        ) : documents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    Nu există documente. Adaugă primul document din formularul din stânga.
                                </td>
                            </tr>
                        ) : (
                            documents.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.car_info}</td>
                                    <td className="px-6 py-4">{item.doc_type}</td>
                                    <td className="px-6 py-4">{format(parseISO(item.expiry_date), 'dd.MM.yyyy')}</td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                                            getStatusColor(item.expiry_date)
                                        )}>
                                            {getStatusText(item.expiry_date)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{item.alert_email}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Buton Refresh manual */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                    onClick={fetchDocuments}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                    🔄 Reîncarcă datele
                </button>
            </div>
        </div>
    );
}
