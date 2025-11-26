
import React, { useMemo } from 'react';
import { Product } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, Line, LineChart
} from 'recharts';
import { TrendingUp, DollarSign, Package, PieChart as PieChartIcon, Calendar, UserCircle } from 'lucide-react';

interface DashboardProps {
  products: Product[];
}

const COLORS = ['#1c1917', '#d4a373', '#a8a29e', '#e7e5e4'];

export const Dashboard: React.FC<DashboardProps> = ({ products }) => {
  
  // KPI Calculations
  const stats = useMemo(() => {
    let totalBudget = 0;
    let targetRevenue = 0;
    let totalPlanMarginSum = 0;
    let totalActualMarginSum = 0;
    let actualProductsCount = 0;
    
    products.forEach(p => {
      const cost = p.costPrice * p.planQty;
      const rev = p.retailPrice * p.planQty * (p.targetSellThrough / 100);
      totalBudget += cost;
      targetRevenue += rev;
      
      // Plan Margin (Based on Expected Profit)
      const planProfit = rev - cost - (p.marketingBudget || 0);
      const planMargin = rev > 0 ? (planProfit / rev) * 100 : 0;
      totalPlanMarginSum += planMargin;

      // Actual Margin (Only for ended products)
      if (p.isSeasonEnded && p.actualSoldQty !== undefined) {
          const actualRev = p.retailPrice * p.actualSoldQty;
          const actualCost = p.costPrice * p.planQty; // Production cost is fixed based on plan
          const actualProfit = actualRev - actualCost - (p.marketingBudget || 0);
          const actualMargin = actualRev > 0 ? (actualProfit / actualRev) * 100 : 0;
          totalActualMarginSum += actualMargin;
          actualProductsCount++;
      }
    });

    const avgPlanMargin = products.length > 0 ? (totalPlanMarginSum / products.length) : 0;
    const avgActualMargin = actualProductsCount > 0 ? (totalActualMarginSum / actualProductsCount) : 0;

    return {
      totalBudget,
      targetRevenue,
      avgPlanMargin,
      avgActualMargin,
      totalSKU: products.length
    };
  }, [products]);

  // Chart Data Preparation
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    const labelMap: Record<string, string> = {
      'Clothing': '의류',
      'Shoes': '신발',
      'Accessories': '액세서리',
      'GeneralGoods': '잡화'
    };

    products.forEach(p => {
      const label = labelMap[p.category] || p.category;
      counts[label] = (counts[label] || 0) + p.planQty;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    }));
  }, [products]);

  const financialData = useMemo(() => {
    const seasons: Record<string, { name: string; 예산: number; 매출: number }> = {};
    products.forEach(p => {
      if (!seasons[p.season]) {
        seasons[p.season] = { name: p.season, 예산: 0, 매출: 0 };
      }
      seasons[p.season].예산 += (p.costPrice * p.planQty);
      seasons[p.season].매출 += (p.retailPrice * p.planQty * (p.targetSellThrough / 100));
    });
    return Object.values(seasons);
  }, [products]);

  // Author Data with Performance Metrics
  const authorPerformanceData = useMemo(() => {
      const stats: Record<string, { name: string, count: number, revenue: number, profit: number }> = {};
      
      products.forEach(p => {
          const author = p.author || '미지정';
          if (!stats[author]) {
              stats[author] = { name: author, count: 0, revenue: 0, profit: 0 };
          }
          stats[author].count += 1;
          
          if (p.isSeasonEnded && p.actualSoldQty !== undefined) {
              const cost = p.costPrice * p.planQty;
              const marketing = p.marketingBudget || 0;
              const revenue = p.retailPrice * p.actualSoldQty;
              const profit = revenue - cost - marketing;
              
              stats[author].revenue += revenue;
              stats[author].profit += profit;
          }
      });

      return Object.values(stats)
          .map(s => ({
              ...s,
              margin: s.revenue > 0 ? (s.profit / s.revenue) * 100 : 0
          }))
          .sort((a, b) => b.count - a.count);
  }, [products]);

  // Yearly Data (Aggregated)
  const yearlyData = useMemo(() => {
      const years: Record<string, { 
          year: string, 
          revenue: number, 
          cost: number, 
          profit: number, 
          marketing: number, 
          qty: number,
          actualRevenue: number,
          actualProfit: number
      }> = {};

      products.forEach(p => {
          const year = p.season.split(' ')[0]; // Extract "2024" from "2024 S/S"
          if (!years[year]) {
              years[year] = { year, revenue: 0, cost: 0, profit: 0, marketing: 0, qty: 0, actualRevenue: 0, actualProfit: 0 };
          }
          
          // Plan Data
          const totalCost = p.costPrice * p.planQty;
          const totalRevenue = p.retailPrice * p.planQty * (p.targetSellThrough / 100); 
          const marketing = p.marketingBudget || 0;
          const profit = totalRevenue - totalCost - marketing;

          years[year].revenue += totalRevenue;
          years[year].cost += totalCost;
          years[year].marketing += marketing;
          years[year].profit += profit;
          years[year].qty += p.planQty;

          // Actual Data (Only if Season Ended)
          if (p.isSeasonEnded && p.actualSoldQty !== undefined) {
              const actualRev = p.retailPrice * p.actualSoldQty;
              const actualProf = actualRev - totalCost - marketing;
              years[year].actualRevenue += actualRev;
              years[year].actualProfit += actualProf;
          }
      });

      return Object.values(years).sort((a, b) => a.year.localeCompare(b.year)).map(d => ({
          ...d,
          margin: d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0,
          actualMargin: d.actualRevenue > 0 ? (d.actualProfit / d.actualRevenue) * 100 : 0
      }));
  }, [products]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">대시보드</h1>
        <p className="text-stone-500 mt-2">상품 기획 및 재무 목표 현황을 실시간으로 확인하세요.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-stone-500 uppercase">총 생산 예산</span>
            <div className="p-2 bg-stone-50 rounded-lg text-stone-900">
               <DollarSign size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">{formatCurrency(stats.totalBudget)}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-stone-500 uppercase">목표 매출액 (예상)</span>
            <div className="p-2 bg-gold-500/10 rounded-lg text-gold-500">
               <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">{formatCurrency(stats.targetRevenue)}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-stone-500 uppercase">수익률 (예상 / 실제)</span>
            <div className="p-2 bg-stone-50 rounded-lg text-stone-900">
               <PieChartIcon size={18} />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div>
                <span className="text-xs text-stone-400 block">Plan</span>
                <span className="text-xl font-bold text-stone-900">{stats.avgPlanMargin.toFixed(1)}%</span>
            </div>
            <div className="w-px h-8 bg-stone-200 mx-1"></div>
            <div>
                <span className="text-xs text-stone-400 block">Actual</span>
                <span className={`text-xl font-bold ${stats.avgActualMargin >= stats.avgPlanMargin ? 'text-green-600' : 'text-red-500'}`}>
                    {stats.avgActualMargin.toFixed(1)}%
                </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-stone-500 uppercase">총 SKU</span>
            <div className="p-2 bg-stone-50 rounded-lg text-stone-900">
               <Package size={18} />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">{stats.totalSKU}</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost vs Revenue */}
        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
          <h3 className="text-lg font-bold text-stone-900 mb-6">재무 현황 개요 (시즌별 예상)</h3>
          <div style={{ width: '100%', height: 300, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} tickFormatter={(val) => `₩${val/10000}만`} />
                <Tooltip 
                  cursor={{ fill: '#f5f5f4' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                <Bar dataKey="예산" fill="#a8a29e" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="매출" fill="#1c1917" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Mix */}
        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
          <h3 className="text-lg font-bold text-stone-900 mb-6">복종별 기획 물량 (Category Mix)</h3>
          <div style={{ width: '100%', height: 300, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Author & Yearly Revenue/Profit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Author Chart */}
          <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                  <UserCircle className="text-stone-900" size={20} />
                  <h3 className="text-lg font-bold text-stone-900">작성자별 현황</h3>
              </div>
              <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={authorPerformanceData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e7e5e4" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#1c1917', fontSize: 12, fontWeight: 500 }} width={80} />
                        <Tooltip cursor={{ fill: '#f5f5f4' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" name="등록 상품 수" fill="#d4a373" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Yearly Revenue & Profit Chart */}
          <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="text-stone-900" size={20} />
                  <h3 className="text-lg font-bold text-stone-900">연도별 매출 & 수익 추이 (Revenue & Profit)</h3>
              </div>
              <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₩${val/100000000}억`} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            formatter={(val: number) => formatCurrency(val)} 
                        />
                        <Legend />
                        <Bar dataKey="revenue" name="예상 매출" fill="#1c1917" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actualRevenue" name="실제 매출" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" name="예상 수익" fill="#d4a373" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actualProfit" name="실제 수익" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Chart Row 3: Yearly Margin */}
      <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="text-stone-900" size={20} />
              <h3 className="text-lg font-bold text-stone-900">연도별 수익률 추이 (Profit Margin)</h3>
          </div>
          <div style={{ width: '100%', height: 300, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        formatter={(val: number) => `${val.toFixed(1)}%`} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="margin" name="예상 수익률" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="actualMargin" name="실제 수익률" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} strokeDasharray="5 5" />
                </LineChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* Author Performance Detailed Table */}
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
              <UserCircle className="text-stone-900" size={20} />
              <h3 className="text-lg font-bold text-stone-900">작성자별 상세 성과 (Author Metrics)</h3>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-xs">
                      <tr>
                          <th className="px-6 py-4">작성자</th>
                          <th className="px-6 py-4 text-right">등록 상품 수</th>
                          <th className="px-6 py-4 text-right">누적 실제 매출</th>
                          <th className="px-6 py-4 text-right">누적 실제 수익</th>
                          <th className="px-6 py-4 text-right">누적 실제 수익률</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                      {authorPerformanceData.map((data) => (
                          <tr key={data.name} className="hover:bg-stone-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-stone-900">{data.name}</td>
                              <td className="px-6 py-4 text-right font-mono">{data.count}개</td>
                              <td className="px-6 py-4 text-right font-mono text-green-600">{formatCurrency(data.revenue)}</td>
                              <td className={`px-6 py-4 text-right font-mono ${data.profit >= 0 ? 'text-stone-900' : 'text-red-600'}`}>
                                  {formatCurrency(data.profit)}
                              </td>
                              <td className={`px-6 py-4 text-right font-bold ${data.margin > 0 ? 'text-green-600' : 'text-stone-400'}`}>
                                  {data.margin > 0 ? `${data.margin.toFixed(1)}%` : '-'}
                              </td>
                          </tr>
                      ))}
                      {authorPerformanceData.length === 0 && (
                          <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-stone-400">데이터가 없습니다.</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};
