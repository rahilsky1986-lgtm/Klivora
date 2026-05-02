const { supabase } = require('../config/supabase');
const { calculatePayroll } = require('../utils/helpers');
const pdfService = require('../services/pdfService');

// ── Employees ──

const listEmployees = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', req.userId)
      .order('name');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { next(err); }
};

const createEmployee = async (req, res, next) => {
  try {
    const { name, email, salary, frequency, tax_info, start_date } = req.body;
    if (!name || !salary) return res.status(400).json({ error: 'Name and salary are required' });

    const { data, error } = await supabase
      .from('employees')
      .insert({ user_id: req.userId, name, email, salary: parseInt(salary), frequency, tax_info, start_date })
      .select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) { next(err); }
};

const getEmployee = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*, payroll_runs(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Employee not found' });
    res.json(data);
  } catch (err) { next(err); }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { name, email, salary, frequency, tax_info, start_date, active } = req.body;
    const { data, error } = await supabase
      .from('employees')
      .update({ name, email, salary: parseInt(salary), frequency, tax_info, start_date, active })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { next(err); }
};

const removeEmployee = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Employee removed' });
  } catch (err) { next(err); }
};

// ── Payroll Runs ──

const listRuns = async (req, res, next) => {
  try {
    const { employee_id } = req.query;
    let query = supabase
      .from('payroll_runs')
      .select('*, employees(name, email)')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });
    if (employee_id) query = query.eq('employee_id', employee_id);
    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { next(err); }
};

const runPayroll = async (req, res, next) => {
  try {
    const { employee_id, period_start, period_end, gross, notes } = req.body;
    if (!employee_id || !period_start || !period_end || !gross) {
      return res.status(400).json({ error: 'employee_id, period_start, period_end and gross are required' });
    }

    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employee_id)
      .eq('user_id', req.userId)
      .single();

    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const { deductions, net } = calculatePayroll(parseInt(gross), employee.tax_info);

    const { data, error } = await supabase
      .from('payroll_runs')
      .insert({
        user_id: req.userId, employee_id, period_start, period_end,
        gross: parseInt(gross), deductions, net, notes, status: 'draft',
      })
      .select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) { next(err); }
};

const getRun = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*, employees(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Payroll run not found' });
    res.json(data);
  } catch (err) { next(err); }
};

const updateRunStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updates = { status };
    if (status === 'paid') updates.paid_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('payroll_runs')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) { next(err); }
};

const generatePayslip = async (req, res, next) => {
  try {
    const { data: run } = await supabase
      .from('payroll_runs')
      .select('*, employees(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();
    if (!run) return res.status(404).json({ error: 'Payroll run not found' });

    const { data: profile } = await supabase
      .from('users').select('*').eq('id', req.userId).single();

    const pdfBuffer = await pdfService.generatePayslipPdf(run, profile);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${run.employees?.name}-${run.period_start}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

module.exports = { listEmployees, createEmployee, getEmployee, updateEmployee, removeEmployee, listRuns, runPayroll, getRun, updateRunStatus, generatePayslip };
