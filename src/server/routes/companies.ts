import { Router, type Request, type Response } from 'express';
import { db, sqlite } from '../db/index.ts';
import { companies, custodies, warehouses, users, auditLogs, companySettings } from '../db/schema.ts';
import { eq, count, sql } from 'drizzle-orm';

export const companiesRouter = Router();

// GET /api/companies - List all registered companies with stats
companiesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const list = db.select().from(companies).all();

    const withStats = list.map((comp) => {
      const custCount = db
        .select({ count: count() })
        .from(custodies)
        .where(eq(custodies.companyId, comp.id))
        .get();

      const whCount = db
        .select({ count: count() })
        .from(warehouses)
        .where(eq(warehouses.companyId, comp.id))
        .get();

      return {
        ...comp,
        custodies_count: custCount?.count || 0,
        warehouses_count: whCount?.count || 0,
      };
    });

    res.json({ companies: withStats });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'خطأ في جلب بيانات الشركات' });
  }
});

// GET /api/companies/:id - Get single company with its custodies and warehouses
companiesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.id);
    const company = db.select().from(companies).where(eq(companies.id, companyId)).get();

    if (!company) {
      res.status(404).json({ error: 'الشركة غير موجودة' });
      return;
    }

    const companyCustodies = db.select().from(custodies).where(eq(custodies.companyId, companyId)).all();
    const companyWarehouses = db.select().from(warehouses).where(eq(warehouses.companyId, companyId)).all();

    res.json({
      company,
      custodies: companyCustodies,
      warehouses: companyWarehouses,
    });
  } catch (error) {
    console.error('Error fetching company details:', error);
    res.status(500).json({ error: 'خطأ في جلب تفاصيل الشركة' });
  }
});

// POST /api/companies - Create new company
companiesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, code, activity } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'يرجى إدخال اسم الشركة' });
      return;
    }

    const cleanName = name.trim();
    let cleanCode = code ? code.trim().toUpperCase() : '';

    if (!cleanCode) {
      const countRes = db.select({ count: count() }).from(companies).get();
      const nextNum = (countRes?.count || 0) + 1;
      cleanCode = `COMP-${String(nextNum).padStart(3, '0')}`;
      let exists = db.select().from(companies).where(eq(companies.code, cleanCode)).get();
      let salt = 1;
      while (exists) {
        cleanCode = `COMP-${String(nextNum + salt).padStart(3, '0')}`;
        exists = db.select().from(companies).where(eq(companies.code, cleanCode)).get();
        salt++;
      }
    }

    const existing = db.select().from(companies).where(eq(companies.code, cleanCode)).get();
    if (existing) {
      res.status(400).json({ error: 'كود الشركة مسجل مسبقاً' });
      return;
    }

    const now = new Date().toISOString();
    const newCompany = db
      .insert(companies)
      .values({
        code: cleanCode,
        name: cleanName,
        activity: activity ? activity.trim() : null,
        createdAt: now,
      })
      .returning()
      .get();

    // If companySettings does not have a companyName or is default, update it with this first company
    const settings = db.select().from(companySettings).get();
    if (settings && (settings.companyName === 'النظام المركزي لإدارة العهد والمخازن' || !settings.companyName)) {
      db.update(companySettings)
        .set({ companyName: cleanName })
        .where(eq(companySettings.id, settings.id))
        .run();
    }

    db.insert(auditLogs)
      .values({
        userId: null,
        userCode: 'ADMIN',
        action: 'COMPANY_CREATED',
        details: JSON.stringify({ companyId: newCompany.id, name: cleanName, code: cleanCode }),
        createdAt: now,
      })
      .run();

    res.json({
      success: true,
      message: `تم إنشاء الشركة "${cleanName}" بنجاح`,
      company: newCompany,
    });
  } catch (error: any) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: error.message || 'فشل إنشاء الشركة' });
  }
});

// PUT /api/companies/:id - Update company
companiesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.id);
    const { name, activity } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'يرجى إدخال اسم الشركة' });
      return;
    }

    const cleanName = name.trim();
    db.update(companies)
      .set({
        name: cleanName,
        activity: activity ? activity.trim() : null,
      })
      .where(eq(companies.id, companyId))
      .run();

    res.json({ success: true, message: 'تم تحديث بيانات الشركة بنجاح' });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'فشل تحديث بيانات الشركة' });
  }
});

// DELETE /api/companies/:id - Delete company (only if no custodies or warehouses attached)
companiesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const companyId = Number(req.params.id);

    const custCount = db
      .select({ count: count() })
      .from(custodies)
      .where(eq(custodies.companyId, companyId))
      .get();

    if ((custCount?.count || 0) > 0) {
      res.status(400).json({ error: 'لا يمكن حذف الشركة لوجود عهد ومخازن مرتبطة بها. قم بحذف العهد أولاً.' });
      return;
    }

    db.delete(companies).where(eq(companies.id, companyId)).run();
    res.json({ success: true, message: 'تم حذف الشركة بنجاح' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'فشل حذف الشركة' });
  }
});
