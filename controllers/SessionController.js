var mysql = require('mysql');
var crypto = require('crypto');
var session = require('express-session')
var dbconfig = require('../config/dbconf');

var sessionControler={}

sessionControler.checkAuth = function (req, res, next)
{
    var connection = mysql.createConnection(dbconfig);
    connection.query('select session_id from sessions where session_id = ?',[req.session.id], function(err,rows,fields){
        if(err)
        {
            console.log('error while checking authorization!', err.code);
            req.authorized=false;
            connection.end();
            next();
            return;
        }
        if(rows.length===1)
        {
            req.authorized=true;
        }
        else
        {
            req.authorized=false;
        }
        connection.end();
        next();
    })
};

sessionControler.sellerLogin = function (req, res, next)
{
    req.response = {};

    if(req.body.password.length===0 || req.body.regCode.length===0)
    {
    	req.response.success=false;
        req.response.errorText="Неверный логин\пароль";
        next();
        return;
    }

    var passwordHash=crypto.createHash('sha256').update(req.body.password).digest('hex');
    var connection = mysql.createConnection(dbconfig);

    connection.query('select REG_NUMBER, PASSWORD, SUPPLIER_ID from SUPPLIER where REG_NUMBER = ? and PASSWORD= ?', [req.body.regCode, passwordHash],
    function(err, rows, fields){
        if(err)
        {
            console.log('sellerLogin() error:', err.code)
            req.response.success=false;
            req.response.errorText='Ошибка входа в систему';
            connection.end();
            next();
            return;
        }

    	if(rows.length===1)
        {
            req.response.success=true;
            req.response.redirectUrl='/account';

            req.session.hash=crypto.createHash('sha256').update(req.body.regCode).digest('hex');
            req.session.username=req.body.regCode;
            req.session.sid=rows[0]['SUPPLIER_ID'];
        }
        else
        {
            req.response.success=false;
            req.response.errorText = "Неверный логин\пароль!";
        }
        connection.end();
        next();
    });
};

sessionControler.sellerLogout = function (req, res, next)
{
	req.response={};
	if(req.authorized===true)
	{
		req.session.destroy();
		req.response.success=true;
		req.response.redirectUrl='/';
	}
	next();
}

sessionControler.userLogin = function userLogin(req, res, next)
{
    var passHash=crypto.createHash('sha256').update(req.body.password).digest('hex');
    var connection = mysql.createConnection(dbconfig);

    connection.query('select * from USER where LOGIN = ? and PASSWORD = ?', [req.body.login, passHash], function(err, rows){
        if(err)
        {
            console.log('sessionControler userLogin() error:', err.code);
            req.response.success=false;
            req.response.errorText='Ошибка запроса';
            connection.end();
            next();
            return;
        }

        if(rows.length===1)
        {
            req.response.success=true;
        }
        else
        {
        	req.response.success=false;
            req.response.errorText='Неверный логин/пароль';
        }
        connection.end();
        next();
    });
};

sessionControler.checkAccess = function(req, res, next)
{
    if(req.authorized)
    {
        if(req.params.id===req.session.username)
        {
            req.acsessGranted=true;
            // console.log('checkAcsess(): ', req.url, req.session.username, 'acsess granted!');
        }
        else
        {
            req.acsessGranted=false;
            // console.log('checkAcsess(): ', req.url, req.session.username, 'acsess denied!');
        }
    }
    else
    {
        req.acsessGranted=false;
    }
    next();
}

module.exports = sessionControler;