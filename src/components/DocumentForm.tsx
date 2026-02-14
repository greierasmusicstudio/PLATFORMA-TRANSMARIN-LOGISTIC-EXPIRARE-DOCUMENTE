"use client";

import { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function DocumentForm() {
    const [formData, setFormData] = useState({
        car_info: '',
        doc_type: 'ITP',
        expiry_date: '',
        alert_email: '',
        alert_30_days: true,
        alert_7_days: true,
        alert_1_day: true,
    });

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Server error');
            }

            setStatus('success');
            // Reset form after success
            setFormData({
                car_info: '',
                doc_type: 'ITP',
                expiry_date: '',
                alert_email: '',
                alert_30_days: true,
                alert_7_days: true,
                alert_1_day: true,
            });
            setTimeout(() => {
                setStatus('idle');
                // Optional: trigger a refresh of the dashboard list if needed
                // For now, allow auto-refresh or manual refresh
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                <Save className="w-5 h-5" />
                Adaugă Document Nou
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Car Info */}
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">
                        Număr Auto / Nume Șofer
                    </label>
                    <input
                        type="text"
                        name="car_info"
                        required
                        value={formData.car_info}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                        placeholder="ex: B 123 ABC / Ion Popescu"
                    />
                </div>

                {/* Document Type */}
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">
                        Tip Document
                    </label>
                    <select
                        name="doc_type"
                        value={formData.doc_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                    >
                        <option value="ITP">ITP</option>
                        <option value="RCA">RCA</option>
                        <option value="Rovinieta">Rovinietă</option>
                        <option value="Casco">Casco</option>
                        <option value="Altul">Altul</option>
                    </select>
                </div>

                {/* Expiration Date */}
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">
                        Data Expirării
                    </label>
                    <input
                        type="date"
                        name="expiry_date"
                        required
                        value={formData.expiry_date}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
                    />
                </div>

                {/* Alert Email */}
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">
                        Email Alertă
                    </label>
                    <input
                        type="email"
                        name="alert_email"
                        required
                        value={formData.alert_email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold placeholder-gray-500"
                        placeholder="email@exemplu.com"
                    />
                </div>

                {/* Alert Logic */}
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                        Configurează Alerte
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="alert_30_days"
                                checked={formData.alert_30_days}
                                onChange={handleCheckboxChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-gray-900">30 Zile</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="alert_7_days"
                                checked={formData.alert_7_days}
                                onChange={handleCheckboxChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-gray-900">7 Zile</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="alert_1_day"
                                checked={formData.alert_1_day}
                                onChange={handleCheckboxChange}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-gray-900">1 Zi</span>
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`w-full py-3 px-4 rounded-md text-white font-bold text-lg shadow-md transition-all transform active:scale-95 ${status === 'loading'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                        }`}
                >
                    {status === 'loading' ? 'Se salvează în Cloud...' : 'Salvează Document'}
                </button>

                {/* Feedback Message */}
                {status === 'success' && (
                    <div className="mt-3 p-3 bg-green-100 text-green-800 border border-green-200 rounded-md flex items-center gap-2 text-sm font-semibold animate-pulse">
                        <AlertCircle className="w-5 h-5" />
                        Document salvat cu succes! (Se reîncarcă...)
                    </div>
                )}
                {status === 'error' && (
                    <div className="mt-3 p-3 bg-red-100 text-red-800 border border-red-200 rounded-md flex items-center gap-2 text-sm font-semibold">
                        <AlertCircle className="w-5 h-5" />
                        Eroare la salvare. Încearcă din nou!
                    </div>
                )}
            </form>
        </div>
    );
}
