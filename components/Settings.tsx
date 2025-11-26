import React, { useState, useEffect } from 'react';
import { Save, UserCircle, Building, Tag, Trash2, Plus } from 'lucide-react';
import { UserProfile, UserAccount } from '../types.ts';

interface SettingsProps {
  currentUser: UserAccount;
  onUpdateProfile: (profile: UserProfile) => Promise<void>;
  brands: string[];
  onUpdateBrands: (brands: string[]) => void;
  isAdmin: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser, onUpdateProfile, brands, onUpdateBrands, isAdmin }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: currentUser.name || currentUser.displayName || '',
    department: currentUser.department || ''
  });
  const [newBrand, setNewBrand] = useState('');

  useEffect(() => {
    // Sync local state if currentUser props change (e.g. loaded from DB)
    setProfile({
        name: currentUser.name || currentUser.displayName || '',
        department: currentUser.department || ''
    });
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile.department.trim() || !profile.name.trim()) {
        alert('부서와 이름을 모두 입력해주세요.');
        return;
    }

    try {
        await onUpdateProfile(profile);
        alert('프로필 정보가 저장되었습니다. 이제 상품 관리 기능을 사용할 수 있습니다.');
    } catch (error) {
        console.error(error);
        alert('프로필 저장 중 오류가 발생했습니다.');
    }
  };

  const handleAddBrand = () => {
    if (newBrand.trim() && !brands.includes(newBrand.trim())) {
      onUpdateBrands([...brands, newBrand.trim()]);
      setNewBrand('');
    }
  };

  const handleDeleteBrand = (brandToDelete: string) => {
    if (window.confirm(`'${brandToDelete}' 브랜드를 목록에서 삭제하시겠습니까?`)) {
      onUpdateBrands(brands.filter(b => b !== brandToDelete));
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">설정</h1>
        <p className="text-stone-500 mt-2">사용자 프로필 및 앱 환경을 설정합니다.</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6 p-4 bg-stone-50 rounded-lg text-stone-700">
          <UserCircle size={24} className="text-stone-900" />
          <div>
            <h3 className="font-semibold">사용자 프로필 설정 (필수)</h3>
            <p className="text-sm text-stone-500">상품 등록 시 기록될 작성자 정보를 입력하세요. 입력하지 않으면 주요 기능을 사용할 수 없습니다.</p>
            <p className="text-xs text-blue-600 mt-1">* 정보는 계정에 저장되어 PC가 변경되어도 유지됩니다.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              <div className="flex items-center gap-2">
                <Building size={16} />
                소속 부서 <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              type="text"
              name="department"
              value={profile.department}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
              placeholder="예: 상품기획 1팀"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              <div className="flex items-center gap-2">
                <UserCircle size={16} />
                이름 <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
              placeholder="예: 김민준"
              required
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
            >
              <Save size={18} />
              프로필 저장
            </button>
          </div>
        </form>
      </div>

      {/* Brand Management (Admin Only) */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6 p-4 bg-stone-50 rounded-lg text-stone-700">
            <Tag size={24} className="text-stone-900" />
            <div>
              <h3 className="font-semibold">브랜드 관리 (Admin)</h3>
              <p className="text-sm text-stone-500">상품 등록 시 선택 가능한 브랜드 목록을 관리합니다.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="새 브랜드명 입력"
                className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
              <button
                onClick={handleAddBrand}
                disabled={!newBrand.trim()}
                className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                추가
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {brands.map((brand) => (
                <div key={brand} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-100 rounded-lg group">
                  <span className="text-sm font-medium text-stone-700">{brand}</span>
                  <button 
                    onClick={() => handleDeleteBrand(brand)}
                    className="text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Firebase Config Hidden/Disabled Area */}
      <div className="p-4 rounded-xl border border-stone-100 bg-stone-50/50 text-center">
          <p className="text-xs text-stone-400">Firebase 연결 설정은 관리자에 의해 고정되었습니다.</p>
      </div>
    </div>
  );
};