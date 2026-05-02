const { supabase } = require('../config/supabase');
const { generateInvoiceNumber, calculateInvoiceTotals, getPagination } = require('../utils/helpers');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const { from, to } = getPagination(parseInt(page), parseInt(limit));

    let query = supabase
      .from('invoices')
      .select('*, customers(name, email)', { count: 'exact' })
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('invoice_number', `%${search}%`);

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      customer_id, issue_date, due_date, items = [],
      discount_amount = 0, notes, payment_terms, currency,
      recurring, recurring_interval,
    } = req.body;

    // Get user profile for invoice number generation
    const { data: profile } = await supabase
      .from('users')
      .select('invoice_prefix, next_invoice_number, currency')
      .eq('id', req.userId)
      .single();

    const invoice_number = generateInvoiceNumber(
      profile.invoice_prefix,
      profile.next_invoice_number
    );

    // Calculate totals
    const { subtotal, tax_amount, total } = calculateInvoiceTotals(items, discount_amount);

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        user_id: req.userId,
        customer_id,
        invoice_number,
        issue_date: issue_date || new Date().toISOString().split('T')[0],
        due_date,
        subtotal,
        tax_amount,
        discount_amount: parseInt(discount_amount) || 0,
        total,
        currency: currency || profile.currency || 'USD',
        notes,
        payment_terms,
        recurring: !!recurring,
        recurring_interval: recurring ? recurring_interval : null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Insert line items
    if (items.length > 0) {
      const lineItems = items.map((item, idx) => {
        const qty = parseFloat(item.quantity) || 1;
        const price = parseInt(item.unit_price) || 0;
        return {
          invoice_id: invoice.id,
          description: item.description || '',
          quantity: qty,
          unit_price: price,
          tax_rate: parseFloat(item.tax_rate) || 0,
          amount: Math.round(qty * price),
          sort_order: idx,
        };
      });
      await supabase.from('invoice_items').insert(lineItems);
    }

    // Increment user's invoice counter
    await supabase
      .from('users')
      .update({ next_invoice_number: (profile.next_invoice_number || 1) + 1 })
      .eq('id', req.userId);

    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customers(*), invoice_items(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Invoice not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const {
      customer_id, issue_date, due_date, items = [],
      discount_amount = 0, notes, payment_terms, currency,
      recurring, recurring_interval,
    } = req.body;

    const { subtotal, tax_amount, total } = calculateInvoiceTotals(items, discount_amount);

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update({
        customer_id, issue_date, due_date, subtotal,
        tax_amount, discount_amount: parseInt(discount_amount) || 0,
        total, currency, notes, payment_terms,
        recurring: !!recurring,
        recurring_interval: recurring ? recurring_interval : null,
      })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Replace line items
    await supabase.from('invoice_items').delete().eq('invoice_id', req.params.id);
    if (items.length > 0) {
      const lineItems = items.map((item, idx) => {
        const qty = parseFloat(item.quantity) || 1;
        const price = parseInt(item.unit_price) || 0;
        return {
          invoice_id: req.params.id,
          description: item.description,
          quantity: qty,
          unit_price: price,
          tax_rate: parseFloat(item.tax_rate) || 0,
          amount: Math.round(qty * price),
          sort_order: idx,
        };
      });
      await supabase.from('invoice_items').insert(lineItems);
    }

    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    next(err);
  }
};

const send = async (req, res, next) => {
  try {
    // Get invoice with customer and user profile
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, customers(*), invoice_items(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const { data: profile } = await supabase
      .from('users')
      .select('business_name, email, logo_url')
      .eq('id', req.userId)
      .single();

    if (!invoice.customers?.email) {
      return res.status(400).json({ error: 'Customer has no email address' });
    }

    // Send email
    await emailService.sendInvoice(invoice, profile);

    // Update status to sent
    await supabase
      .from('invoices')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', req.params.id);

    res.json({ message: 'Invoice sent successfully' });
  } catch (err) {
    next(err);
  }
};

const duplicate = async (req, res, next) => {
  try {
    const { data: original } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (!original) return res.status(404).json({ error: 'Invoice not found' });

    const { data: profile } = await supabase
      .from('users')
      .select('invoice_prefix, next_invoice_number')
      .eq('id', req.userId)
      .single();

    const invoice_number = generateInvoiceNumber(profile.invoice_prefix, profile.next_invoice_number);
    const today = new Date().toISOString().split('T')[0];

    const { data: newInvoice } = await supabase
      .from('invoices')
      .insert({
        user_id: req.userId,
        customer_id: original.customer_id,
        invoice_number,
        status: 'draft',
        issue_date: today,
        due_date: original.due_date,
        subtotal: original.subtotal,
        tax_amount: original.tax_amount,
        discount_amount: original.discount_amount,
        total: original.total,
        currency: original.currency,
        notes: original.notes,
        payment_terms: original.payment_terms,
      })
      .select()
      .single();

    if (original.invoice_items?.length > 0) {
      const items = original.invoice_items.map(({ id, invoice_id, ...item }) => ({
        ...item,
        invoice_id: newInvoice.id,
      }));
      await supabase.from('invoice_items').insert(items);
    }

    await supabase
      .from('users')
      .update({ next_invoice_number: (profile.next_invoice_number || 1) + 1 })
      .eq('id', req.userId);

    res.status(201).json(newInvoice);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updates = { status };
    if (status === 'paid') updates.paid_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const generatePdf = async (req, res, next) => {
  try {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, customers(*), invoice_items(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    const pdfBuffer = await pdfService.generateInvoicePdf(invoice, profile);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getOne, update, remove, send, duplicate, updateStatus, generatePdf };
