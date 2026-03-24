import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase';
import { LayoutDashboard, Users, Store, Package, ShoppingCart, Receipt, Banknote, LogOut } from 'lucide-react';

export const Layout: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!profile) return null;

  const isAdmin = profile.role === 'admin';
  const isSupervisor = profile.role === 'supervisor';
  const isSeller = profile.role === 'seller';

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Fashion ERP</h1>
          <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {isAdmin && (
            <>
              <Link to="/" className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded">
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
              <Link to="/users" className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded">
                <Users size={20} />
                <span>Utilisateurs</span>
              </Link>
              <Link to="/branches" className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded">
                <Store size={20} />
                <span>Succursales</span>
              </Link>
            </>
          )}
          
          {(isAdmin || isSupervisor || isSeller) && (
            <>
              <Link to="/inventory" className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded">
                <Package size={20} />
                <span>Stocks</span>
              </Link>
              <Link to="/sales" className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded">
                <ShoppingCart size={20} />
                <span>Ventes</span>
              </Link>
              <Link to="/expenses" className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded">
                <Receipt size={20} />
                <span>Dépenses</span>
              </Link>
              <Link to="/deposits" className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded">
                <Banknote size={20} />
                <span>Dépôts</span>
              </Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 p-2 w-full text-red-600 hover:bg-red-50 rounded"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};
