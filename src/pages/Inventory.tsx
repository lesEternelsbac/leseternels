import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Package, Plus } from 'lucide-react';

export const Inventory: React.FC = () => {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [newItem, setNewItem] = useState({
    name: '', type: 'raw_material', quantity: 0, unit: 'm', price: 0
  });

  useEffect(() => {
    if (!profile) return;
    
    const q = profile.role !== 'admin'
      ? query(collection(db, 'inventory'), where('branchId', '==', profile.branchId))
      : collection(db, 'inventory');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      await addDoc(collection(db, 'inventory'), {
        ...newItem,
        branchId: profile.role === 'admin' ? 'global' : profile.branchId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowAdd(false);
      setNewItem({ name: '', type: 'raw_material', quantity: 0, unit: 'm', price: 0 });
    } catch (error) {
      console.error("Error adding item", error);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package /> Gestion des Stocks
        </h1>
        {(profile?.role === 'admin' || profile?.role === 'supervisor') && (
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> Ajouter un article
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border">
              <option value="raw_material">Matière Première</option>
              <option value="finished_product">Produit Fini</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantité</label>
            <input type="number" required min="0" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unité (m, kg, pièce)</label>
            <input type="text" required value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prix Unitaire (€)</label>
            <input type="number" required min="0" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border" />
          </div>
          <div className="col-span-2 flex justify-end">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Enregistrer</button>
          </div>
        </form>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.type === 'raw_material' ? 'Matière Première' : 'Produit Fini'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.price} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
