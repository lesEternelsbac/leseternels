import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Plus } from 'lucide-react';

export const Sales: React.FC = () => {
  const { profile } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [newSale, setNewSale] = useState({
    inventoryId: '', quantity: 1
  });

  useEffect(() => {
    if (!profile) return;
    
    // Fetch Sales
    const qSales = profile.role !== 'admin'
      ? query(collection(db, 'sales'), where('branchId', '==', profile.branchId))
      : collection(db, 'sales');

    const unsubSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Fetch Inventory for dropdown
    const qInv = profile.role !== 'admin'
      ? query(collection(db, 'inventory'), where('branchId', '==', profile.branchId))
      : collection(db, 'inventory');
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubSales();
      unsubInv();
    };
  }, [profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const selectedItem = inventory.find(i => i.id === newSale.inventoryId);
    if (!selectedItem) return;

    const totalAmount = selectedItem.price * newSale.quantity;

    try {
      await addDoc(collection(db, 'sales'), {
        branchId: profile.branchId,
        sellerId: profile.uid,
        items: [{
          inventoryId: selectedItem.id,
          name: selectedItem.name,
          quantity: newSale.quantity,
          price: selectedItem.price
        }],
        totalAmount,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setShowAdd(false);
      setNewSale({ inventoryId: '', quantity: 1 });
    } catch (error) {
      console.error("Error adding sale", error);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart /> Ventes
        </h1>
        {profile?.role === 'seller' && (
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> Nouvelle Vente
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Article</label>
            <select required value={newSale.inventoryId} onChange={e => setNewSale({...newSale, inventoryId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border">
              <option value="">Sélectionner un article...</option>
              {inventory.filter(i => i.type === 'finished_product').map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.price} €)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantité</label>
            <input type="number" required min="1" value={newSale.quantity} onChange={e => setNewSale({...newSale, quantity: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border" />
          </div>
          <div className="col-span-2 flex justify-end">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg">Enregistrer la vente</button>
          </div>
        </form>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Articles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(sale.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {sale.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{sale.totalAmount} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
