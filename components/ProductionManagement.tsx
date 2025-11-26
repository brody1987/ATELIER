import React from 'react';
import { Product, Status } from '../types.ts';
import { CheckCircle2, Clock, AlertCircle, ArrowRight, ArrowLeft, Package } from 'lucide-react';

interface ProductionManagementProps {
  products: Product[];
  onUpdateStatus: (id: string, newStatus: Status) => void;
}

const STAGES: { id: Status; label: string; color: string; icon: React.ReactNode }[] = [
  { 
    id: 'Plan', 
    label: '기획 (Plan)', 
    color: 'bg-stone-100 border-stone-200',
    icon: <Clock size={16} className="text-stone-500" />
  },
  { 
    id: 'Sample', 
    label: '샘플 (Sample)', 
    color: 'bg-blue-50 border-blue-100',
    icon: <AlertCircle size={16} className="text-blue-500" />
  },
  { 
    id: 'Production', 
    label: '생산 (Production)', 
    color: 'bg-amber-50 border-amber-100',
    icon: <Package size={16} className="text-amber-500" />
  },
  { 
    id: 'Released', 
    label: '출시 (Released)', 
    color: 'bg-green-50 border-green-100',
    icon: <CheckCircle2 size={16} className="text-green-500" />
  }
];

export const ProductionManagement: React.FC<ProductionManagementProps> = ({ products, onUpdateStatus }) => {
  
  const getNextStatus = (current: Status): Status | null => {
    const idx = STAGES.findIndex(s => s.id === current);
    if (idx >= 0 && idx < STAGES.length - 1) {
      return STAGES[idx + 1].id;
    }
    return null;
  };

  const getPrevStatus = (current: Status): Status | null => {
    const idx = STAGES.findIndex(s => s.id === current);
    if (idx > 0) {
      return STAGES[idx - 1].id;
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-stone-900">생산 관리 (Kanban)</h1>
        <p className="text-stone-500 mt-2">상품의 생산 단계를 시각적으로 관리하고 업데이트하세요.</p>
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex h-full gap-6 min-w-[1000px]">
          {STAGES.map((stage) => {
            const stageProducts = products.filter(p => p.status === stage.id);
            
            return (
              <div key={stage.id} className="flex-1 flex flex-col h-full min-w-[280px] max-w-xs">
                {/* Column Header */}
                <div className={`flex items-center justify-between p-4 rounded-t-xl border-t border-l border-r ${stage.color} bg-white/50 backdrop-blur-sm`}>
                  <div className="flex items-center gap-2 font-bold text-stone-700">
                    {stage.icon}
                    <span>{stage.label}</span>
                  </div>
                  <span className="text-xs font-bold bg-white px-2 py-1 rounded-full text-stone-500 shadow-sm border border-stone-100">
                    {stageProducts.length}
                  </span>
                </div>

                {/* Drop Area / List */}
                <div className={`flex-1 p-3 space-y-3 overflow-y-auto border-l border-r border-b rounded-b-xl bg-stone-50/50 ${stage.color.replace('bg-', 'border-')}`}>
                  {stageProducts.map(product => (
                    <div key={product.id} className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex gap-3 mb-3">
                        <div className="w-12 h-12 rounded bg-stone-100 overflow-hidden flex-shrink-0">
                          {product.designImage ? (
                            <img src={product.designImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300">
                              <Package size={16} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-stone-900 truncate">{product.itemName}</h4>
                          <p className="text-xs text-stone-500 truncate">{product.sku}</p>
                          <p className="text-xs text-stone-400 mt-0.5">{product.supplier || '발주처 미정'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-stone-500 border-t border-stone-50 pt-3 mt-2">
                         <span>{product.planQty.toLocaleString()}개</span>
                         <span>{product.season}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {getPrevStatus(product.status) && (
                           <button 
                             onClick={() => onUpdateStatus(product.id, getPrevStatus(product.status)!)}
                             className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
                             title="이전 단계로"
                           >
                              <ArrowLeft size={12} /> 이전
                           </button>
                        )}
                        {getNextStatus(product.status) && (
                           <button 
                             onClick={() => onUpdateStatus(product.id, getNextStatus(product.status)!)}
                             className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded bg-stone-100 text-stone-600 hover:bg-stone-900 hover:text-white transition-colors"
                             title="다음 단계로"
                           >
                              다음 <ArrowRight size={12} />
                           </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {stageProducts.length === 0 && (
                    <div className="h-32 flex items-center justify-center text-stone-400 text-sm italic border-2 border-dashed border-stone-200 rounded-lg m-1">
                      상품 없음
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};