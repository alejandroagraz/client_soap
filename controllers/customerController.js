'use strict'

const validator = require('validator');
const CreateSoapClient = require('../services/createSoapClientService');
const {createToken, decodeToken} = require('../services/tokenService');
const nodemailer = require('nodemailer');
const randtoken = require('rand-token');
const bcrypt = require('bcryptjs');
const soap = require('strong-soap').soap;

var urlWsdlDoc = 'http://wsdl.doc/soapServer.wsdl';
var options = {};

var controller = {

    login: function (req, res){

        var params = req.body;

        try {
            var validate_email = !validator.isEmpty(params.email);
            var validate_password = !validator.isEmpty(params.password);

        } catch (err) {
            return res.status(200).send({
                status: 'err',
                message: 'Missing Data To Send'
            });
        }

        if (validate_email && validate_password) {

            soap.createClient(urlWsdlDoc, options, (err, client) => {

                if (err) {
                    return res.status(404).send({
                        status: 'err',
                        message: 'Configuration File Not Found .wsdl'
                    });
                }

                var setdata = {
                    email: params.email,
                };

                client.login(setdata, (err, resp) => {
                    if (err) {
                        return res.status(500).send({
                            status: err,
                            message: 'An Error Occurred On The SOAP Server',
                        });
                    }

                    var responseClient = resp.return.$value ? JSON.parse(resp.return.$value) : false;

                    if (responseClient) {

                        if (responseClient.status == 'success') {

                            bcrypt.compare(params.password, responseClient.response.password, (err, resp) => {

                                if (err){
                                    return res.status(200).send({
                                        status: 'err',
                                        message: 'Username or password is incorrect'
                                    });
                                }

                                if (resp) {

                                    let token = createToken(responseClient.response);        

                                    var data = {
                                        id: token.id,
                                        token: token.token_encode,
                                        expiration_date: token.expiration_date
                                    };

                                    client.login(data, (err, resp) => {
                                        if (err) {
                                            return res.status(500).send({
                                                status: err,
                                                message: 'An Error Occurred On The SOAP Server',
                                            });
                                        }

                                        var responseClient = resp.return.$value ? JSON.parse(resp.return.$value) : false;

                                        if(responseClient) {

                                            if (responseClient.status == 'success') { 

                                                return res.status(200).send({
                                                    status: 'success',
                                                    message: responseClient.message,
                                                    token : responseClient.token
                                                });

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
                                           
                                } else {
                                    return res.status(200).send({
                                        status: 'err',
                                        message: 'Username or password is incorrect'
                                    });
                                }
                            });

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
                status: 'error',
                message: 'Data Not Validated'
            });
        }

    },
    registerCustomer: function (req, res) {
        
        var params = req.body;
        try {

            var validate_email = !validator.isEmpty(params.email);
            var validate_password = !validator.isEmpty(params.password);
            var validate_dni = !validator.isEmpty(params.dni);
            var validate_name = !validator.isEmpty(params.name);
            var validate_last_name = !validator.isEmpty(params.last_name);
            var validate_phone = !validator.isEmpty(params.phone);

        } catch (err) {
            return res.status(200).send({
                status: 'err',
                message: 'Missing Data To Send'
            });
        }
        if (validate_email && validate_password && validate_dni && 
            validate_name && validate_last_name && validate_phone) {
            var data = {
                email: params.email,
                password : bcrypt.hashSync(params.password,8),
                dni: params.dni,
                name: params.name,
                last_name: params.last_name,
                phone: params.phone.replace(/[-+()\s]/g, '')
            };
            CreateSoapClient.soapServer(data, res, 'registerCustomer');
        } else {
            return res.status(200).send({
                status: 'err',
                message: 'Data Not Validated'
            });
        }
    },
    rechargeWallet: function (req, res) {
        var params = req.body;
        var token = req.headers.authorization.split(" ")[1];
        try {
            var validate_dni = !validator.isEmpty(params.dni);
            var validate_phone = !validator.isEmpty(params.phone);
            var validate_balance = !validator.isEmpty(params.balance);
            var validate_token = !validator.isEmpty(token);
        } catch (err) {
            return res.status(200).send({
                status: 'err',
                message: 'Missing Data To Send'
            });
        }
        if (validate_dni && validate_phone && validate_balance && validate_token) {
            if(params.balance != 0){
                var data = {
                    dni: params.dni,
                    phone: params.phone.replace(/[-+()\s]/g, ''),
                    balance: params.balance,
                    token: token
                };
                CreateSoapClient.soapServer(data, res, 'rechargeWallet');
            } else {
                return res.status(200).send({
                    status: 'err',
                    message: 'The amount to recharge must be greater than zero'
                });
            }
            
        } else {
            return res.status(200).send({
                status: 'err',
                message: 'Data Not Validated'
            });
        }
    },
    payment: function (req, res) {
        var params = req.body;
        var token = req.headers.authorization.split(" ")[1];
        try {
            var validate_dni = !validator.isEmpty(params.dni);
            var validate_phone = !validator.isEmpty(params.phone);
            var validate_amount_payable = !validator.isEmpty(params.amount_payable);
            var validate_token = !validator.isEmpty(token);
        } catch (err) {
            return res.status(200).send({
                status: 'err',
                message: 'Missing Data To Send'
            });
        }

        if (validate_dni && validate_phone && validate_amount_payable && validate_token) {

            if(params.amount_payable != 0){

                soap.createClient(urlWsdlDoc, options, (err, client) => {
                    var data = {
                        dni: params.dni,
                        phone: params.phone.replace(/[-+()\s]/g, ''),
                        amount_payable: params.amount_payable,
                        token: token
                    };

                    if (err) {
                        return res.status(404).send({
                            status: 'err',
                            message: 'Configuration File Not Found .wsdl'
                        });
                    }

                    client.payment(data, (err, resp) => {
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

                                    var token_email = randtoken.generate(6);

                                    var dataUpdate = {
                                        id: responseClient.response.id.toString(),
                                        token_email: bcrypt.hashSync(token_email,8),
                                        session_id: req.sessionID,
                                        token: token
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
                                                            <h3>`+ token_email + `</h3> 
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
                                                            id: responseClient.response.id.toString(),
                                                            amount_payable: params.amount_payable,
                                                            token_email: token_email,
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
                    message: 'Amount to pay must be greater than zero'
                });
            }

        } else {
            return res.status(200).send({
                status: 'err',
                message: 'Data Not Validated'
            });
        }
    },
    confirmPayment: function (req, res) {
        var params = req.body;
        var token = req.headers.authorization.split(" ")[1];

        try {
            var validate_id = !validator.isEmpty(params.id);
            var validate_amount_payable = !validator.isEmpty(params.amount_payable);
            var validate_token_email = !validator.isEmpty(params.token_email);
            var validate_session_id = !validator.isEmpty(params.session_id);
            var validate_token = !validator.isEmpty(token);
            
        } catch (err) {
            return res.status(200).send({
                status: 'err',
                message: 'Missing data to send'
            });
        }
        if (validate_id && validate_amount_payable && validate_token_email && validate_session_id && validate_token) {

            soap.createClient(urlWsdlDoc, options, (err, client) => {

                if (err) {
                    return res.status(404).send({
                        status: 'err',
                        message: 'Configuration file not found .wsdl'
                    });
                }

                var data = {
                    id: params.id,
                    token: token
                };

                client.confirmPayment(data, (err, resp) => {
                    if (err) {
                        return res.status(500).send({
                            status: 'err',
                            message: 'An error occurred on the SOAP server'
                        });
                    }  

                    var responseClient = resp.return.$value ? JSON.parse(resp.return.$value) : false;

                    if (responseClient) {

                        if (responseClient.status == 'success') {

                            if (responseClient.response.token_email != null && bcrypt.compareSync(params.token_email, responseClient.response.token_email)
                                && responseClient.response.session_id == params.session_id) {

                                let balanceUpdate = parseFloat(responseClient.response.balance) - parseFloat(params.amount_payable);

                                var dataUpdate = {
                                    id: responseClient.response.id,
                                    token: token,
                                    balance: balanceUpdate,
                                    token_email: null,
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

                        } else if (responseClient.status == 'err') {
                            return res.status(200).send({
                                status: 'err',
                                message: responseClient.message
                            });
                        }
                    }
                    else {
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
                message: 'Data not validated'
            });
        }

    },
    checkBalance: function (req, res) {
        var params = req.params;
        var token = req.headers.authorization.split(" ")[1];
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
            var data = {
                dni: params.dni,
                phone: params.phone.replace(/[-+()\s]/g, ''),
                token: token
            };
            CreateSoapClient.soapServer(data, res, 'checkBalance');
        } else {
            return res.status(200).send({
                status: 'err',
                message: 'Data Not Validated'
            });
        }

    },
    logout: function (req, res){

        var token = req.headers.authorization.split(" ")[1];

        try {
            var validate_token = !validator.isEmpty(token);
        } catch (err) {
            return res.status(200).send({
                status: 'err',
                message: 'Missing Data To Send'
            });
        }
        if (validate_token) {
            var payload = decodeToken(token);
            var data = {
                id: payload.id,
                token: token,
                expiration_date: payload.expiration_date
            };
            CreateSoapClient.soapServer(data, res, 'logout');
        } else {
            return res.status(200).send({
                status: 'err',
                message: 'Data Not Validated'
            });
        }

    }
};

module.exports = controller;


