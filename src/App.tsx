import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  ShieldCheck,
  PlusCircle,
  LayoutGrid,
  LogOut,
  ShoppingCart,
  MessageSquare,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import AdminUploader from './components/AdminUploader';
import AdminInventory from './components/AdminInventory';
import { useAuth } from './lib/AuthContext';
import AuthForm from './components/AuthForm';
import { useCart } from './lib/CartContext';
import CartDrawer from './components/CartDrawer';
import ChatInbox from './components/ChatInbox';
import StorefrontPage from './pages/StorefrontPage';
import ProductPage from './pages/ProductPage';

function AdminRoute() {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {authLoading ? (
        <p className="text-gray-500 text-center py-12">Checking authentication...</p>
      ) : !user ? (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-md mx-auto">
          <h3 className="text-lg font-bold mb-4 text-center">Admin Sign In</h3>
          <AuthForm />
        </div>
      ) : !isAdmin ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm max-w-md mx-auto">
          <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Access Restricted</h3>
          <p className="text-gray-600 text-xs mb-4">
            You are signed in as <span className="font-semibold">{user.email}</span>, but this account does not have admin
            permissions.
          </p>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      ) : (
        <AdminUploader onProductAdded={() => window.location.assign('/')} />
      )}
    </main>
  );
}

function InventoryRoute() {
  const { isAdmin, loading: authLoading } = useAuth();
  if (authLoading) return <p className="text-gray-500 text-center py-12">Checking authentication...</p>;
  if (!isAdmin) return <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center text-gray-500">Access restricted.</main>;
  return <AdminInventory />;
}

function OrdersRoute() {
  const { user } = useAuth();
  if (!user) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <AuthForm />
      </main>
    );
  }
  return <ChatInbox />;
}

function AuthRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {user ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm max-w-md mx-auto">
          <p className="text-gray-700 font-medium mb-4">You're already signed in as {user.email}.</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg">
            Back to Storefront
          </button>
        </div>
      ) : (
        <AuthForm />
      )}
    </main>
  );
}

export default function App() {
  const { user, profile, isAdmin, loading: authLoading, signOut } = useAuth();
  const { items: cartItems } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function isActive(path: string) {
    return location.pathname === path;
  }

  function go(path: string) {
    navigate(path);
    setMobileMenuOpen(false);
  }

  const navButtonClass = (path: string) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
      isActive(path) ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

  const mobileNavButtonClass = (path: string) =>
    `w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-colors ${
      isActive(path) ? 'bg-black text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-40 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => go('/')}>
          <div className="bg-black rounded-lg p-1.5">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h1 className="text-base sm:text-xl font-black tracking-wider uppercase leading-none">
            Snowy's <span className="hidden sm:inline">Thrift Store</span>
          </h1>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-3">
          <button onClick={() => go('/')} className={navButtonClass('/')}>
            <LayoutGrid className="w-3.5 h-3.5" /> Storefront
          </button>

          {user && (
            <button onClick={() => go('/orders')} className={navButtonClass('/orders')}>
              <MessageSquare className="w-3.5 h-3.5" /> {isAdmin ? 'Orders Inbox' : 'My Orders'}
            </button>
          )}

          {isAdmin && (
            <>
              <button onClick={() => go('/inventory')} className={navButtonClass('/inventory')}>
                <Settings className="w-3.5 h-3.5" /> Manage Inventory
              </button>
              <button onClick={() => go('/admin')} className={navButtonClass('/admin')}>
                <PlusCircle className="w-3.5 h-3.5" /> Add New
              </button>
            </>
          )}

          <button
            onClick={() => setShowCart(true)}
            className="relative px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>

          {user ? (
            <button
              onClick={signOut}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out {profile?.full_name ? `(${profile.full_name.split(' ')[0]})` : ''}
            </button>
          ) : (
            !authLoading && (
              <button
                onClick={() => go('/auth')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-black text-white hover:bg-gray-800 transition-colors"
              >
                Sign In
              </button>
            )
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setShowCart(true)}
            className="relative px-2.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 space-y-1.5 sticky top-[57px] z-30 shadow-sm">
          <button onClick={() => go('/')} className={mobileNavButtonClass('/')}>
            <LayoutGrid className="w-4 h-4" /> Storefront
          </button>
          {user && (
            <button onClick={() => go('/orders')} className={mobileNavButtonClass('/orders')}>
              <MessageSquare className="w-4 h-4" /> {isAdmin ? 'Orders Inbox' : 'My Orders'}
            </button>
          )}
          {isAdmin && (
            <>
              <button onClick={() => go('/inventory')} className={mobileNavButtonClass('/inventory')}>
                <Settings className="w-4 h-4" /> Manage Inventory
              </button>
              <button onClick={() => go('/admin')} className={mobileNavButtonClass('/admin')}>
                <PlusCircle className="w-4 h-4" /> Add New
              </button>
            </>
          )}
          {user ? (
            <button
              onClick={() => { signOut(); setMobileMenuOpen(false); }}
              className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium bg-gray-50 text-red-600 hover:bg-red-50 flex items-center gap-2.5"
            >
              <LogOut className="w-4 h-4" /> Sign Out {profile?.full_name ? `(${profile.full_name.split(' ')[0]})` : ''}
            </button>
          ) : (
            !authLoading && (
              <button onClick={() => go('/auth')} className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium bg-black text-white">
                Sign In
              </button>
            )
          )}
        </div>
      )}

      {showCart && <CartDrawer onClose={() => setShowCart(false)} />}

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<StorefrontPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/inventory" element={<InventoryRoute />} />
          <Route path="/orders" element={<OrdersRoute />} />
          <Route path="/auth" element={<AuthRoute />} />
        </Routes>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="font-black uppercase tracking-wider text-sm mb-1">Snowy's Thrift Store</p>
          <p className="text-gray-400 text-xs">Handpicked pre-loved fashion. One item, one owner, one story. Delivered nationwide via PAXI.</p>
        </div>
      </footer>
    </div>
  );
}