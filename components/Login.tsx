
import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (isAdminMode: boolean) => void;
  isLoading: boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin, isLoading }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const handleLoginClick = () => {
    if (isAdminMode) {
      if (adminPassword === '040692') {
        onLogin(true);
      } else {
        alert('관리자 비밀번호가 올바르지 않습니다.');
      }
    } else {
      onLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-stone-900 text-white flex items-center justify-center rounded-2xl mx-auto mb-6 shadow-xl transform rotate-3">
             <span className="font-bold text-3xl">A</span>
          </div>
          
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Atelier.</h1>
          <p className="text-stone-500 mb-8">패션 상품 기획 및 생산 관리의 모든 것</p>

          <div className="space-y-4">
            
            {/* Admin Mode Toggle */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-600">
                <input 
                  type="checkbox" 
                  checked={isAdminMode} 
                  onChange={(e) => setIsAdminMode(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                관리자 로그인
              </label>
            </div>

            {isAdminMode && (
              <div className="mb-4 animate-fade-in">
                <div className="relative">
                  <input
                    type="password"
                    placeholder="관리자 비밀번호 입력"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 text-center"
                  />
                  <ShieldCheck size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" />
                </div>
              </div>
            )}

            <button
              onClick={handleLoginClick}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-3 border border-stone-200 font-medium h-12 rounded-lg transition-all active:scale-95 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed ${isAdminMode ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-white hover:bg-stone-50 text-stone-700'}`}
            >
              {isLoading ? (
                <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${isAdminMode ? 'border-white' : 'border-stone-900'}`} />
              ) : (
                <>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                  <span>Google 계정으로 {isAdminMode ? '관리자 접속' : '시작하기'}</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100">
            <p className="text-xs text-stone-400">
              계정이 없으신가요? 위 버튼을 통해<br/>
              자동으로 회원가입 및 로그인이 진행됩니다.
            </p>
          </div>
        </div>
        <div className="bg-stone-50 p-4 text-center border-t border-stone-100">
          <p className="text-xs text-stone-400">© 2024 Fashion Merchandising Planner</p>
        </div>
      </div>
    </div>
  );
};
