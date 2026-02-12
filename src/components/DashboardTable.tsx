"use client";

import { differenceInDays, parseISO, format } from 'date-fns';
import { clsx } from 'clsx';

// Mock Data
const MOCK_DATA = [
    { id: 1, carInfo: 'B 101 XYZ', docType: 'RCA', expiryDate: '2026-03-01', alertEmail: 'admin@transmarin.ro' },
    { id: 2, carInfo: 'B 202 AB', docType: 'ITP', expiryDate: '2026-02-15', alertEmail: 'sofer2@transmarin.ro' }, // Should be yellow/red soon
    { id: 3, carInfo: 'B 303 CD', docType: 'Rovinieta', expiryDate: '2026-05-20', alertEmail: 'contact@transmarin.ro' },
    { id: 4, carInfo: 'Ion Popescu', docType: 'Permis', expiryDate: '2025-01-01', alertEmail: 'ion@gmail.com' }, // Expired (Red)
];

export default function DashboardTable() {
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
                        {MOCK_DATA.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{item.carInfo}</td>
                                <td className="px-6 py-4">{item.docType}</td>
                                <td className="px-6 py-4">{format(parseISO(item.expiryDate), 'dd.MM.yyyy')}</td>
                                <td className="px-6 py-4">
                                    <span className={clsx(
                                        'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                                        getStatusColor(item.expiryDate)
                                    )}>
                                        {getStatusText(item.expiryDate)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{item.alertEmail}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
