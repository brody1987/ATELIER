
export type Category = 'Clothing' | 'Shoes' | 'Accessories' | 'GeneralGoods';
export type Status = 'Plan' | 'Sample' | 'Production' | 'Released';
export type OrderType = 'Sample' | 'New' | 'Reorder';

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

export interface SKUBreakdownItem {
  color: string;
  size: string;
  ratio: number; // Percentage (0-100)
  qty: number;   // Calculated quantity
}

export interface Product {
  id: string;
  season: string;       // e.g., "2024 S/S"
  category: Category;
  brand?: string;       // Brand Name
  itemName: string;     
  sku: string;          
  status: Status;
  
  // New Fields
  orderType: OrderType;
  supplier: string; // 발주처 (Vendor)
  factory: string;  // 공장 (Factory)
  comments: Comment[];

  // Author Info
  author?: string;      // 작성자 이름
  department?: string;  // 작성자 부서
  authorUid?: string;   // 작성자 UID (For permissions)

  // Product Plan
  planUrl?: string | null;      // 기획안 외부 URL
  planFileUrl?: string | null;  // 기획안 PDF 파일 URL

  // Planning Data
  planQty: number;      
  costPrice: number;    // Production Cost
  retailPrice: number;  
  targetSellThrough: number; // Percentage 0-100
  marketingBudget?: number; // Target Ad Spend
  
  // Sales Data
  salesStartDate?: string; // YYYY-MM-DD
  salesEndDate?: string;   // YYYY-MM-DD
  actualSoldQty?: number;  // 실판매 수량 (시즌 마감 시 입력)
  isSeasonEnded?: boolean; // 시즌 마감 여부

  // SKU Breakdown
  colorList?: string; // e.g. "Black, White"
  sizeList?: string;  // e.g. "S, M, L"
  skuBreakdown?: SKUBreakdownItem[];

  // Assets (URLs)
  designImage: string | null;  // Work Sheet (작업지시서)
  material?: string;          // 소재 (Text)
  
  // Trims (Images)
  trimImage: string | null;     // Other Trims (기타 부자재)
  packageImage?: string | null; // Package (패키지)
  tagImage?: string | null;     // Tag (택)
  
  // Computed (handled dynamically but defined for type safety if needed)
  totalCost?: number;    
  totalSalesGoal?: number; 
}

export interface KPIStats {
  totalBudget: number;
  targetRevenue: number;
  avgMargin: number;
  totalSKU: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface UserProfile {
  name: string;
  department: string;
}

// New User Types for RBAC
export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'banned';

export interface UserAccount {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  department?: string; // Persisted in Firebase
  name?: string;       // Persisted in Firebase (Custom Name)
}
