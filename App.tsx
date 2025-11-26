import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProductList } from './components/ProductList';
import { ProductDetail } from './components/ProductDetail';
import { ProductionManagement } from './components/ProductionManagement';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { Product, FirebaseConfig, Status, UserProfile, UserAccount, UserRole } from './types';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, update, get, runTransaction } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';

// Default Config provided by user (Fallback if localStorage is empty)
const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyAV0tZkYe6SiCgxiWLxcQyHAaxy6Kcoxa4",
  authDomain: "ffs-ballop.firebaseapp.com",
  databaseURL: "https://ffs-ballop-default-rtdb.firebaseio.com",
  projectId: "ffs-ballop",
  storageBucket: "ffs-ballop.firebasestorage.app",
  messagingSenderId: "698662908700",
  appId: "1:698662908700:web:0211c906b65943e4c340d9"
};

const DEFAULT_BRANDS = ['밸롭', '웨이든', '부기프리', '파스티야'];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    season: '2024 S/S',
    category: 'Clothing',
    brand: '밸롭',
    itemName: '오버사이즈 린넨 셔츠',
    sku: 'SH-001-LN',
    status: 'Production',
    planQty: 500,
    costPrice: 25000,
    retailPrice: 89000,
    targetSellThrough: 85,
    marketingBudget: 2000000,
    designImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600',
    trimImage: null,
    packageImage: null,
    tagImage: null,
    material: 'Linen 100%, Bio-washed',
    orderType: 'New',
    supplier: '패션트레이딩',
    factory: '동대문 A공장',
    comments: [],
    colorList: 'White, Navy',
    sizeList: 'M, L, XL',
    skuBreakdown: [
      { color: 'White', size: 'M', ratio: 16, qty: 80 },
      { color: 'White', size: 'L', ratio: 17, qty: 85 },
      { color: 'White', size: 'XL', ratio: 17, qty: 85 },
      { color: 'Navy', size: 'M', ratio: 16, qty: 80 },
      { color: 'Navy', size: 'L', ratio: 17, qty: 85 },
      { color: 'Navy', size: 'XL', ratio: 17, qty: 85 },
    ],
    salesStartDate: '2024-03-01',
    salesEndDate: '2024-08-31',
    author: '김민준',
    department: '상품기획 1팀',
    authorUid: 'mock-uid-1'
  },
];

// Route wrapper for editing to extract ID
const ProductDetailRoute: React.FC<{
  products: Product[];
  currentUser: UserAccount;
  onSave: any;
  onCancel: any;
  isLoading: boolean;
  brands: string[];
  generateNextSku: any;
}> = (props) => {
  const { id } = useParams();
  const product = props.products.find(p => p.id === id);
  return <ProductDetail product={product} {...props} />;
}

