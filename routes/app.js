'use strict'

var express = require('express');
var router = express.Router();
const CustomerController = require('../controllers/customerController');

router.post('/register-customer', CustomerController.registerCustomer);
router.put('/recharge-wallet', CustomerController.rechargeWallet);
router.post('/payment', CustomerController.payment);
router.post('/confirm-payment', CustomerController.confirmPayment);
router.get('/check-balance/:dni/:phone', CustomerController.checkBalance);

module.exports = router;