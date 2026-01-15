'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPharmacyResponseHistory } from '@/lib/firebase/firestore';
import { MedicineRequest, PharmacyResponse } from '@/types';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Pill,
  FileImage,
  Clock,
  ChevronRight,
} from 'lucide-react';

type HistoryItem = {
  request: MedicineRequest;
  response: PharmacyResponse;
};

export default function PharmacyHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user?.role !== 'pharmacy') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.uid) return;

      try {
        const data = await getPharmacyResponseHistory(user.uid);
        setHistory(data);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      fetchHistory();
    }
  }, [user?.uid]);

  const availableResponses = history.filter((h) => h.response.availability === 'available');
  const unavailableResponses = history.filter((h) => h.response.availability === 'not_available');

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/pharmacy/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">Response History</h1>
            <p className="text-sm text-gray-500">{history.length} total responses</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{availableResponses.length}</p>
                <p className="text-sm text-gray-500">Available</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unavailableResponses.length}</p>
                <p className="text-sm text-gray-500">Not Available</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No response history</h3>
            <p className="text-gray-500">
              Your responses to medicine requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <HistoryCard key={item.response.responseId} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const router = useRouter();
  const { request, response } = item;
  const isAvailable = response.availability === 'available';

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.();
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <button
      onClick={() => router.push(`/pharmacy/request/${request.requestId}`)}
      className="w-full bg-white p-4 rounded-xl border border-gray-100 text-left hover:border-gray-200 transition-colors"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
          {request.requestType === 'prescription' ? (
            <FileImage className="w-5 h-5 text-gray-600" />
          ) : (
            <Pill className="w-5 h-5 text-gray-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {request.requestType === 'prescription'
              ? 'Prescription Upload'
              : request.medicineText?.slice(0, 40) || 'Medicine Request'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{request.customerName}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-sm text-gray-500">
              {response.distance.toFixed(1)} km
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isAvailable
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 bg-gray-100'
              }`}
            >
              {isAvailable ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {isAvailable ? 'Marked Available' : 'Marked Not Available'}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(response.respondedAt)}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </button>
  );
}
