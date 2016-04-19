var mysql = require('mysql');
var crypto = require('crypto');
const fs = require('fs');
var path = require('path');
var dbconfig = require('../config/dbconf');
var address = require('./AddressController')


var sellerController = {}

sellerController.getSeller = function (req,res,next)
{
    req.response={};

    if(!req.authorized)
    {
    	req.response.success=false;
    	req.response.redirectUrl='/';
    	req.response.errorText='Не авторизован';
    	next();
    	return;
    }
    
    var connection=mysql.createConnection(dbconfig);

    var filename=path.join(__dirname, '../private', req.session.username) + '/avatar.jpg';
   
    connection.query('select REG_NUMBER, NAME, CITY from SUPPLIER where SUPPLIER_ID = ?', [req.session.sid], function(err,rows){
        if(err)
        {
        	console.log('getSeller() error:', err.code);
            req.response.success=false;
            req.response.errorText='Ошибка обращения к БД!';
            connection.end();

            next();
            return;
        }

        
        req.response.success=true;
        req.response.data=rows[0];

        connection.end();

        fs.stat(filename, function(err, stats){
	        if(err) 
	        {
	        	console.log('getSeller() error:', err.code);
	            req.response.data.avatar='/images/default_avatar.jpg';
	        }
	        else
	        {
	            if(stats.isFile())
	            {
	                req.response.data.avatar=path.join('private', req.session.username) + '/avatar.jpg';
	            }
	            else
	            {
	                req.response.data.avatar='/images/default_avatar.jpg';
	            }
	        }

	        next();
	    });
    });
}


sellerController.create = function (req, res, next)
{

    validateRegData(req);

    if(req.response.success===true)
    {
        checkExistence(req, res, function(){
            if(req.response.success===false)
            {
                next();
                return;
            }
            address.checkExistence(req, res, function(){    
                if(req.response.success===false)
                {
                    next();
                    return;
                }
                save(req, res, function() {

                    next();
                });
            });
        });
    }
    else
    {
        next();
    }
}

function validateRegData(req)
{
	req.response={success: true};

    req.response.errors=['','','','',''];


    if(req.body.regCode.length===0)
    {
        req.response.success=false;
        req.response.errors[0]='Поле не может быть пустым!';
    }

    if(req.body.name.length===0)
    {
        req.response.success=false;
        req.response.errors[1]='Поле не может быть пустым!';
    }

    if(req.body.city.length===0)
    {
        req.response.success=false;
        req.response.errors[3]='Поле не может быть пустым!';
    }

    if(req.body.password.length<4 || req.body.password.length>10 )
    {
        req.response.success=false;
        req.response.errors[2]='Пароль должен быть от 5 до 9 символов!';
    }

}

function save(req,res,next)
{

    req.response={}

    var connection = mysql.createConnection(dbconfig);
    var passHash=crypto.createHash('sha256').update(req.body.password).digest('hex');

    connection.beginTransaction(function(err){
        if(err)
        {
        	console.log('SellerController save() error:', err.code);
        	req.response.success=false;
        	req.errorText='Ошибка запроса';

        	connection.rollback();
        	connection.end();
        	next();
        	return;
        }
        connection.query('insert into SUPPLIER (REG_NUMBER, PASSWORD, NAME, CITY) values (?, ?, ?, ?)', 
        	[req.body.regCode,passHash,req.body.name,req.body.city], function(err){

            if(err)
            {
            	console.log('SellerController save() error:', err.code);

            	req.response.success=false;
            	req.response.errorText='Ошибка запроса';
            	connection.rollback();
            	connection.end();
            	next();
            	return;

            }

            connection.commit(function(err){
                if(err){
                	console.log('SellerController save() error:', err.code);

                	req.response.success=false;
                	req.response.errorText='Ошибка запроса';
                	connection.rollback();
                	
                }
                else
                {
                	req.response.success=true;

                    fs.mkdir(path.join(__dirname, '..','private', req.body.regCode), function (err){
                        if(err) console.log(err);
                    });
                }
                connection.end();
                next();
            });
        });
    });
}

function checkExistence(req, res, next)
{

    var connection = mysql.createConnection(dbconfig);
    req.response = {}

    connection.query('select REG_NUMBER from SUPPLIER where REG_NUMBER = ?',[req.body.regCode],function(err,rows,field){
        var response;
        if(err)
        {
        	console.log('SellerController checkExistense() error:', err.code);
        	req.response.success=false;
        	req.response.errorText='Ошибка запроса'
            connection.end();
            next();
            return;
        }

        if(rows.length===0)
        {
        	req.response.success=true;
        }
        else
        {
        	req.response.success=false;
        	req.response.errorText='Пользователь существует'
        }

        connection.end();
        next();
    });
}


module.exports = sellerController;