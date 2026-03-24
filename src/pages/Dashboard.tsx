import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile || profile.role !== 'admin') return;
      
      try {
        const salesRef = collection(db, 'sales');
        const q = query(salesRef);
        const snapshot = await getDocs(q);
        
        const data = snapshot.docs.map(doc => doc.data());
        
        // Aggregate sales by date (last 7 days)
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = subDays(new Date(), i);
          return format(d, 'yyyy-MM-dd');
        }).reverse();

        const chartData = last7Days.map(date => {
          const daySales = data.filter(s => s.date.startsWith(date));
          const total = daySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
          return { date, ventes: total };
        });

        setSalesData(chartData);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  if (profile?.role !== 'admin') {
    return <div className="p-4">Bienvenue sur Fashion ERP. Accédez aux menus sur la gauche.</div>;
  }

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Ventes Totales (7j)</h3>
          <p className="text-3xl font-bold text-gray-900">
            {salesData.reduce((sum, d) => sum + d.ventes, 0).toLocaleString()} €
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow h-96">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Évolution des Ventes (7 derniers jours)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="ventes" fill="#4f46e5" name="Ventes (€)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