// Route wrapper for checking profile completion
const RequireProfile = ({ hasProfile, children }: { hasProfile: boolean; children: React.ReactNode }) => {
  if (!hasProfile) {
    // Allow accessing settings even without profile to set it up
    return <Navigate to="/settings" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [firebaseApp, setFirebaseApp] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [storage, setStorage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auth State
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Profile Check - derived
  const hasProfile = !!(userAccount?.name && userAccount?.department);
  
  // Flag to track login intent (Admin vs Normal)
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  // Brands State
  const [brands, setBrands] = useState<string[]>(DEFAULT_BRANDS);

  // Initialize Firebase on Start
  useEffect(() => {
    const initFirebase = () => {
      let config: FirebaseConfig = DEFAULT_FIREBASE_CONFIG;
      const savedConfig = localStorage.getItem('fmp_firebase_config');
      
      if (savedConfig) {
        try {
          config = JSON.parse(savedConfig);
        } catch (e) {
          console.error("Failed to parse saved config, using default");
        }
      } else {
        localStorage.setItem('fmp_firebase_config', JSON.stringify(DEFAULT_FIREBASE_CONFIG));
      }

      if (config.apiKey && config.projectId) {
        try {
          const app = initializeApp(config);
          setFirebaseApp(app);
          setDb(getDatabase(app));
          setStorage(getStorage(app));
          
          // Setup Auth Listener
          const auth = getAuth(app);
          onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              // Sync with User DB
              const db = getDatabase(app);
              const userRef = ref(db, `users/${firebaseUser.uid}`);
              const snapshot = await get(userRef);
              
              let currentUserData: UserAccount;

              if (snapshot.exists()) {
                currentUserData = snapshot.val();
                // Check if banned
                if (currentUserData.status === 'banned') {
                  alert("관리자에 의해 차단된 계정입니다. 로그인이 불가능합니다.");
                  await signOut(auth);
                  setUserAccount(null);
                  setAuthLoading(false);
                  return;
                }
                
                // Safety check: ensure required profile fields are at least empty strings
                if (!currentUserData.name) currentUserData.name = firebaseUser.displayName || '';
                if (!currentUserData.department) currentUserData.department = '';

                // Update last login
                await update(userRef, { lastLogin: new Date().toISOString() });
              } else {
                // Create new user
                currentUserData = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                  role: 'user', // Default role
                  status: 'active',
                  lastLogin: new Date().toISOString(),
                  name: firebaseUser.displayName || '',
                  department: ''
                };
                await set(userRef, currentUserData);
              }

              setUserAccount(currentUserData);
            } else {
              setUserAccount(null);
            }
            setAuthLoading(false);
          });
          
          console.log("Firebase Initialized with:", config.projectId);
        } catch (error) {
          console.error("Firebase Initialization Error:", error);
          setAuthLoading(false);
        }
      } else {
        setAuthLoading(false);
      }
    };

    initFirebase();
  }, []);

  // Effect to Update Role based on Login Intent
  useEffect(() => {
    if (userAccount && pendingRole && db) {
      if (userAccount.role !== pendingRole) {
        const updateRole = async () => {
          try {
            await update(ref(db, `users/${userAccount.uid}`), { role: pendingRole });
            setUserAccount(prev => prev ? { ...prev, role: pendingRole } : null);
          } catch (e) {
            console.error("Failed to update user role", e);
          } finally {
            setPendingRole(null);
          }
        };
        updateRole();
      } else {
        setPendingRole(null);
      }
    }
  }, [userAccount, pendingRole, db]);


  // Sync Products and Brands Data from Firebase
  useEffect(() => {
    if (db && userAccount) {
      const productsRef = ref(db, 'products');
      const unsubscribeProducts = onValue(productsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const productList = Object.keys(data).map(key => ({
            ...data[key],
            id: key 
          }));
          setProducts(productList);
        } else {
            setProducts([]);
        }
      });

      const brandsRef = ref(db, 'settings/brands');
      const unsubscribeBrands = onValue(brandsRef, (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) {
          setBrands(data);
        }
      });

      const userRef = ref(db, `users/${userAccount.uid}`);
      const unsubscribeUser = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            const updatedUser = snapshot.val();
            if (!updatedUser.name) updatedUser.name = updatedUser.displayName || '';
            if (!updatedUser.department) updatedUser.department = '';
            setUserAccount(updatedUser);
        }
      });

      return () => {
        unsubscribeProducts();
        unsubscribeBrands();
        unsubscribeUser();
      };
    }
  }, [db, userAccount?.uid]);

  const handleUpdateBrands = async (newBrands: string[]) => {
    if (db && userAccount?.role === 'admin') {
      try {
        await set(ref(db, 'settings/brands'), newBrands);
      } catch (e) {
        console.error("Failed to update brands", e);
        alert("브랜드 목록 저장에 실패했습니다.");
      }
    } else {
      setBrands(newBrands);
    }
  };
  
  const handleUpdateProfile = async (profile: UserProfile) => {
    if (db && userAccount) {
        try {
            await update(ref(db, `users/${userAccount.uid}`), {
                name: profile.name,
                department: profile.department
            });
        } catch (e) {
            console.error("Failed to update profile", e);
            throw e;
        }
    }
  };

  // Auth Actions
  const handleGoogleLogin = async (isAdminMode: boolean) => {
    if (!firebaseApp) return;
    setIsLoading(true);
    setPendingRole(isAdminMode ? 'admin' : 'user');
    const auth = getAuth(firebaseApp);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      alert("로그인에 실패했습니다. 설정을 확인해주세요.");
      setPendingRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!firebaseApp) return;
    const auth = getAuth(firebaseApp);
    try {
      await signOut(auth);
      setProducts(INITIAL_PRODUCTS); 
      setPendingRole(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Generate Next SKU
  const generateNextSku = async (brand: string): Promise<string> => {
    const prefixMap: Record<string, string> = {
      '밸롭': 'B',
      '웨이든': 'W',
      '부기프리': 'F',
      '파스티야': 'P'
    };
    const prefix = prefixMap[brand] || 'X';

    if (!db) return `${prefix}00000000`;

    const counterRef = ref(db, `skuCounters/${prefix}`);
    try {
      const result = await runTransaction(counterRef, (currentValue) => {
        return (currentValue || 0) + 1;
      });
      const count = result.snapshot.val();
      const paddedCount = String(count).padStart(8, '0');
      return `${prefix}${paddedCount}`;
    } catch (error) {
      console.error("SKU Generation Failed", error);
      return `${prefix}ERR`; 
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('정말 이 상품을 삭제하시겠습니까?')) {
      if (db && userAccount) {
         await set(ref(db, `products/${id}`), null);
      } else {
         setProducts(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Status) => {
    if (db && userAccount) {
      await update(ref(db, `products/${id}`), { status: newStatus });
    } else {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    if (db && userAccount) {
      await update(ref(db, `products/${id}`), updates);
    } else {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  };

  const handleSaveProduct = async (product: Product, designFile?: File, trimFile?: File, packageFile?: File, tagFile?: File, planFile?: File) => {
    setIsLoading(true);
    let updatedProduct = { ...product };
    
    if (!updatedProduct.author || updatedProduct.author.trim() === '') {
      updatedProduct.authorUid = userAccount?.uid;
      if (userAccount?.name) updatedProduct.author = userAccount.name;
      if (userAccount?.department) updatedProduct.department = userAccount.department;
      if (!updatedProduct.author && userAccount?.displayName) updatedProduct.author = userAccount.displayName;
    }

    try {
      if (storage && userAccount) {
        if (designFile) {
           const storageReference = storageRef(storage, `designs/${Date.now()}_${designFile.name}`);
           await uploadBytes(storageReference, designFile);
           updatedProduct.designImage = await getDownloadURL(storageReference);
        }
        if (trimFile) {
           const storageReference = storageRef(storage, `trims/${Date.now()}_${trimFile.name}`);
           await uploadBytes(storageReference, trimFile);
           updatedProduct.trimImage = await getDownloadURL(storageReference);
        }
        if (packageFile) {
           const storageReference = storageRef(storage, `packages/${Date.now()}_${packageFile.name}`);
           await uploadBytes(storageReference, packageFile);
           updatedProduct.packageImage = await getDownloadURL(storageReference);
        }
        if (tagFile) {
           const storageReference = storageRef(storage, `tags/${Date.now()}_${tagFile.name}`);
           await uploadBytes(storageReference, tagFile);
           updatedProduct.tagImage = await getDownloadURL(storageReference);
        }
        if (planFile) {
            const storageReference = storageRef(storage, `plans/${Date.now()}_${planFile.name}`);
            await uploadBytes(storageReference, planFile);
            updatedProduct.planFileUrl = await getDownloadURL(storageReference);
        }
      }

      if (db && userAccount) {
        if (!updatedProduct.id || updatedProduct.id.length > 10) { 
           // New or UUID
           const productsList = products; // Current State
           const exists = productsList.some(p => p.id === updatedProduct.id);
           
           if (exists) {
                await set(ref(db, `products/${updatedProduct.id}`), updatedProduct);
           } else {
                const newRef = push(ref(db, 'products'));
                updatedProduct.id = newRef.key as string;
                await set(newRef, updatedProduct);
           }
        } else {
           await set(ref(db, `products/${updatedProduct.id}`), updatedProduct);
        }
      } else {
        const index = products.findIndex(p => p.id === updatedProduct.id);
        if (index > -1) {
             setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        } else {
             setProducts(prev => [...prev, updatedProduct]);
        }
      }

      navigate('/products');
    } catch (error) {
        console.error("Save failed", error);
        alert("저장에 실패했습니다. Firebase 설정을 확인해주세요.");
    } finally {
        setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userAccount) {
    return <Login onLogin={handleGoogleLogin} isLoading={isLoading} />;
  }

  return (
    <Layout user={userAccount} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard products={products} />} />
        
        <Route path="/products" element={
            <RequireProfile hasProfile={hasProfile}>
                <ProductList 
                    products={products}
                    currentUser={userAccount}
                    onAddProduct={() => navigate('/products/new')}
                    onEditProduct={(id) => navigate(`/products/${id}`)}
                    onDeleteProduct={handleDeleteProduct}
                    onUpdateProduct={handleUpdateProduct}
                />
            </RequireProfile>
        } />

        <Route path="/products/new" element={
            <RequireProfile hasProfile={hasProfile}>
                <ProductDetail 
                    currentUser={userAccount}
                    onSave={handleSaveProduct}
                    onCancel={() => navigate('/products')}
                    isLoading={isLoading}
                    brands={brands}
                    generateNextSku={generateNextSku}
                />
            </RequireProfile>
        } />

        <Route path="/products/:id" element={
            <RequireProfile hasProfile={hasProfile}>
                <ProductDetailRoute 
                    products={products}
                    currentUser={userAccount}
                    onSave={handleSaveProduct}
                    onCancel={() => navigate('/products')}
                    isLoading={isLoading}
                    brands={brands}
                    generateNextSku={generateNextSku}
                />
            </RequireProfile>
        } />

        <Route path="/production" element={
            <RequireProfile hasProfile={hasProfile}>
                <ProductionManagement 
                    products={products}
                    onUpdateStatus={handleUpdateStatus}
                />
            </RequireProfile>
        } />
        
        <Route path="/users" element={
            userAccount.role === 'admin' ? <UserManagement currentUser={userAccount} /> : <Navigate to="/" />
        } />

        <Route path="/settings" element={
            <Settings 
                currentUser={userAccount}
                onUpdateProfile={handleUpdateProfile}
                brands={brands}
                onUpdateBrands={handleUpdateBrands}
                isAdmin={userAccount.role === 'admin'}
            />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;