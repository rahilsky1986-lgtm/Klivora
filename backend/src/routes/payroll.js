const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const payrollController = require('../controllers/payrollController');

router.use(authenticate);

// Employees
router.get('/employees', payrollController.listEmployees);
router.post('/employees', payrollController.createEmployee);
router.get('/employees/:id', payrollController.getEmployee);
router.put('/employees/:id', payrollController.updateEmployee);
router.delete('/employees/:id', payrollController.removeEmployee);

// Payroll runs
router.get('/runs', payrollController.listRuns);
router.post('/runs', payrollController.runPayroll);
router.get('/runs/:id', payrollController.getRun);
router.patch('/runs/:id/status', payrollController.updateRunStatus);
router.get('/runs/:id/payslip', payrollController.generatePayslip);

module.exports = router;
