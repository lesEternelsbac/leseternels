import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Banknote, Plus, Check, X } from 'lucide-react';

export const Deposits: React.FC = () => {
  const { profile } = useAuth();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [newDeposit, setNewDeposit] = useState({
    amount: 0
  });

  useEffect(() => {
    if (!profile) return;
    
    const q = profile.role !== 'admin'
      ? query(collection(db, 'deposits'), where('branchId', '==', profile.branchId))
      : collection(db, 'deposits');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDeposits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      await addDoc(collection(db, 'deposits'), {
        amount: newDeposit.amount,
        branchId: profile.branchId,
        submittedBy: profile.uid,
        validatedBy: null,
        status: 'pending',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setShowAdd(false);
      setNewDeposit({ amount: 0 });
    } catch (error) {
      console.error("Error adding deposit", error);
    }
  };

  const handleValidate = async (id: string, status: 'validated' | 'rejected') => {
    if (!profile || profile.role !== 'supervisor') return;
    try {
      await updateDoc(doc(db, 'deposits', id), {
        status,
        validatedBy: profile.uid
      });
    } catch (error) {
      console.error("Error validating deposit", error);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Banknote /> Dépôts Journaliers
        </h1>
        {profile?.role === 'seller' && (
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> Nouveau Dépôt
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Montant du dépôt (€)</label>
            <input type="number" required min="0.01" step="0.01" value={newDeposit.amount} onChange={e => setNewDeposit({amount: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg h-[42px]">Déclarer</button>
        </form>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              {profile?.role === 'supervisor' && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deposits.map((deposit) => (
              <tr key={deposit.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(deposit.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{deposit.amount} €</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${deposit.status === 'validated' ? 'bg-green-100 text-green-800' : 
                      deposit.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {deposit.status === 'pending' ? 'En attente' : deposit.status === 'validated' ? 'Validé' : 'Rejeté'}
                  </span>
                </td>
                {profile?.role === 'supervisor' && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {deposit.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleValidate(deposit.id, 'validated')} className="text-green-600 hover:text-green-900"><Check size={20} /></button>
                        <button onClick={() => handleValidate(deposit.id, 'rejected')} className="text-red-600 hover:text-red-900"><X size={20} /></button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
