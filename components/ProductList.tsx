import React, { useState, useEffect, useMemo } from 'react';
import { Product, Category, UserAccount } from '../types.ts';
import { Search, Plus, Filter, Trash2, Edit, Download, Archive, Calculator, X, FileText, Maximize2, Scissors, RotateCcw, ArrowUp, ArrowDown, User } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProductListProps {
  products: Product[];
  currentUser: UserAccount;
  onAddProduct: () => void;
  onEditProduct: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
}

type SortField = 'itemName' | 'planQty' | 'actualSoldQty' | 'season' | 'status' | 'brand' | 'author' | 'costPrice' | 'retailPrice';
type SortOrder = 'asc' | 'desc';

export const ProductList: React.FC<ProductListProps> = ({ products, currentUser, onAddProduct, onEditProduct, onDeleteProduct, onUpdateProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [filterAuthor, setFilterAuthor] = useState<string>('All');
  
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('itemName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modal States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEndSeasonModalOpen, setIsEndSeasonModalOpen] = useState(false);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  
  // Image Popup State
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  
  // Input States for Modals
  const [actualSoldQty, setActualSoldQty] = useState<number>(0);

  // Close Image Popup on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewingProduct(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Extract Unique Authors
  const authors = useMemo(() => {
      const uniqueAuthors = new Set(products.map(p => p.author).filter(Boolean));
      return Array.from(uniqueAuthors).sort();
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => {
        const matchesSearch = p.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.sku.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
        const matchesAuthor = filterAuthor === 'All' || p.author === filterAuthor;
        return matchesSearch && matchesCategory && matchesAuthor;
    });

    result.sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'actualSoldQty') {
            valA = a.actualSoldQty || 0;
            valB = b.actualSoldQty || 0;
        }

        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    return result;
  }, [products, searchTerm, filterCategory, filterAuthor, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
      if (sortField === field) {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
          setSortField(field);
          setSortOrder('asc');
      }
  };

  const renderSortIcon = (field: SortField) => {
      if (sortField !== field) return null;
      return sortOrder === 'asc' ? <ArrowUp size={14} className="inline ml-1" /> : <ArrowDown size={14} className="inline ml-1" />;
  };

  const handleDownloadExcel = () => {
    const excelData = filteredAndSortedProducts.map(p => {
        const totalProductionCost = p.costPrice * p.planQty;
        const totalRetailValue = p.retailPrice * p.planQty;
        const expectedRevenue = totalRetailValue * (p.targetSellThrough / 100);
        const marketingBudget = p.marketingBudget || 0;
        
        // Plan Metrics
        const planGrossProfit = expectedRevenue - totalProductionCost;
        const planNetProfit = planGrossProfit - marketingBudget;
        
        // Actual Metrics
        const actualRevenue = p.retailPrice * (p.actualSoldQty || 0);
        const actualGrossProfit = actualRevenue - totalProductionCost; // Cost is sunk
        const actualNetProfit = actualGrossProfit - marketingBudget;

        return {
          '시즌': p.season,
          '카테고리': p.category,
          '브랜드': p.brand || '',
          '상품명': p.itemName,
          'SKU': p.sku,
          '작성자': p.author,
          '부서': p.department,
          '발주처': p.supplier,
          '공장': p.factory, 
          '주문유형': p.orderType === 'New' ? '신규' : p.orderType === 'Reorder' ? '리오더' : '샘플',
          '진행상태': p.status,
          '기획수량': p.planQty,
          '원가': p.costPrice,
          '판매가': p.retailPrice,
          '총생산예산': totalProductionCost,
          '목표소진율(%)': p.targetSellThrough,
          '예상매출': expectedRevenue,
          '실매출': p.isSeasonEnded ? actualRevenue : '',
          '목표광고비': marketingBudget,
          '예상순이익': planNetProfit,
          '실순이익': p.isSeasonEnded ? actualNetProfit : '',
          '실판매수량': p.actualSoldQty || 0,
          '마감여부': p.isSeasonEnded ? 'Y' : 'N',
          '판매시작일': p.salesStartDate || '',
          '판매종료일': p.salesEndDate || '',
          '컬러': p.colorList,
          '사이즈': p.sizeList,
          '메모수': p.comments?.length || 0
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, `Fashion_Merch_Plan_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const openEndSeasonModal = (product: Product) => {
    setSelectedProduct(product);
    setActualSoldQty(product.actualSoldQty || 0);
    setIsEndSeasonModalOpen(true);
  };

  const handleEndSeason = () => {
    if (selectedProduct) {
        onUpdateProduct(selectedProduct.id, {
            actualSoldQty: actualSoldQty,
            isSeasonEnded: true
        });
        setIsEndSeasonModalOpen(false);
        setSelectedProduct(null);
    }
  };

  const handleCancelEndSeason = (product: Product) => {
      if (window.confirm(`'${product.itemName}'의 시즌 마감 처리를 취소하시겠습니까?`)) {
          onUpdateProduct(product.id, {
              isSeasonEnded: false,
              actualSoldQty: 0
          });
      }
  };

  const openClearanceModal = (product: Product) => {
    setSelectedProduct(product);
    setIsClearanceModalOpen(true);
  };

  const openPlanDocument = (product: Product) => {
      const url = product.planFileUrl || product.planUrl;
      if (url) {
          window.open(url, '_blank');
      } else {
          alert('등록된 기획안이 없습니다.');
      }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Plan': return '기획';
      case 'Sample': return '샘플';
      case 'Production': return '생산';
      case 'Released': return '출시';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Plan': return 'bg-stone-100 text-stone-600';
      case 'Sample': return 'bg-blue-50 text-blue-700';
      case 'Production': return 'bg-amber-50 text-amber-700';
      case 'Released': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);
  };

  // Permission Helper
  const canEdit = (product: Product) => {
    return currentUser.role === 'admin' || currentUser.uid === product.authorUid;
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">상품 관리</h1>
          <p className="text-stone-500 mt-1">시즌별 기획 상품을 관리하고 재무 성과를 분석하세요.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:bg-stone-50 active:scale-95"
          >
            <Download size={18} />
            Excel 다운로드
          </button>
          <button 
            onClick={onAddProduct}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            신규 상품 등록
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input 
            type="text" 
            placeholder="상품명, SKU 검색..." 
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <User size={18} className="text-stone-400" />
          <select 
            className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
            value={filterAuthor}
            onChange={(e) => setFilterAuthor(e.target.value)}
          >
            <option value="All">전체 작성자</option>
            {authors.map(author => (
                <option key={author} value={author}>{author}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-stone-400" />
          <select 
            className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as Category | 'All')}
          >
            <option value="All">전체 카테고리</option>
            <option value="Clothing">의류</option>
            <option value="Shoes">신발</option>
            <option value="Accessories">액세서리</option>
            <option value="GeneralGoods">잡화</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th 
                    className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors"
                    onClick={() => handleSort('itemName')}
                >
                    상품정보 {renderSortIcon('itemName')}
                </th>
                <th 
                    className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors"
                    onClick={() => handleSort('brand')}
                >
                    브랜드 {renderSortIcon('brand')}
                </th>
                <th 
                    className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right cursor-pointer hover:bg-stone-100 transition-colors"
                    onClick={() => handleSort('planQty')}
                >
                    수량 (기획/실) {renderSortIcon('planQty')}
                </th>
                
                {/* Financial Columns */}
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">
                    매출 (Revenue)
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">
                    수익 (Profit)
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">
                    수익률 (%)
                </th>

                <th 
                    className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors"
                    onClick={() => handleSort('status')}
                >
                    상태 {renderSortIcon('status')}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredAndSortedProducts.map((product) => {
                  const hasPlan = product.planUrl || product.planFileUrl;
                  const hasPermission = canEdit(product);
                  const isEnded = product.isSeasonEnded;

                  // Financial Calculations
                  const planRevenue = product.retailPrice * product.planQty * (product.targetSellThrough / 100);
                  const planCost = product.costPrice * product.planQty;
                  const marketing = product.marketingBudget || 0;
                  const planProfit = planRevenue - planCost - marketing;
                  const planMargin = planRevenue > 0 ? (planProfit / planRevenue) * 100 : 0;

                  const actualRevenue = product.retailPrice * (product.actualSoldQty || 0);
                  const actualCost = planCost; // Production cost is fixed based on plan
                  const actualProfit = actualRevenue - actualCost - marketing;
                  const actualMargin = actualRevenue > 0 ? (actualProfit / actualRevenue) * 100 : 0;

                  const displayRevenue = isEnded ? actualRevenue : planRevenue;
                  const displayProfit = isEnded ? actualProfit : planProfit;
                  const displayMargin = isEnded ? actualMargin : planMargin;

                  return (
                <tr key={product.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity relative"
                        onClick={() => setViewingProduct(product)}
                      >
                        {product.designImage ? (
                          <img src={product.designImage} alt={product.itemName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <Plus size={16} />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                            <Maximize2 size={14} className="text-white drop-shadow-md" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900 max-w-[180px] truncate" title={product.itemName}>{product.itemName}</p>
                        <p className="text-xs text-stone-500">{product.sku}</p>
                        {hasPlan && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); openPlanDocument(product); }}
                                className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 hover:underline"
                            >
                                <FileText size={10} /> 기획안 보기
                            </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-600">
                    <div className="flex flex-col">
                        <span>{product.brand || '-'}</span>
                        <span className="text-[10px] text-stone-400">{product.author}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-600 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{product.planQty.toLocaleString()}</span>
                        {isEnded && <span className="text-xs text-stone-500">실: {product.actualSoldQty?.toLocaleString()}</span>}
                      </div>
                  </td>
                  
                  {/* Revenue */}
                  <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                          <span className={`text-sm font-medium ${isEnded ? 'text-stone-900 font-bold' : 'text-stone-500'}`}>
                              {formatCurrency(displayRevenue)}
                          </span>
                          <span className="text-[10px] text-stone-400">{isEnded ? '확정 (Actual)' : '예상 (Plan)'}</span>
                      </div>
                  </td>

                  {/* Profit */}
                  <td className="px-6 py-4 text-right">
                       <span className={`text-sm font-medium ${isEnded ? (displayProfit >= 0 ? 'text-stone-900 font-bold' : 'text-red-600 font-bold') : (displayProfit >= 0 ? 'text-stone-500' : 'text-red-400')}`}>
                          {formatCurrency(displayProfit)}
                       </span>
                  </td>

                  {/* Margin */}
                  <td className="px-6 py-4 text-right">
                       <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${displayMargin >= 20 ? 'text-green-700 bg-green-50' : displayMargin > 0 ? 'text-stone-700 bg-stone-100' : 'text-red-700 bg-red-50'}`}>
                           {displayMargin.toFixed(1)}%
                       </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${getStatusColor(product.status)}`}>
                        {getStatusLabel(product.status)}
                        </span>
                        {product.isSeasonEnded && (
                            <span className="text-[10px] text-stone-500 font-semibold bg-stone-100 px-1.5 rounded">시즌마감</span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {hasPermission && (
                        <>
                          {product.isSeasonEnded ? (
                              <button 
                                onClick={() => handleCancelEndSeason(product)}
                                className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                                title="시즌 마감 취소"
                              >
                                <RotateCcw size={16} />
                              </button>
                          ) : (
                              <button 
                                onClick={() => openEndSeasonModal(product)}
                                className="p-1.5 text-stone-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                title="시즌 마감 / 실적 입력"
                              >
                                <Archive size={16} />
                              </button>
                          )}
                          <button 
                            onClick={() => openClearanceModal(product)}
                            className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="소진 계획 시뮬레이션"
                          >
                            <Calculator size={16} />
                          </button>
                          <div className="w-px h-4 bg-stone-200 mx-1"></div>
                        </>
                      )}
                      
                      <button 
                        onClick={() => onEditProduct(product.id)}
                        className={`p-1.5 rounded-md transition-colors ${hasPermission ? 'text-stone-400 hover:text-stone-900 hover:bg-stone-200' : 'text-stone-300 cursor-not-allowed'}`}
                        title={hasPermission ? "수정" : "수정 권한 없음"}
                        disabled={!hasPermission}
                      >
                        <Edit size={16} />
                      </button>
                      
                      {hasPermission && (
                        <button 
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
              
              {filteredAndSortedProducts.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-stone-500">
                    등록된 상품이 없습니다. 새로운 상품을 등록해주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Popup Modal (Borderless) */}
      {viewingProduct && (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setViewingProduct(null)}
        >
            <div 
                className="bg-white w-full max-w-5xl h-[80vh] flex rounded-xl overflow-hidden shadow-2xl border-0"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left: Image */}
                <div className="w-1/2 h-full bg-stone-100 flex items-center justify-center relative">
                    {viewingProduct.designImage ? (
                        <img src={viewingProduct.designImage} alt={viewingProduct.itemName} className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-stone-300 flex flex-col items-center">
                            <Maximize2 size={48} />
                            <span className="mt-2 text-sm">이미지 없음</span>
                        </div>
                    )}
                </div>
                
                {/* Right: Info */}
                <div className="w-1/2 h-full p-10 overflow-y-auto bg-white relative flex flex-col">
                    <button 
                        onClick={() => setViewingProduct(null)}
                        className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(viewingProduct.status)}`}>
                                {getStatusLabel(viewingProduct.status)}
                            </span>
                            <span className="text-xs font-medium text-stone-500">{viewingProduct.season}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-stone-900 mb-1">{viewingProduct.itemName}</h2>
                        <p className="text-sm text-stone-500 mb-6">{viewingProduct.sku}</p>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-stone-50 p-4 rounded-lg">
                                    <p className="text-xs text-stone-500 uppercase font-semibold mb-1">기획 수량</p>
                                    <p className="text-xl font-bold text-stone-900">{viewingProduct.planQty.toLocaleString()} <span className="text-xs font-normal text-stone-500">개</span></p>
                                </div>
                                <div className="bg-stone-50 p-4 rounded-lg">
                                    <p className="text-xs text-stone-500 uppercase font-semibold mb-1">목표 소진율</p>
                                    <p className="text-xl font-bold text-stone-900">{viewingProduct.targetSellThrough}%</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-stone-900 mb-3 text-sm flex items-center gap-2">
                                    <Scissors size={16} /> SKU 내역
                                </h3>
                                <div className="bg-stone-50 rounded-lg border border-stone-100 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-stone-100 text-xs text-stone-500">
                                            <tr>
                                                <th className="px-4 py-2">컬러</th>
                                                <th className="px-4 py-2">사이즈</th>
                                                <th className="px-4 py-2 text-right">수량</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {viewingProduct.skuBreakdown?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2">{item.color}</td>
                                                    <td className="px-4 py-2">{item.size}</td>
                                                    <td className="px-4 py-2 text-right font-mono">{item.qty}</td>
                                                </tr>
                                            ))}
                                            {(!viewingProduct.skuBreakdown || viewingProduct.skuBreakdown.length === 0) && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 text-center text-stone-400 text-xs">SKU 정보가 없습니다.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 text-sm border-t border-stone-100 pt-6">
                                <div>
                                    <p className="text-xs text-stone-400 uppercase mb-1">판매가</p>
                                    <p className="font-medium text-stone-900">₩{viewingProduct.retailPrice.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-400 uppercase mb-1">원가</p>
                                    <p className="font-medium text-stone-900">₩{viewingProduct.costPrice.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-400 uppercase mb-1">발주처</p>
                                    <p className="font-medium text-stone-900">{viewingProduct.supplier || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-400 uppercase mb-1">공장</p>
                                    <p className="font-medium text-stone-900">{viewingProduct.factory || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-auto pt-6 text-xs text-stone-400 flex justify-between items-end">
                        <div>
                            <p>작성자: {viewingProduct.author}</p>
                            <p>부서: {viewingProduct.department}</p>
                        </div>
                        {/* Buttons for Popup */}
                        <div className="flex gap-2">
                             {viewingProduct.planFileUrl && (
                                <button 
                                    onClick={() => window.open(viewingProduct.planFileUrl!, '_blank')}
                                    className="bg-stone-900 text-white px-3 py-2 rounded-md hover:bg-stone-800 transition-colors flex items-center gap-1"
                                >
                                    <FileText size={14} /> 기획안 확인
                                </button>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* End Season Modal */}
      {isEndSeasonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border border-stone-200">
                <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <Archive size={20} /> 시즌 마감 처리
                </h3>
                <p className="text-sm text-stone-600 mb-6">
                    '{selectedProduct?.itemName}'의 최종 판매 실적을 입력하여 시즌을 마감합니다.
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase block mb-2">총 기획 수량</label>
                        <div className="w-full px-4 py-3 bg-stone-100 rounded-lg font-mono text-stone-700">
                            {selectedProduct?.planQty.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase block mb-2">실판매 수량 입력</label>
                        <input 
                            type="number" 
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                            value={actualSoldQty}
                            onChange={(e) => setActualSoldQty(parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button 
                        onClick={() => setIsEndSeasonModalOpen(false)}
                        className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 text-sm font-medium"
                    >
                        취소
                    </button>
                    <button 
                        onClick={handleEndSeason}
                        className="px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-sm font-medium"
                    >
                        마감 확정
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Clearance Simulator Modal */}
      {isClearanceModalOpen && selectedProduct && (
          <ClearanceSimulator 
            product={selectedProduct} 
            onClose={() => setIsClearanceModalOpen(false)} 
          />
      )}
    </div>
  );
};

const ClearanceSimulator: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
    const [additionalDiscount, setAdditionalDiscount] = useState(0);
    const remainingQty = product.planQty - (product.actualSoldQty || 0);
    
    // Simple daily sales estimation (Assuming 1% of remaining stock sells per day initially, increasing with discount)
    const estimatedDailySalesBase = Math.max(remainingQty * 0.01, 1);
    const discountImpact = 1 + (additionalDiscount / 100) * 2; // Discount accelerates sales
    const estimatedDailySales = estimatedDailySalesBase * discountImpact;
    const daysToClear = Math.ceil(remainingQty / estimatedDailySales);

    // Financial Impact
    const alreadyGeneratedRevenue = (product.actualSoldQty || 0) * product.retailPrice; // Assuming full price for sold items for simplicity or need actual avg price field
    const clearancePrice = product.retailPrice * (1 - additionalDiscount / 100);
    const projectedClearanceRevenue = remainingQty * clearancePrice;
    const totalProjectedRevenue = alreadyGeneratedRevenue + projectedClearanceRevenue;
    
    const totalCost = product.planQty * product.costPrice;
    const projectedProfit = totalProjectedRevenue - totalCost - (product.marketingBudget || 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg border border-stone-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                            <Calculator size={20} /> 소진 계획 시뮬레이터
                        </h3>
                        <p className="text-sm text-stone-500 mt-1">{product.itemName}</p>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={20}/></button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-stone-50 p-3 rounded-lg">
                        <p className="text-xs text-stone-500 uppercase">남은 재고</p>
                        <p className="text-xl font-bold text-stone-900">{remainingQty.toLocaleString()} <span className="text-sm font-normal">개</span></p>
                    </div>
                    <div className="bg-stone-50 p-3 rounded-lg">
                        <p className="text-xs text-stone-500 uppercase">현재 판매가</p>
                        <p className="text-xl font-bold text-stone-900">₩{product.retailPrice.toLocaleString()}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-sm font-semibold text-stone-700 block mb-2">추가 할인율 적용 (%)</label>
                    <div className="flex items-center gap-4">
                        <input 
                            type="range" 
                            min="0" 
                            max="90" 
                            step="5"
                            value={additionalDiscount}
                            onChange={(e) => setAdditionalDiscount(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="font-bold text-blue-600 w-12 text-right">{additionalDiscount}%</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-2 text-right">할인 적용가: <strong>₩{clearancePrice.toLocaleString()}</strong></p>
                </div>

                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-800">예상 소진 소요 기간</span>
                        <span className="font-bold text-blue-900">{daysToClear} 일</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-blue-100">
                        <span className="text-sm text-blue-800">최종 예상 수익 (순이익)</span>
                        <span className={`font-bold ${projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₩{projectedProfit.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};