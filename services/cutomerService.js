var soap = require('strong-soap').soap;

exports.soapServer  = ((data,res,clientServer) => {

    var urlWsdlDoc = 'http://wsdl.doc/soapServer.wsdl';
    var options = {};

    try {
        soap.createClient(urlWsdlDoc, options, (err, client) => {
            if (err) {
                return res.status(404).send({
                    status: 'err',
                    message: 'Configuration File Not Found .wsdl'
                });
            }
            switch (clientServer) {
                case 'registerCustomer':
                    client.registerCustomer(data, (err, resp) => {
                        if(err) {
                            return res.status(500).send({
                                status: 'err',
                                message: 'An Error Occurred On The SOAP Server'
                            });
                        }
                        var response = resp.return.$value ? JSON.parse(resp.return.$value) : false;
                        if(response) {
                            return res.status(200).send({
                                status: response.status,
                                message: response.message
                            });
                        } else{
                            return res.status(500).send({
                                status: 'err',
                                message: 'An Error Occurred On The SOAP Server',
                            });
                        }
                    });
                  break;
                case 'rechargeWallet':
                    client.rechargeWallet(data, (err, resp) => {
                        if(err) {
                            return res.status(500).send({
                                status: 'err',
                                message: 'An Error Occurred On The SOAP Server',
                            });
                        }

                        var response = resp.return.$value ? JSON.parse(resp.return.$value) : false;
                        if(response) {
                            return res.status(200).send({
                                status: response.status,
                                message: response.message
                            });
                        } else{
                            return res.status(500).send({
                                status: 'err',
                                message: 'An Error Occurred On The SOAP Server',
                            });
                        }
                    });
                  break
                  case 'checkBalance':
                    client.checkBalance(data, (err, resp) => {
                        if(err) {
                            return res.status(500).send({
                                status: 'err1',
                                message: 'An Error Occurred On The SOAP Server'
                            });
                        }
                        var response = resp.return.$value ? JSON.parse(resp.return.$value) : false;
                        if(response) {
                            if(response.balance == null && response.status == 'success'){
                                return res.status(200).send({
                                    status: response.status,
                                    balance:0.00
                                });
                            
                            } else if(response.message == 'Customer Not Registered') {
                                console.log(response);
                                return res.status(200).send({
                                    status: response.status,
                                    message: response.message
                                });
                            } else {
                                return res.status(200).send({
                                    status: response.status,
                                    balance: response.balance
                                });
                            } 
                            
                        } else{
                            return res.status(500).send({
                                status: 'err2',
                                message: 'An Error Occurred On The SOAP Server',
                            });
                        }
                    });
                  break
              }
        }); 
    } catch (e) {    
        return res.status(500).send({
            status: 'err3',
            message: 'An Error Occurred On The SOAP Server'
        });
    }
    
  });

  
