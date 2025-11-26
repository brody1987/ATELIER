import React, { useState, useEffect, useRef } from 'react';
import { Product, Comment, SKUBreakdownItem, UserAccount } from '../types.ts';
import { ArrowLeft, Save, Upload, Scissors, MessageSquare, Send, Clock, Calculator, Percent, FileText, Tag, Package, RefreshCw, ChevronUp, ChevronDown, Calendar, Link as LinkIcon, FileType, Lock } from 'lucide-react';

interface ProductDetailProps {
  product?: Product;
  currentUser: UserAccount;
  onSave: (product: Product, designFile?: File, trimFile?: File, packageFile?: File, tagFile?: File, planFile?: File) => void;
  onCancel: () => void;
  isLoading?: boolean;
  brands: string[];
  generateNextSku: (brand: string) => Promise<string>;
}

const EmptyProduct: Product = {
  id: '',
  itemName: '',
  sku: '',
  season: '', 
  category: 'Clothing',
  brand: '',
  status: 'Plan',
  orderType: 'New',
  supplier: '',
  factory: '',
  material: '',
  comments: [],
  planQty: 100,
  costPrice: 0,
  retailPrice: 0,
  targetSellThrough: 70,
  marketingBudget: 0,
  salesStartDate: '',
  salesEndDate: '',
  designImage: null,
  trimImage: null,
  packageImage: null,
  tagImage: null,
  colorList: '',
  sizeList: '',
  skuBreakdown: [],
  author: '',
  department: '',
  planUrl: '',
  planFileUrl: null,
  authorUid: ''
};

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, currentUser, onSave, onCancel, isLoading, brands, generateNextSku }) => {
  const [formData, setFormData] = useState<Product>(() => {
    if (product) return product;
    
    // Prepopulate for new product from persistent user profile
    return { 
        ...EmptyProduct, 
        id: crypto.randomUUID(), 
        season: `${new Date().getFullYear()} S/S`, 
        authorUid: currentUser.uid,
        author: currentUser.name || currentUser.displayName || '',
        department: currentUser.department || ''
    };
  });
  
  const [isSkuLoading, setIsSkuLoading] = useState(false);
  
  // Permission Check
  const canEdit = product ? (currentUser.role === 'admin' || currentUser.uid === product.authorUid) : true;

  // File States
  const [designFile, setDesignFile] = useState<File | undefined>(undefined);
  const [trimFile, setTrimFile] = useState<File | undefined>(undefined);
  const [packageFile, setPackageFile] = useState<File | undefined>(undefined);
  const [tagFile, setTagFile] = useState<File | undefined>(undefined);
  const [planFile, setPlanFile] = useState<File | undefined>(undefined);

  const [newComment, setNewComment] = useState('');
  const [adSpendRate, setAdSpendRate] = useState<string>(''); 
  const [planOption, setPlanOption] = useState<'file' | 'url'>('file');
  
  // Refs
  const designInputRef = useRef<HTMLInputElement>(null);
  const trimInputRef = useRef<HTMLInputElement>(null);
  const packageInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const planInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
      if (product.planUrl) setPlanOption('url');
      else if (product.planFileUrl) setPlanOption('file');
    }
  }, [product]);

  useEffect(() => {
    if (commentsEndRef.current) {
        commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [formData.comments]);

  useEffect(() => {
    const rate = parseFloat(adSpendRate);
    if (!isNaN(rate) && rate >= 0) {
      const totalRetailValue = formData.planQty * formData.retailPrice;
      const expectedRevenue = totalRetailValue * (formData.targetSellThrough / 100);
      const calculatedBudget = Math.round(expectedRevenue * (rate / 100));
      setFormData(prev => ({ ...prev, marketingBudget: calculatedBudget }));
    }
  }, [adSpendRate, formData.planQty, formData.retailPrice, formData.targetSellThrough]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!canEdit) return;
    const { name, value } = e.target;
    
    // If Brand Changes, trigger SKU generation for NEW products only
    if (name === 'brand' && !product && value) {
        setIsSkuLoading(true);
        generateNextSku(value).then(newSku => {
            setFormData(prev => ({ ...prev, brand: value, sku: newSku }));
            setIsSkuLoading(false);
        });
    } else {
        setFormData(prev => ({
        ...prev,
        [name]: ['planQty', 'costPrice', 'retailPrice', 'targetSellThrough', 'marketingBudget'].includes(name) 
            ? parseFloat(value) || 0 
            : value
        }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'designImage' | 'trimImage' | 'packageImage' | 'tagImage') => {
    if (!canEdit) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      
      if (field === 'designImage') setDesignFile(file);
      else if (field === 'trimImage') setTrimFile(file);
      else if (field === 'packageImage') setPackageFile(file);
      else if (field === 'tagImage') setTagFile(file);

      setFormData(prev => ({ ...prev, [field]: url }));
    }
  };

  const handlePlanFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canEdit) return;
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          if (file.type !== 'application/pdf') {
              alert('PDF 파일만 업로드 가능합니다.');
              e.target.value = '';
              return;
          }
          if (file.size > 30 * 1024 * 1024) { // 30MB
              alert('파일 크기는 30MB 미만이어야 합니다.');
              e.target.value = '';
              return;
          }

          setPlanFile(file);
      }
  };

  const handleAddComment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;

      const comment: Comment = {
          id: crypto.randomUUID(),
          text: newComment,
          createdAt: new Date().toISOString(),
          author: currentUser.name || currentUser.displayName || 'Unknown'
      };

      setFormData(prev => ({
          ...prev,
          comments: [...(prev.comments || []), comment]
      }));
      setNewComment('');
  };

  const seasonOptions = React.useMemo(() => {
      const currentYear = new Date().getFullYear();
      const options = [];
      for (let i = 0; i < 3; i++) {
          const year = currentYear + i;
          options.push(`${year} S/S`);
          options.push(`${year} F/W`);
      }
      return options;
  }, []);

  const handleGenerateBreakdown = () => {
    if (!canEdit) return;
    const colors = formData.colorList?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const sizes = formData.sizeList?.split(',').map(s => s.trim()).filter(Boolean) || [];
    
    if (colors.length === 0 || sizes.length === 0) return;

    const totalCombos = colors.length * sizes.length;
    const baseRatio = Math.floor(100 / totalCombos);
    let remainder = 100 % totalCombos;

    const newBreakdown: SKUBreakdownItem[] = [];

    colors.forEach(color => {
      sizes.forEach(size => {
        let ratio = baseRatio;
        if (remainder > 0) {
          ratio += 1;
          remainder -= 1;
        }
        const qty = Math.round(formData.planQty * (ratio / 100));
        newBreakdown.push({ color, size, ratio, qty });
      });
    });

    setFormData(prev => ({ ...prev, skuBreakdown: newBreakdown }));
  };

  const handleAdjustRatio = (index: number, change: number) => {
    if (!canEdit) return;
    setFormData(prev => {
      const newBreakdown = [...(prev.skuBreakdown || [])];
      const item = { ...newBreakdown[index] };
      
      let newRatio = item.ratio + change;
      if (newRatio < 0) newRatio = 0;
      if (newRatio > 100) newRatio = 100;
      
      item.ratio = newRatio;
      item.qty = Math.round(prev.planQty * (newRatio / 100));
      
      newBreakdown[index] = item;
      return { ...prev, skuBreakdown: newBreakdown };
    });
  };

  const totalBreakdownQty = formData.skuBreakdown?.reduce((sum, item) => sum + item.qty, 0) || 0;
  const totalBreakdownRatio = formData.skuBreakdown?.reduce((sum, item) => sum + item.ratio, 0) || 0;

  const totalProductionCost = formData.planQty * formData.costPrice; 
  const totalRetailValue = formData.planQty * formData.retailPrice; 
  const expectedRevenue = totalRetailValue * (formData.targetSellThrough / 100); 
  const grossProfit = expectedRevenue - totalProductionCost;
  const marketingBudget = formData.marketingBudget || 0;
  const netProfit = grossProfit - marketingBudget;
  const profitMargin = expectedRevenue > 0 ? (netProfit / expectedRevenue) * 100 : 0;

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-2 bg-white border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              {product ? '작업지시서' : '신규 상품 기획'}
              {!canEdit && <span className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded flex items-center gap-1"><Lock size={12}/> 읽기 전용</span>}
            </h1>
            <p className="text-sm text-stone-500">
              {product ? `SKU: ${product.sku}` : '새로운 상품 기획안을 작성합니다.'}
            </p>
          </div>
        </div>
        {canEdit && (
          <button 
            onClick={() => onSave(formData, designFile, trimFile, packageFile, tagFile, planFile)}
            disabled={isLoading}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {isLoading ? '저장 중...' : '저장하기'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Visual Assets */}
        <div className="lg:col-span-1 space-y-6">
          {/* Work Sheet (Landscape) */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <FileText size={18} /> 작업지시서 (Work Sheet)
            </h3>
            <div 
              className={`aspect-video rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center relative overflow-hidden group ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={() => canEdit && designInputRef.current?.click()}
            >
              {formData.designImage ? (
                <>
                  <img src={formData.designImage} alt="Work Sheet" className="w-full h-full object-cover" />
                  {canEdit && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <p className="text-white font-medium flex items-center gap-2"><Upload size={18} /> 변경</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-500">
                    <Upload size={20} />
                  </div>
                  <p className="text-sm font-medium text-stone-600">작업지시서 업로드</p>
                  <p className="text-xs text-stone-400 mt-1">가로형 이미지 권장</p>
                </div>
              )}
              <input 
                type="file" 
                ref={designInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'designImage')}
                disabled={!canEdit}
              />
            </div>
          </div>

          {/* Materials Input */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <Scissors size={18} /> 소재 (Material)
            </h3>
            <textarea
                name="material"
                value={formData.material || ''}
                onChange={handleChange}
                readOnly={!canEdit}
                placeholder="소재 혼용률 및 특징을 입력하세요 (예: Cotton 100%, 20수, 바이오 워싱)"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 min-h-[100px] text-sm read-only:opacity-70"
            />
          </div>

          {/* Product Plan Upload */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <FileType size={18} /> 상품 기획안 (Plan Document)
            </h3>
            
            {canEdit && (
                <div className="flex gap-2 mb-4 text-sm">
                    <button 
                        onClick={() => setPlanOption('file')}
                        className={`flex-1 py-2 rounded-lg border transition-all ${planOption === 'file' ? 'bg-stone-100 border-stone-300 text-stone-900 font-medium' : 'border-transparent hover:bg-stone-50 text-stone-500'}`}
                    >
                        파일 업로드 (PDF)
                    </button>
                    <button 
                        onClick={() => setPlanOption('url')}
                        className={`flex-1 py-2 rounded-lg border transition-all ${planOption === 'url' ? 'bg-stone-100 border-stone-300 text-stone-900 font-medium' : 'border-transparent hover:bg-stone-50 text-stone-500'}`}
                    >
                        URL 입력
                    </button>
                </div>
            )}

            {planOption === 'file' ? (
                <div 
                    className={`p-4 border-2 border-dashed border-stone-200 rounded-lg bg-stone-50 text-center ${canEdit ? 'cursor-pointer hover:bg-stone-100' : ''} transition-colors`}
                    onClick={() => canEdit && planInputRef.current?.click()}
                >
                    {planFile || formData.planFileUrl ? (
                        <div className="flex flex-col items-center">
                            <FileType size={32} className="text-red-500 mb-2" />
                            <p className="text-sm font-medium text-stone-700">
                                {planFile ? planFile.name : '기획안 PDF 파일 등록됨'}
                            </p>
                            {canEdit && <p className="text-xs text-stone-400 mt-1">클릭하여 변경 (PDF, 30MB 미만)</p>}
                            {!canEdit && formData.planFileUrl && (
                                <a href={formData.planFileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-2">다운로드/보기</a>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Upload size={24} className="text-stone-400 mb-2" />
                            <p className="text-sm text-stone-500">기획안 PDF 파일 업로드</p>
                            <p className="text-[10px] text-stone-400 mt-1">30MB 미만 제한</p>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={planInputRef} 
                        className="hidden" 
                        accept="application/pdf"
                        onChange={handlePlanFileUpload}
                        disabled={!canEdit}
                    />
                </div>
            ) : (
                <div className="relative">
                    <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                        type="url"
                        name="planUrl"
                        value={formData.planUrl || ''}
                        onChange={handleChange}
                        readOnly={!canEdit}
                        placeholder="https://..."
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 text-sm read-only:opacity-70"
                    />
                </div>
            )}
          </div>

          {/* Trims Grid */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <Package size={18} /> 부자재 및 디테일
            </h3>
            <div className="grid grid-cols-3 gap-3">
                {/* Package */}
                <div 
                    className={`aspect-square rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center relative overflow-hidden group ${canEdit ? 'cursor-pointer hover:border-stone-400' : ''} transition-colors`}
                    onClick={() => canEdit && packageInputRef.current?.click()}
                >
                    {formData.packageImage ? (
                        <img src={formData.packageImage} alt="Package" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center">
                            <Package size={16} className="mx-auto text-stone-400 mb-1"/>
                            <span className="text-[10px] text-stone-500 font-medium">패키지</span>
                        </div>
                    )}
                     <input 
                        type="file" 
                        ref={packageInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'packageImage')}
                        disabled={!canEdit}
                    />
                </div>

                {/* Tag */}
                 <div 
                    className={`aspect-square rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center relative overflow-hidden group ${canEdit ? 'cursor-pointer hover:border-stone-400' : ''} transition-colors`}
                    onClick={() => canEdit && tagInputRef.current?.click()}
                >
                    {formData.tagImage ? (
                        <img src={formData.tagImage} alt="Tag" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center">
                            <Tag size={16} className="mx-auto text-stone-400 mb-1"/>
                            <span className="text-[10px] text-stone-500 font-medium">택 (Tag)</span>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={tagInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'tagImage')}
                        disabled={!canEdit}
                    />
                </div>

                {/* Other Trims */}
                 <div 
                    className={`aspect-square rounded-lg border-2 border-dashed border-stone-200 bg-stone-50 flex flex-col items-center justify-center relative overflow-hidden group ${canEdit ? 'cursor-pointer hover:border-stone-400' : ''} transition-colors`}
                    onClick={() => canEdit && trimInputRef.current?.click()}
                >
                    {formData.trimImage ? (
                        <img src={formData.trimImage} alt="Trim" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center">
                            <Scissors size={16} className="mx-auto text-stone-400 mb-1"/>
                            <span className="text-[10px] text-stone-500 font-medium">기타</span>
                        </div>
                    )}
                     <input 
                        type="file" 
                        ref={trimInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'trimImage')}
                        disabled={!canEdit}
                    />
                </div>
            </div>
            {canEdit && <p className="text-[10px] text-stone-400 mt-2 text-center">클릭하여 이미지 업로드/변경</p>}
          </div>
        </div>

        {/* Right Column: Spec & Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex justify-between items-start mb-6 pb-2 border-b border-stone-100">
                <h3 className="font-bold text-lg text-stone-900">상품 상세 정보 (Product Specifications)</h3>
                {formData.author && (
                    <div className="text-right">
                        <p className="text-xs text-stone-400">작성자</p>
                        <p className="text-sm font-medium text-stone-700">{formData.author} {formData.department ? `(${formData.department})` : ''}</p>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">상품명</label>
                <input 
                  type="text" 
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  readOnly={!canEdit}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 read-only:opacity-70"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">SKU (품번) - 자동생성</label>
                <div className="relative">
                    <input 
                    type="text" 
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    readOnly
                    placeholder="브랜드 선택 시 자동 생성"
                    className="w-full px-4 py-2 bg-stone-100 border border-stone-200 rounded-lg focus:outline-none text-stone-600 cursor-not-allowed"
                    />
                    {isSkuLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-stone-400 border-t-stone-900 rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">시즌</label>
                <select 
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 disabled:opacity-70"
                >
                  {seasonOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">카테고리</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 disabled:opacity-70"
                >
                  <option value="Clothing">의류</option>
                  <option value="Shoes">신발</option>
                  <option value="Accessories">액세서리</option>
                  <option value="GeneralGoods">잡화</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-stone-100">
               <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">브랜드 (Brand)</label>
                <select 
                  name="brand"
                  value={formData.brand || ''}
                  onChange={handleChange}
                  disabled={!canEdit || !!product} // Disable brand change for existing products to protect SKU
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 disabled:opacity-70"
                >
                  <option value="">브랜드 선택</option>
                  {brands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
               <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">주문 유형</label>
                <select 
                  name="orderType"
                  value={formData.orderType}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 disabled:opacity-70"
                >
                  <option value="Sample">샘플 오더</option>
                  <option value="New">신규 오더</option>
                  <option value="Reorder">리오더</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">발주처 (Vendor)</label>
                 <input 
                  type="text" 
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  readOnly={!canEdit}
                  placeholder="발주처 입력"
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 read-only:opacity-70"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">공장 (Factory)</label>
                 <input 
                  type="text" 
                  name="factory"
                  value={formData.factory || ''}
                  onChange={handleChange}
                  readOnly={!canEdit}
                  placeholder="공장명 입력"
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 read-only:opacity-70"
                />
              </div>
               <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">진행 상태</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 disabled:opacity-70"
                >
                  <option value="Plan">기획</option>
                  <option value="Sample">샘플</option>
                  <option value="Production">생산</option>
                  <option value="Released">출시</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sales Period */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
             <h3 className="font-bold text-lg text-stone-900 mb-6 pb-2 border-b border-stone-100 flex items-center gap-2">
               <Calendar size={20}/>
               판매 기간 설정 (Sales Period)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-stone-500 uppercase">판매 시작일 (Start)</label>
                    <input 
                        type="date" 
                        name="salesStartDate"
                        value={formData.salesStartDate || ''}
                        onChange={handleChange}
                        readOnly={!canEdit}
                        className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 read-only:opacity-70"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-stone-500 uppercase">판매 종료일 (End)</label>
                    <input 
                        type="date" 
                        name="salesEndDate"
                        value={formData.salesEndDate || ''}
                        onChange={handleChange}
                        readOnly={!canEdit}
                        className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 read-only:opacity-70"
                    />
                </div>
            </div>
          </div>

          {/* Costing & Planning */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="font-bold text-lg text-stone-900 mb-6 pb-2 border-b border-stone-100 flex items-center gap-2">
               <Calculator size={20}/>
               원가 및 수익성 분석 (Profitability Analysis)
            </h3>
            
            {/* Input Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
               <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">기획 수량 (Total)</label>
                <input 
                  type="number" 
                  name="planQty"
                  value={formData.planQty}
                  onChange={handleChange}
                  readOnly={!canEdit}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/10 read-only:opacity-70"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">생산 단가 (원)</label>
                <input 
                  type="number" 
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange}
                  readOnly={!canEdit}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/10 read-only:opacity-70"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">판매가 (원)</label>
                <input 
                  type="number" 
                  name="retailPrice"
                  value={formData.retailPrice}
                  onChange={handleChange}
                  readOnly={!canEdit}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/10 read-only:opacity-70"
                />
              </div>
               <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-500 uppercase">목표 광고비 (원)</label>
                <div className="flex gap-2">
                    <div className="relative w-20 flex-shrink-0">
                        <input 
                            type="number"
                            value={adSpendRate}
                            onChange={(e) => setAdSpendRate(e.target.value)}
                            readOnly={!canEdit}
                            placeholder="%"
                            className="w-full pl-2 pr-6 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/10 text-right text-xs read-only:opacity-70"
                        />
                         <Percent size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400" />
                    </div>
                    <input 
                    type="number" 
                    name="marketingBudget"
                    value={formData.marketingBudget}
                    onChange={(e) => {
                        setAdSpendRate(''); // Clear rate if manual amount entry
                        handleChange(e);
                    }}
                    readOnly={!canEdit}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/10 read-only:opacity-70"
                    />
                </div>
              </div>
            </div>

            {/* SKU Breakdown Setup */}
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 mb-6">
              <label className="text-xs font-semibold text-stone-600 uppercase mb-3 block">SKU 자동 생성 및 수량 배분</label>
              <div className="flex flex-col md:flex-row gap-3 mb-3">
                 <input 
                    type="text" 
                    name="colorList"
                    value={formData.colorList || ''}
                    onChange={handleChange}
                    readOnly={!canEdit}
                    placeholder="컬러 입력 (예: Black, White, Navy)"
                    className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 read-only:opacity-70"
                  />
                  <input 
                    type="text" 
                    name="sizeList"
                    value={formData.sizeList || ''}
                    onChange={handleChange}
                    readOnly={!canEdit}
                    placeholder="사이즈 입력 (예: S, M, L)"
                    className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 read-only:opacity-70"
                  />
                  {canEdit && (
                    <button 
                        onClick={handleGenerateBreakdown}
                        className="flex items-center gap-1 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <RefreshCw size={14} /> 생성
                    </button>
                  )}
              </div>

              {/* SKU Table */}
              {formData.skuBreakdown && formData.skuBreakdown.length > 0 && (
                <div className="overflow-x-auto bg-white rounded-lg border border-stone-200">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-stone-500 uppercase bg-stone-50 border-b border-stone-100">
                      <tr>
                        <th className="px-4 py-2">컬러</th>
                        <th className="px-4 py-2">사이즈</th>
                        <th className="px-4 py-2 text-center">비중 (%)</th>
                        <th className="px-4 py-2 text-right">수량</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.skuBreakdown.map((item, index) => (
                        <tr key={`${item.color}-${item.size}`} className="border-b border-stone-50 last:border-0">
                          <td className="px-4 py-2 font-medium">{item.color}</td>
                          <td className="px-4 py-2 text-stone-500">{item.size}</td>
                          <td className="px-4 py-2">
                             <div className="flex items-center justify-center gap-2">
                                {canEdit && <button onClick={() => handleAdjustRatio(index, -1)} className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700"><ChevronDown size={14}/></button>}
                                <span className="w-8 text-center font-mono">{item.ratio}%</span>
                                {canEdit && <button onClick={() => handleAdjustRatio(index, 1)} className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700"><ChevronUp size={14}/></button>}
                             </div>
                          </td>
                          <td className="px-4 py-2 text-right font-mono">{item.qty}</td>
                        </tr>
                      ))}
                      <tr className="bg-stone-50 font-bold text-xs text-stone-700">
                        <td colSpan={2} className="px-4 py-2 text-right">합계</td>
                        <td className={`px-4 py-2 text-center ${totalBreakdownRatio !== 100 ? 'text-red-500' : ''}`}>
                          {totalBreakdownRatio}%
                        </td>
                        <td className={`px-4 py-2 text-right ${totalBreakdownQty !== formData.planQty ? 'text-red-500' : ''}`}>
                          {totalBreakdownQty}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Range Slider */}
            <div className="mb-6 px-1">
               <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-stone-500 uppercase">
                    목표 소진율 설정
                  </label>
                  <span className="text-sm font-bold text-stone-900 bg-gold-100 text-gold-700 px-2 py-0.5 rounded">
                     {formData.targetSellThrough}%
                  </span>
               </div>
               <input 
                type="range" 
                min="0" 
                max="100" 
                name="targetSellThrough"
                value={formData.targetSellThrough}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900 disabled:opacity-70 disabled:cursor-not-allowed"
               />
               <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                 <span>0%</span>
                 <span>50%</span>
                 <span>100% (완판)</span>
               </div>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-stone-50 rounded-xl p-6 border border-stone-100">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                  {/* Row 1 */}
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-semibold mb-1">총 생산 예산 (A)</p>
                    <p className="text-lg font-bold text-stone-600">₩{totalProductionCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-semibold mb-1">예상 매출액 (B)</p>
                    <p className="text-lg font-bold text-stone-900">₩{expectedRevenue.toLocaleString()}</p>
                    <p className="text-[10px] text-stone-400 mt-1">소진율 {formData.targetSellThrough}% 기준</p>
                  </div>
                  
                  {/* Row 2 */}
                  <div>
                     <p className="text-[10px] text-stone-400 uppercase font-semibold mb-1">기본 마진 (B-A)</p>
                     <p className={`text-lg font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₩{grossProfit.toLocaleString()}
                     </p>
                  </div>
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                       <p className="text-[10px] text-stone-400 uppercase font-semibold">최종 예상 수익 (순이익)</p>
                     </div>
                     <p className={`text-xl font-black ${netProfit >= 0 ? 'text-stone-900' : 'text-red-600'}`}>
                        ₩{netProfit.toLocaleString()}
                     </p>
                     <p className={`text-xs font-medium mt-1 ${profitMargin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        수익률 {profitMargin.toFixed(1)}%
                     </p>
                  </div>
               </div>
            </div>
          </div>

          {/* Comments Section */}
           <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="font-bold text-lg text-stone-900 mb-6 pb-2 border-b border-stone-100 flex items-center gap-2">
                <MessageSquare size={20} />
                코멘트 / 히스토리
            </h3>
            
            <div className="max-h-60 overflow-y-auto mb-4 space-y-4 pr-2">
                {(!formData.comments || formData.comments.length === 0) && (
                    <p className="text-sm text-stone-400 text-center py-4">등록된 코멘트가 없습니다.</p>
                )}
                {formData.comments?.map((comment) => (
                    <div key={comment.id} className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-sm text-stone-900">{comment.author}</span>
                            <span className="text-xs text-stone-400 flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(comment.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-sm text-stone-700 whitespace-pre-wrap">{comment.text}</p>
                    </div>
                ))}
                <div ref={commentsEndRef} />
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
                <input 
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="작업 관련 코멘트를 입력하세요..."
                    className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 text-sm"
                />
                <button 
                    type="submit"
                    disabled={!newComment.trim()}
                    className="p-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={18} />
                </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};