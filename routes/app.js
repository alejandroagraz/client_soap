'use strict'

var express = require('express');
var router = express.Router();
const CustomerController = require('../controllers/customerController');
const CustomerMiddleware = require('../middlewares/customerMiddleware.js');

router.post ('/login', CustomerMiddleware.login, CustomerController.login);
router.post('/register-customer', CustomerController.registerCustomer);
router.put('/recharge-wallet', CustomerMiddleware.isLoggedIn, CustomerController.rechargeWallet);
router.post('/payment', CustomerMiddleware.isLoggedIn, CustomerController.payment);
router.post('/confirm-payment', CustomerMiddleware.isLoggedIn, CustomerController.confirmPayment);
router.get('/check-balance/:dni/:phone', CustomerMiddleware.isLoggedIn, CustomerController.checkBalance);
router.post ( '/logout', CustomerMiddleware.isLoggedIn, CustomerController.logout);

module.exports = router;