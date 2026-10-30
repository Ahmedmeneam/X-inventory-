import React, { useState, useEffect } from 'react';
import { Custody, Warehouse } from '../types/custody.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { FoundationalImportModal } from '../components/custody/FoundationalImportModal.tsx';
import {
  Building,
  PlusCircle,
  Warehouse as WarehouseIcon,
  Users,
  FileSpreadsheet,
  Archive,
  CheckCircle2,
  Lock,
  AlertCircle,
  RotateCcw,
  Sparkles,
  GitFork,
  Network,
  LayoutGrid,
  Edit2,
  Check,
  Shield,
  Layers,
  Building2,
  ChevronDown,
  ChevronRight,
  Boxes,
  Plus,
} from 'lucide-react';

export const CustodiesPage: React.FC = () => {
  const { user } = useAuth();
  const [custodiesList, setCustodiesList] = useState<any[]>([]);
  const [generalWarehouses, setGeneralWarehouses] = useState<any[]>([]);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [companyInfo, setCompanyInfo] = useState<any>({ company_name: 'النظام المركزي لإدارة العهد والمخازن' });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'tree'>('cards');

  // Modal: Create New Company
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompCode, setNewCompCode] = useState('');
  const [newCompActivity, setNewCompActivity] = useState('');
  const [companyModalError, setCompanyModalError] = useState('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // Edit Company Name
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false);

  // Modal: Create New Custody
  const [showCreateCustody, setShowCreateCustody] = useState(false);
  const [custodyName, setCustodyName] = useState('');
  const [custodyCompanyId, setCustodyCompanyId] = useState<string>('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Modal: Add Sub Warehouse to Custody
  const [selectedCustodyForWarehouse, setSelectedCustodyForWarehouse] = useState<any | null>(null);
  const [subWarehouseName, setSubWarehouseName] = useState('');
  const [warehouseError, setWarehouseError] = useState('');
  const [isAddingWarehouse, setIsAddingWarehouse] = useState(false);

  // Modal: Add General Warehouse to Company
  const [showGeneralWarehouseModal, setShowGeneralWarehouseModal] = useState(false);
  const [generalWarehouseName, setGeneralWarehouseName] = useState('');
  const [generalWarehouseCompanyId, setGeneralWarehouseCompanyId] = useState<string>('');
  const [generalWarehouseError, setGeneralWarehouseError] = useState('');
  const [isAddingGeneral, setIsAddingGeneral] = useState(false);

  // Modal: Archive Custody
  const [archiveTarget, setArchiveTarget] = useState<any | null>(null);
  const [archiveAdminPassword, setArchiveAdminPassword] = useState('');
  const [archiveError, setArchiveError] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);

  // Modal: Foundational Import
  const [importTarget, setImportTarget] = useState<Custody | null>(null);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompaniesList(data.companies || []);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchOrganizationData = async (companyFilter: string = selectedCompanyId) => {
    try {
      setLoading(true);
      const url = companyFilter !== 'all'
        ? `/api/custodies/organization?companyId=${companyFilter}`
        : '/api/custodies/organization';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCompanyInfo(data.company || { company_name: 'النظام المركزي لإدارة العهد والمخازن' });
        setGeneralWarehouses(data.general_warehouses || []);
        setCustodiesList(data.custodies || []);
        if (data.companies) {
          setCompaniesList(data.companies);
        }
      }
    } catch (err) {
      console.error('Error fetching organization structure:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchOrganizationData('all');
  }, []);

  const handleCompanyChange = (newCompanyId: string) => {
    setSelectedCompanyId(newCompanyId);
    fetchOrganizationData(newCompanyId);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    setCompanyModalError('');
    setIsCreatingCompany(true);

    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompName.trim(),
          code: newCompCode.trim() || undefined,
          activity: newCompActivity.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إنشاء الشركة');
      }

      setShowCreateCompanyModal(false);
      setNewCompName('');
      setNewCompCode('');
      setNewCompActivity('');

      // Refresh list and select the new company
      await fetchCompanies();
      if (data.company?.id) {
        handleCompanyChange(String(data.company.id));
      } else {
        fetchOrganizationData();
      }
    } catch (err: any) {
      setCompanyModalError(err.message || 'حدث خطأ أثناء إنشاء الشركة');
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    setIsUpdatingCompany(true);
    try {
      const res = await fetch('/api/custodies/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: newCompanyName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCompanyInfo((prev: any) => ({ ...prev, company_name: data.companyName }));
        setShowEditCompany(false);
      }
    } catch (err) {
      console.error('Failed to update company name:', err);
    } finally {
      setIsUpdatingCompany(false);
    }
  };

  const handleCreateCustody = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custodyName.trim()) return;

    setCreateError('');
    setIsCreating(true);

    const compId = custodyCompanyId || (selectedCompanyId !== 'all' ? selectedCompanyId : undefined);

    try {
      const res = await fetch('/api/custodies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: custodyName.trim(),
          companyId: compId ? Number(compId) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إنشاء العهدة');
      }

      setShowCreateCustody(false);
      setCustodyName('');
      setCustodyCompanyId('');
      fetchOrganizationData();
    } catch (err: any) {
      setCreateError(err.message || 'حدث خطأ');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddSubWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustodyForWarehouse || !subWarehouseName.trim()) return;

    setWarehouseError('');
    setIsAddingWarehouse(true);

    try {
      const res = await fetch(`/api/custodies/${selectedCustodyForWarehouse.id}/warehouses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: subWarehouseName.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إضافة المخزن الفرعي');
      }

      setSelectedCustodyForWarehouse(null);
      setSubWarehouseName('');
      fetchOrganizationData();
    } catch (err: any) {
      setWarehouseError(err.message || 'حدث خطأ');
    } finally {
      setIsAddingWarehouse(false);
    }
  };

  const handleAddGeneralWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalWarehouseName.trim()) return;

    setGeneralWarehouseError('');
    setIsAddingGeneral(true);

    const compId = generalWarehouseCompanyId || (selectedCompanyId !== 'all' ? selectedCompanyId : undefined);

    try {
      const res = await fetch('/api/custodies/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: generalWarehouseName.trim(),
          companyId: compId ? Number(compId) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إنشاء المخزن العام');
      }

      setShowGeneralWarehouseModal(false);
      setGeneralWarehouseName('');
      setGeneralWarehouseCompanyId('');
      fetchOrganizationData();
    } catch (err: any) {
      setGeneralWarehouseError(err.message || 'حدث خطأ');
    } finally {
      setIsAddingGeneral(false);
    }
  };

  const handleArchiveCustody = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveTarget || !archiveAdminPassword) return;

    setArchiveError('');
    setIsArchiving(true);

    try {
      const res = await fetch(`/api/custodies/${archiveTarget.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: archiveAdminPassword,
          adminUserId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل أرشفة العهدة');
      }

      setArchiveTarget(null);
      setArchiveAdminPassword('');
      fetchOrganizationData();
    } catch (err: any) {
      setArchiveError(err.message || 'حدث خطأ');
    } finally {
      setIsArchiving(false);
    }
  };

  const totalCustodiesWarehouses = custodiesList.reduce(
    (acc, c) => acc + (c.warehouses?.length || 0),
    0
  );
  const totalWarehousesCount = generalWarehouses.length + totalCustodiesWarehouses;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>إدارة الشركات والعهد والمخازن</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة مرنة للمنشآت والشركات المتعددة، والمخازن العامة المشتركة، والعهد ومخازنها الرئيسية والفرعية
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>عرض البطاقات</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>الشجرة الهيكلية</span>
            </button>
          </div>

          {/* Add Company Button */}
          <button
            type="button"
            onClick={() => setShowCreateCompanyModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة شركة جديدة</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGeneralWarehouseModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <WarehouseIcon className="w-4 h-4 text-emerald-600" />
            <span>إضافة مخزن عام</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateCustody(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إنشاء عهدة جديدة</span>
          </button>
        </div>
      </div>

      {/* Multi-Company Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">تصفية حسب الشركة:</span>
          <button
            type="button"
            onClick={() => handleCompanyChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedCompanyId === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            جميع الشركات ({companiesList.length})
          </button>

          {companiesList.map((comp) => (
            <button
              key={comp.id}
              type="button"
              onClick={() => handleCompanyChange(String(comp.id))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedCompanyId === String(comp.id)
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>{comp.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({comp.code})</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowCreateCompanyModal(true)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إنشاء شركة إضافية</span>
        </button>
      </div>

      {/* Organizational Header: Company Entity Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {selectedCompanyId !== 'all'
                    ? companiesList.find((c) => String(c.id) === selectedCompanyId)?.name || companyInfo.company_name
                    : companyInfo.company_name || 'المنظومة المركزية للشركات والعهد'}
                </h2>
                {selectedCompanyId === 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewCompanyName(companyInfo.company_name || '');
                      setShowEditCompany(true);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="تعديل اسم المنشأة"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedCompanyId !== 'all'
                  ? `الشركة المحددة • النشاط: ${companiesList.find((c) => String(c.id) === selectedCompanyId)?.activity || 'عام'}`
                  : 'نظام إدارة المخازن والعهد والشركات المتعددة'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center sm:text-right">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">المخازن العامة</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">{generalWarehouses.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">العهد المسجلة</span>
              <span className="text-lg font-bold text-sky-600 dark:text-sky-400 font-mono">{custodiesList.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">إجمالي المخازن</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono">{totalWarehousesCount}</span>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'tree' ? (
        /* =================== TREE HIERARCHICAL VIEW =================== */
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <GitFork className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                خريطة التدرج الهيكلي (شجرة الشركات والعهد والمخازن)
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              رسم تخطيطي حي للشركات والمخازن والعهد التابعة
            </span>
          </div>

          <div className="space-y-4 pr-2 font-mono text-xs">
            {/* Tree Branch: General Warehouses */}
            <div className="pr-6 space-y-2 border-r-2 border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 font-semibold">
                <span className="flex items-center gap-2">
                  <WarehouseIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>المخازن العامة (تستقبل بضائع كافة العهد بحساب مستقل لكل عهدة) ({generalWarehouses.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowGeneralWarehouseModal(true)}
                  className="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                >
                  + إضافة مخزن عام
                </button>
              </div>

              {generalWarehouses.length === 0 ? (
                <div className="pr-4 py-1.5 text-slate-400 text-[11px]">
                  └─ لا توجد مخازن عامة مضافة بعد.
                </div>
              ) : (
                generalWarehouses.map((gw) => (
                  <div
                    key={gw.id}
                    className="pr-4 py-1.5 flex items-center justify-between text-slate-700 dark:text-slate-300"
                  >
                    <span>└─ 🏢 {gw.name} (مخزن عام مشترك)</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                      متاح لكافة العهد
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Tree Branch: Custodies */}
            <div className="pr-6 space-y-4 border-r-2 border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-300 font-semibold">
                <span className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-sky-600" />
                  <span>العهد المحاسبية وأقسامها الرقابية ({custodiesList.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateCustody(true)}
                  className="text-[11px] text-sky-700 dark:text-sky-300 hover:underline cursor-pointer"
                >
                  + إنشاء عهدة
                </button>
              </div>

              {custodiesList.length === 0 ? (
                <div className="pr-4 py-1.5 text-slate-400 text-[11px]">
                  └─ لا توجد عهد مضافة بعد في هذه التصفية.
                </div>
              ) : (
                custodiesList.map((c) => (
                  <div
                    key={c.id}
                    className="pr-4 space-y-2 border-r-2 border-indigo-200 dark:border-indigo-800/50"
                  >
                    <div className="flex items-center justify-between py-1 text-slate-800 dark:text-slate-200 font-bold">
                      <span>├─ 📦 عهدة: {c.name} ({c.code})</span>
                      <span className="text-[10px] text-slate-400">
                        {c.users_count} موظفين مسكنين
                      </span>
                    </div>

                    {/* Warehouses under this custody */}
                    <div className="pr-6 space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                      {c.warehouses?.map((w: Warehouse) => (
                        <div key={w.id} className="flex items-center justify-between">
                          <span>
                            {w.is_main
                              ? `└─ ⭐ ${w.name} [المخزن الرئيسي لاستقبال الوارد]`
                              : `└─ 🏬 ${w.name} [مخزن فرعي]`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* =================== CARDS VIEW =================== */
        <div className="space-y-8">
          {/* SECTION 1: General Company Warehouses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WarehouseIcon className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  المخازن العامة المشتركة ({generalWarehouses.length})
                </h3>
                <span className="text-[11px] text-slate-400 font-normal">
                  (تستقبل بضائع كافة العهد بحساب رصيد صنف مستقل لكل عهدة)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGeneralWarehouseModal(true)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
              >
                + إضافة مخزن عام
              </button>
            </div>

            {generalWarehouses.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-400">
                لا توجد مخازن عامة مسجلة بعد. المخازن العامة تُستخدم لاستقبال وتخزين أصناف كافة العهد بحسابات مستقلة لكل عهدة.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {generalWarehouses.map((gw) => (
                  <div
                    key={gw.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                          🏢
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {gw.name}
                          </h4>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            مخزن عام مشترك
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        متاح للجميع
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      يسمح بتحويل بضائع أي عهدة إليه وإدارتها بحساب صنف مستقل لكل عهدة.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: Custodies List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  العهد المحاسبية ومخازنها ({custodiesList.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateCustody(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                + إنشاء عهدة جديدة
              </button>
            </div>

            {custodiesList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-400 space-y-2">
                <p>لا توجد عهد مضافة بعد.</p>
                <button
                  type="button"
                  onClick={() => setShowCreateCustody(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer"
                >
                  إنشاء أول عهدة الآن
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {custodiesList.map((cust) => (
                  <div
                    key={cust.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          📦
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {cust.name}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500">
                            كود العهدة: {cust.code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCustodyForWarehouse(cust)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          + مخزن فرعي
                        </button>
                        <button
                          type="button"
                          onClick={() => setArchiveTarget(cust)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          title="أرشفة العهدة"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Warehouses list */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        مخازن العهدة ({cust.warehouses?.length || 0}):
                      </span>
                      <div className="space-y-1">
                        {cust.warehouses?.map((w: Warehouse) => (
                          <div
                            key={w.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs"
                          >
                            <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              {w.is_main ? '⭐' : '🏬'}
                              <span>{w.name}</span>
                              {w.is_main && (
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                                  (المخزن الرئيسي لاستقبال الوارد)
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              نشط
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create New Company */}
      {showCreateCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                إضافة شركة جديدة للنظام
              </h3>
            </div>

            {companyModalError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">
                {companyModalError}
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  اسم الشركة / المنشأة *
                </label>
                <input
                  type="text"
                  required
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="مثال: شركة المقاولات الحديثة، شركة التوريدات الهندسية"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  كود الشركة (اختياري - يتم التوليد تلقائياً إن ترك فارغاً)
                </label>
                <input
                  type="text"
                  value={newCompCode}
                  onChange={(e) => setNewCompCode(e.target.value)}
                  placeholder="COMP-002"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  مجال النشاط / وصف (اختياري)
                </label>
                <input
                  type="text"
                  value={newCompActivity}
                  onChange={(e) => setNewCompActivity(e.target.value)}
                  placeholder="مثال: مقاولات، توريدات، خدمات صيانة"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateCompanyModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCompany}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer"
                >
                  {isCreatingCompany ? 'جارٍ الإنشاء...' : 'تأكيد إنشاء الشركة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit General Company Name */}
      {showEditCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>تعديل اسم المنشأة</span>
            </h3>

            <form onSubmit={handleUpdateCompany} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  اسم الشركة / المنشأة:
                </label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="مثال: شركة النماء للإنشاءات"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditCompany(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCompany}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  {isUpdatingCompany ? 'جارٍ الحفظ...' : 'حفظ التعديل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Custody */}
      {showCreateCustody && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                إنشاء عهدة محاسبية جديدة
              </h3>
            </div>

            {createError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCustody} className="space-y-4 text-xs">
              {companiesList.length > 0 && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    الشركة التابعة لها العهدة:
                  </label>
                  <select
                    value={custodyCompanyId || selectedCompanyId}
                    onChange={(e) => setCustodyCompanyId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">— اختيار الشركة —</option>
                    {companiesList.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name} ({comp.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  اسم العهدة المحاسبية (بالعربية) *
                </label>
                <input
                  type="text"
                  required
                  value={custodyName}
                  onChange={(e) => setCustodyName(e.target.value)}
                  placeholder="مثال: عهدة المهمات، عهدة الكهرباء، عهدة الصيانة العامة"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * سيقوم النظام بتوليد كود تسلسلي فريد للعهدة تلقائياً، وإنشاء مخزنها الرئيسي الحصري لاستقبال الوارد فوراً.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateCustody(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer"
                >
                  {isCreating ? 'جارٍ الإنشاء والتأسيس...' : 'تأكيد إنشاء العهدة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add General Warehouse */}
      {showGeneralWarehouseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <WarehouseIcon className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                إضافة مخزن عام مشترك
              </h3>
            </div>

            {generalWarehouseError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs">
                {generalWarehouseError}
              </div>
            )}

            <form onSubmit={handleAddGeneralWarehouse} className="space-y-4 text-xs">
              {companiesList.length > 0 && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    الشركة التابع لها المخزن العام:
                  </label>
                  <select
                    value={generalWarehouseCompanyId || selectedCompanyId}
                    onChange={(e) => setGeneralWarehouseCompanyId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">— اختيار الشركة —</option>
                    {companiesList.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name} ({comp.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  اسم المخزن العام *
                </label>
                <input
                  type="text"
                  required
                  value={generalWarehouseName}
                  onChange={(e) => setGeneralWarehouseName(e.target.value)}
                  placeholder="مثال: المخزن المركزي العام، مخزن الهناجر 3، مخزن 1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * المخزن العام يستقبل بضائع وتحويلات كافة العهد، ويتم فتح حساب رصيد صنف مستقل لكل عهدة به.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGeneralWarehouseModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAddingGeneral}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer"
                >
                  {isAddingGeneral ? 'جارٍ الإنشاء...' : 'إنشاء المخزن العام'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Sub Warehouse */}
      {selectedCustodyForWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <WarehouseIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                إضافة مخزن فرعي لعهدة: {selectedCustodyForWarehouse.name}
              </h3>
            </div>

            {warehouseError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs">
                {warehouseError}
              </div>
            )}

            <form onSubmit={handleAddSubWarehouse} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  اسم المخزن الفرعي *
                </label>
                <input
                  type="text"
                  required
                  value={subWarehouseName}
                  onChange={(e) => setSubWarehouseName(e.target.value)}
                  placeholder="مثال: مخزن الموقع الشمالي، مخزن الورشة الفرعية"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCustodyForWarehouse(null)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAddingWarehouse}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer"
                >
                  {isAddingWarehouse ? 'جارٍ الإضافة...' : 'إضافة المخزن الفرعي'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Archive Custody */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-rose-100 dark:border-rose-950/40 text-rose-600">
              <Archive className="w-5 h-5" />
              <h3 className="text-sm font-bold">
                أرشفة وإغلاق العهدة: {archiveTarget.name}
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              وفقاً لقواعد النظام، لا يمكن أرشفة العهدة إلا بعد تصفير كافة أرصدتها في المخزن الرئيسي وجميع المخازن عبر حركات معتمدة وحسم أي طلبات معلقة.
            </p>

            {archiveError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
                {archiveError}
              </div>
            )}

            <form onSubmit={handleArchiveCustody} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  أدخل كلمة مرور مسؤول النظام للتأكيد:
                </label>
                <input
                  type="password"
                  required
                  value={archiveAdminPassword}
                  onChange={(e) => setArchiveAdminPassword(e.target.value)}
                  placeholder="كلمة مرور الأدمن"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setArchiveTarget(null)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isArchiving}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer"
                >
                  {isArchiving ? 'جارٍ التحقق والأرشفة...' : 'تأكيد الأرشفة والإغلاق'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Foundational Import */}
      {importTarget && (
        <FoundationalImportModal
          custody={importTarget}
          onClose={() => setImportTarget(null)}
          onSuccess={() => {
            setImportTarget(null);
            fetchOrganizationData();
          }}
        />
      )}
    </div>
  );
};
