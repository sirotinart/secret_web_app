/**
 * Created by art on 22.02.16.
 */
var mysql = require('mysql');
var crypto = require('crypto');
var session = require('express-session')

var options = {
    host: 'localhost',
    port: 3306,
    user: 'art',
    password: '96830217',
    database: 'test'
};

var login=function (req,res)
{
    var regCode=req.body['regCode'];
    var password=req.body['password'];
    console.log('login');
    var response;

    var passwordHash=crypto.createHash('sha256').update(password).digest('hex');
    var connection = mysql.createConnection(options);

    connection.query('select REG_NUMBER, PASSWORD, SUPPLIER_ID from SUPPLIER where REG_NUMBER = ? and PASSWORD= ?', [regCode, passwordHash],
    function(err, rows, fields){
        if(err)
        {
            response={
                success: false,
                errorText: 'Ошибка входа в систему'
            };
            //res.send(response);
        }
        else
        {
            if(typeof (rows)!=='undefined' && rows.length==0)
            {
                response={
                    success: false,
                    errorText: "Неверный логин\пароль!"
                };
                //res.send(response);
            }
            else
            {
                if(rows.length===1)
                {
                    response={
                        success: true,
                        redirectUrl: '/account'
                    };
                    req.session.hash=crypto.createHash('sha256').update(regCode).digest('hex');
                    req.session.username=regCode;
                    req.session.sid=rows[0]['SUPPLIER_ID'];
                    //res.redirect('/account');
                    //res.statusCode=302;
                    //res.set('location', '/account');

                }

            }
        }
        res.send(response);
        connection.end();
    })


};

function isAuthorized(req, res, next)
{
    var connection = mysql.createConnection(options);
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
            //res.sendFile('/html/account.html', resoptions);
        }
        else
        {
            req.authorized=false;
        }
        connection.end();
        next();
    })
};

function mobileLogin(req, res, next)
{
    req.response={success: true};
    var passHash=crypto.createHash('sha256').update(req.body.password).digest('hex');
    var connection = mysql.createConnection(options);

    connection.query('select * from USER where LOGIN = ? and PASSWORD = ?', [req.body.login, passHash], function(err, rows){
        if(err)
        {
            console.log('mobileLogin() error:', err.code);
            req.response.success=false;
            req.response.errorText='Ошибка запроса';
            connection.end();
            next();
            return;
        }

        if(rows.length===0)
        {
            req.response.success=false;
            req.response.errorText='Неверный логин/пароль';
            
        }
        connection.end();
        next();
    });
};


module.exports.isAuthorized=isAuthorized;
module.exports.login=login;
module.exports.mobileLogin=mobileLogin;