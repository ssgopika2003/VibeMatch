import express from 'express';
import { auth, adminAuth } from '../middleware/auth.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router = express.Router();

// =====================
// DASHBOARD & ANALYTICS
// =====================
router.get('/dashboard/stats', auth(), adminAuth, adminController.getDashboardStats);
router.get('/analytics/advanced', auth(), adminAuth, adminController.getAdvancedAnalytics);

// =====================
// USER MANAGEMENT
// =====================
router.get('/users', auth(), adminAuth, adminController.getAllUsers);
router.get('/users/:id', auth(), adminAuth, adminController.getUserDetails);
router.put('/users/:id', auth(), adminAuth, adminController.updateUser);
router.delete('/users/:id', auth(), adminAuth, adminController.deleteUser);

// =====================
// PRODUCT MANAGEMENT
// =====================
router.get('/products', auth(), adminAuth, adminController.getAllProductsAdmin);
router.post('/products', auth(), adminAuth, adminController.createProduct);
router.put('/products/:id', auth(), adminAuth, adminController.updateProduct);
router.delete('/products/:id', auth(), adminAuth, adminController.deleteProduct);

// =====================
// ORDER MANAGEMENT
// =====================
router.get('/orders', auth(), adminAuth, adminController.getAllOrdersAdmin);
router.get('/orders/:id', auth(), adminAuth, adminController.getOrderDetails);
router.put('/orders/:id/status', auth(), adminAuth, adminController.updateOrderStatus);
router.delete('/orders/:id', auth(), adminAuth, adminController.deleteOrder);

export default router;
