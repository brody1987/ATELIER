import React from 'react';
import { LayoutDashboard, Shirt, Settings, LogOut, Scissors, Users } from 'lucide-react';
import { UserAccount } from '../types.ts';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user?: UserAccount | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-2 text-stone-900">
            <div className="w-8 h-8 bg-stone-900 text-white flex items-center justify-center rounded-sm">
              <span className="font-bold text-lg">A</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">Atelier.</span>
          </div>
          <p className="text-xs text-stone-500 mt-1 uppercase tracking-wider">상품 기획 관리 (MD)</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => navigate('/')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/')
                ? 'bg-stone-900 text-white shadow-md'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <LayoutDashboard size={20} />
            대시보드
          </button>
          
          <button
            onClick={() => navigate('/products')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/products')
                ? 'bg-stone-900 text-white shadow-md'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Shirt size={20} />
            상품 관리
          </button>

          <button 
            onClick={() => navigate('/production')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/production')
                ? 'bg-stone-900 text-white shadow-md'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Scissors size={20} />
            생산 관리
          </button>

          {/* Admin Only Menu */}
          {user?.role === 'admin' && (
            <button 
              onClick={() => navigate('/users')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive('/users')
                  ? 'bg-stone-900 text-white shadow-md'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Users size={20} />
              회원 관리
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-stone-100 space-y-2">
          <button 
             onClick={() => navigate('/settings')}
             className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive('/settings')
                ? 'bg-stone-900 text-white shadow-md'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Settings size={20} />
            설정
          </button>
          <div className="flex items-center gap-3 px-4 py-3 mt-2">
            <div className="w-8 h-8 rounded-full bg-stone-200 overflow-hidden">
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-stone-300 flex items-center justify-center text-xs text-stone-500">
                    {user?.displayName?.[0]}
                 </div>
               )}
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2">
                 <p className="text-sm font-medium text-stone-900 truncate">{user?.displayName || '사용자'}</p>
                 {user?.role === 'admin' && <span className="text-[10px] bg-stone-900 text-white px-1 rounded">ADMIN</span>}
               </div>
               <p className="text-xs text-stone-500 truncate">{user?.email || ''}</p>
            </div>
            <LogOut 
              size={16} 
              className="text-stone-400 hover:text-stone-600 cursor-pointer flex-shrink-0" 
              onClick={onLogout}
              title="로그아웃"
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {/* Widen max-width for better screen usage */}
        <div className="w-full max-w-[1800px] mx-auto px-8 py-8 h-full">
           {children}
        </div>
      </main>
    </div>
  );
};