import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Store, Plus } from 'lucide-react';

export const Branches: React.FC = () => {
  const { profile } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [newBranch, setNewBranch] = useState({
    name: '', location: ''
  });

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;
    
    const unsubscribe = onSnapshot(collection(db, 'branches'), (snapshot) => {
      setBranches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || profile.role !== 'admin') return;

    try {
      await addDoc(collection(db, 'branches'), {
        ...newBranch,
        createdAt: new Date().toISOString()
      });
      setShowAdd(false);
      setNewBranch({ name: '', location: '' });
    } catch (error) {
      console.error("Error adding branch", error);
    }
  };

  if (profile?.role !== 'admin') return <div>Accès refusé</div>;
  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Store /> Succursales
        </h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Nouvelle Succursale
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input type="text" required value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Localisation</label>
            <input type="text" required value={newBranch.location} onChange={e => setNewBranch({...newBranch, location: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg h-[42px]">Enregistrer</button>
        </form>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localisation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de création</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {branches.map((branch) => (
              <tr key={branch.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(branch.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
