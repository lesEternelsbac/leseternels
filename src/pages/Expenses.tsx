import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Receipt, Plus } from 'lucide-react';

export const Expenses: React.FC = () => {
  const { profile } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [newExpense, setNewExpense] = useState({
    category: 'rent', amount: 0, description: ''
  });

  useEffect(() => {
    if (!profile) return;
    
    const q = profile.role !== 'admin'
      ? query(collection(db, 'expenses'), where('branchId', '==', profile.branchId))
      : collection(db, 'expenses');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      await addDoc(collection(db, 'expenses'), {
        ...newExpense,
        branchId: profile.branchId,
        userId: profile.uid,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setShowAdd(false);
      setNewExpense({ category: 'rent', amount: 0, description: '' });
    } catch (error) {
      console.error("Error adding expense", error);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Receipt /> Dépenses
        </h1>
        {(profile?.role === 'seller' || profile?.role === 'supervisor') && (
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> Nouvelle Dépense
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Catégorie</label>
            <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border">
              <option value="rent">Loyer</option>
              <option value="electricity">Électricité</option>
              <option value="transport">Transport</option>
              <option value="supplies">Fournitures</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Montant (€)</label>
            <input type="number" required min="0.01" step="0.01" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 p-2 border" rows={3}></textarea>
          </div>
          <div className="col-span-2 flex justify-end">
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg">Enregistrer la dépense</button>
          </div>
        </form>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(expense.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {expense.category}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{expense.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">-{expense.amount} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
