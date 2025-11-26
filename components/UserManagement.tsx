
import React, { useEffect, useState } from 'react';
import { UserAccount } from '../types';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { Shield, UserX, UserCheck, Search, Loader2 } from 'lucide-react';

interface UserManagementProps {
  currentUser: UserAccount;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.values(data) as UserAccount[];
        setUsers(userList);
      } else {
        setUsers([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleBan = async (targetUid: string, currentStatus: 'active' | 'banned') => {
    if (targetUid === currentUser.uid) {
      alert("본인의 계정은 변경할 수 없습니다.");
      return;
    }
    
    if (window.confirm(`정말 이 사용자를 ${currentStatus === 'active' ? '탈퇴(차단)' : '복구'} 처리하시겠습니까?`)) {
      const db = getDatabase();
      const newStatus = currentStatus === 'active' ? 'banned' : 'active';
      try {
        await update(ref(db, `users/${targetUid}`), { status: newStatus });
      } catch (error) {
        console.error("Error updating user status:", error);
        alert("상태 변경 중 오류가 발생했습니다.");
      }
    }
  };

  const filteredUsers = users.filter(user => 
    (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-stone-400" /></div>;
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-2">
          <Shield className="text-stone-900" />
          회원 관리 (Admin)
        </h1>
        <p className="text-stone-500 mt-2">등록된 회원 현황을 조회하고 관리합니다.</p>
      </header>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder="이름 또는 이메일 검색..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100 text-stone-500 uppercase text-xs font-semibold">
                <th className="px-6 py-4">사용자 정보</th>
                <th className="px-6 py-4">이메일</th>
                <th className="px-6 py-4">권한 (Role)</th>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4">최근 접속</th>
                <th className="px-6 py-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.map(user => (
                <tr key={user.uid} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">
                            {user.displayName?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-stone-900">{user.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-stone-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>
                      {user.role === 'admin' ? '관리자' : '일반'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {user.status === 'active' ? '활동중' : '차단됨'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-stone-500 text-xs">
                    {new Date(user.lastLogin).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => handleToggleBan(user.uid, user.status)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mx-auto ${
                          user.status === 'active' 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {user.status === 'active' ? (
                          <><UserX size={14} /> 탈퇴/차단</>
                        ) : (
                          <><UserCheck size={14} /> 복구/승인</>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
