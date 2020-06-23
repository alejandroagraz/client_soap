'use strict'

const validator = require('validator');
const CutomerService = require('../services/cutomerService');
const nodemailer = require('nodemailer');
const randtoken = require('rand-token');
// const path = require('path');
var soap = require('strong-soap').soap;

var urlWsdlDoc = 'http://wsdl.doc/soapServer.wsdl';
var options = {};

var controller = {

    registerCustomer: function (req, res) {
        var params = req.body;
        try {
            var validate_dni = !validator.isEmpty(params.dni);
            var validate_name = !validator.isEmpty(params.name);
            var validate_last_name = !validator.isEmpty(params.last_name);
            var validate_phone = !validator.isEmpty(params.phone);
            var validate_email = !validator.isEmpty(params.email);

        } catch (err) {
            return res.status(200).send({
                status: 'err',
                message: 'Missing Data To Send'
            });
        }
        if (validate_dni && validate_name && validate_last_name && validate_phone
            && validate_email) {
            var dataGet = {
                dni: params.dni,
                name: params.name,
                last_name: params.last_name,
                phone: params.phone,
                email: params.email
            };
            CutomerService.soapServer(dataGet, res, 'registerCustomer');
        } else {
            return res.status(200).send({
                status: 'err',
                message: 'Data Not Validated'
            });
        }
    },
    rechargeWallet: function (req, res) {
        var params = req.body;
        try {
            var validate_dni = !validator.isEmpty(params.dni);
            var validate_phone = !validator.isEmpty(params.phone);
            var validate_balance = !validator.isEmpty(params.balance);
        } catch (err) {
            return res.status(200).send({
                status: 'err',
                message: 'Missing Data To Send'
            });
        }
        if (validate_dni && validate_phone && validate_balance) {
            var dataGet = {
                dni: params.dni,
                phone: params.phone,
                balance: params.balance
            };
            CutomerService.soapServer(dataGet, res, 'rechargeWallet');
        } else {
            return res.status(200).send({
                status: 'err',
                message: 'Data Not Validated'
            });
        }
    },
    payment: function (req, res) {
        var params = req.body;
        try {
            var validate_dni = !validator.isEmpty(params.dni);
            var validate_phone = !validator.isEmpty(params.phone);
            var validate_amount_payable = !validator.isEmpty(params.amount_payable);

        } catch (err) {
            return res.status(200).send({
                status: 'err',
                message: 'Missing Data To Send'
            });
        }

        if (validate_dni && validate_phone && validate_amount_payable) {

            soap.createClient(urlWsdlDoc, options, (err, client) => {
                var dataGet = {
                    dni: params.dni,
                    phone: params.phone,
                    amount_payable: params.amount_payable
                };

                if (err) {
                    return res.status(404).send({
                        status: 'err',
                        message: 'Configuration File Not Found .wsdl'
                    });
                }

                client.payment(dataGet, (err, resp) => {
                    if (err) {
                        return res.status(500).send({
                            status: 'err',
                            message: 'An Error Occurred On The SOAP Server',
                        });
                    }

                    var responseClient = resp.return.$value ? JSON.parse(resp.return.$value) : false;


                    if (responseClient) {

                        if (responseClient.status == 'success') {

                            if (params.amount_payable > responseClient.response.balance || responseClient.response.balance == null) {
                                return res.status(200).send({
                                    status: 'err',
                                    message: 'Insufficient Balance !!!',
                                });
                            } else {

                                var token = randtoken.generate(6);

                                var dataUpdate = {
                                    id: responseClient.response.id.toString(),
                                    token: token,
                                    session_id: req.sessionID
                                };

                                client.payment(dataUpdate, (err, resp) => {
                                    if (err) {
                                        return res.status(500).send({
                                            status: 'err',
                                            message: 'An Error Occurred On The SOAP Server',
                                        });
                                    }

                                    var responseClientUpdate = resp.return.$value ? JSON.parse(resp.return.$value) : false;

                                    if (responseClientUpdate) {
                                        if (responseClientUpdate.status == 'err') {
                                            return res.status(200).send({
                                                status: response.status,
                                                message: responseClientUpdate.message
                                            });
                                        } else if (responseClientUpdate.status == 'success' &&
                                            responseClientUpdate.message == 'Token and session_id successfully registered') {

                                            var transporter = nodemailer.createTransport({
                                                service: 'gmail',
                                                auth: {
                                                    user: 'sendtestemail290@gmail.com',
                                                    pass: 'test.290'
                                                }
                                            });

                                            var mailOptions = {
                                                from: 'sendtestemail290@gmail.com',
                                                to: responseClient.response.email,
                                                subject: 'Token',
                                                html:
                                                    ` <div> 
                                                        <h1>CONFIRMATION OF REQUEST FOR PAYMENT</h1> 
                                                        <h2>Token Generated</h2> 
                                                        <h3>`+ token + `</h3> 
                                                    </div>`
                                            };

                                            transporter.sendMail(mailOptions, function (err, info) {
                                                if (err) {
                                                    return res.status(200).send({
                                                        status: 'err',
                                                        message: 'Error sending confirmation token, generate new payment order'
                                                    });


                                                } else {
                                                    var data = {
                                                        id: responseClient.response.id,
                                                        amount_payable: params.amount_payable,
                                                        token: token,
                                                        session_id: req.sessionID
    
                                                    };
    
                                                    return res.status(200).send({
                                                        status: 'success',
                                                        message: 'Payment In Process, Token Sent To Your email',
                                                        resp: data
                                                    });
                                                }
                                                
                                            });
                                        }
                                    } else {
                                        return res.status(500).send({
                                            status: 'err',
                                            message: 'An Error Occurred On The SOAP Server',
                                        });
                                    }
                                });
                            }

                        } else if (responseClient.status == 'err') {
                            return res.status(200).send({
                                status: 'err',
                                message: responseClient.message
                            });
                        }

                    } else {
                        return res.status(500).send({
                            status: 'err',
                            message: 'An Error Occurred On The SOAP Server',
                        });
                    }

                });

            });

        } else {
            return res.status(200).send({
                status: 'err',
                message: 'Data Not Validated'
            });
        }
    },
    confirmPayment: function (req, res) {
        var params = req.body;
        try {
            var validate_id = !validator.isEmpty(params.id);
            var validate_amount_payable = !validator.isEmpty(params.amount_payable);
            var validate_token = !validator.isEmpty(params.token);
            var validate_session_id = !validator.isEmpty(params.session_id);
        } catch (err) {
            return res.status(200).send({
                status: 'err',
                message: 'Missing data to send'
            });
        }
        if (validate_id && validate_amount_payable && validate_token && validate_session_id) {

            soap.createClient(urlWsdlDoc, options, (err, client) => {

                if (err) {
                    return res.status(404).send({
                        status: 'err',
                        message: 'Configuration file not found .wsdl'
                    });
                }

                var dataGet = {
                    id: params.id
                };

                client.confirmPayment(dataGet, (err, resp) => {
                    if (err) {
                        return res.status(500).send({
                            status: 'err',
                            message: 'An error occurred on the SOAP server'
                        });
                    }

                    var responseClient = resp.return.$value ? JSON.parse(resp.return.$value) : false;

                    if (responseClient.response.token == params.token
                        && responseClient.response.session_id == params.session_id) {

                        let balanceUpdate = parseFloat(responseClient.response.balance) - parseFloat(params.amount_payable);

                        var dataUpdate = {
                            id: responseClient.response.id,
                            balance: balanceUpdate,
                            token: null,
                            session_id: null
                        };

                        client.confirmPayment(dataUpdate, (err, resp) => {
                            if (err) {
                                return res.status(500).send({
                                    status: 'err',
                                    message: 'An error occurred on the SOAP server',
                                });
                            }

                            var response = resp.return.$value ? JSON.parse(resp.return.$value) : false;

                            if (response) {
                                return res.status(200).send({
                                    status: response.status,
                                    message: response.message
                                });
                            } else {
                                return res.status(500).send({
                                    status: 'err',
                                    message: 'An error occurred on the SOAP server',
                                });
                            }
                        });
                    } else {
                        return res.status(200).send({
                            status: 'err',
                            message: 'Error validating token'
                        });
                    }
                });
            });
        } else {
            return res.status(200).send({
                status: 'err',
                message: 'Data not validated'
            });
        }

    },
    checkBalance: function (req, res) {
        var params = req.params;
        try {
            var validate_dni = !validator.isEmpty(params.dni);
            var validate_phone = !validator.isEmpty(params.phone);
        } catch (err) {
            return res.status(200).send({
                status: 'err',
                message: 'Missing Data To Send'
            });
        }
        if (validate_dni && validate_phone) {
            var dataGet = {
                dni: params.dni,
                phone: params.phone
            };
            CutomerService.soapServer(dataGet, res, 'checkBalance');
        } else {
            return res.status(200).send({
                status: 'err',
                message: 'Data Not Validated'
            });
        }

    }
};

module.exports = controller;


