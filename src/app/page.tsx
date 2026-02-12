import DocumentForm from '@/components/DocumentForm';
import DashboardTable from '@/components/DashboardTable';
import { Truck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold tracking-wide uppercase">Transmarin Logistic</h1>
              <p className="text-xs text-gray-400 tracking-wider">Document Management System</p>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-300">
            {new Date().toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Intro / Stats (Optional, keeping it simple for now) */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-1">
            <DocumentForm />
          </div>

          {/* Right Column: Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">
                Monitorizare Flotă
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Vizualizează statusul documentelor pentru flota auto. Documentele care expiră în curând sunt marcate automat.
              </p>
              <DashboardTable />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Transmarin Logistic. Toate drepturile rezervate.
        </div>
      </footer>
    </div>
  );
}
