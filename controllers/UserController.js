var mysql = require('mysql');
var crypto = require('crypto');
const fs = require('fs');
var path = require('path');
var dbconfig = require('../config/dbconf');
var address = require('./AddressController')

var userController = {}

userController.create = function (req, res, next)
{

    validateRegData(req);

    if(req.response.success===true)
    {
        //var connection=mysql.createConnection(options); 
        checkExistence(req, res, function(){
            if(req.response.success===false)
            {
                next();
                return;
            }
            address.checkExistence(req, res, function(){    //сделать обращение к addressController
                if(req.response.success===false)
                {
                    next();
                    return;
                }
                save(req, res, function() {
                    // if(req.response.success===false)
                    // {
                    //     next();
                    //     return;
                    // }

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


    if(req.body.login.length===0)
    {
        req.response.success=false;
        req.response.errors[1]='Поле не может быть пустым!';
    }
    else
    {
        if(!validateEmail(req.body.login))
        {
            req.response.success=false;
            req.response.errors[1]='Некорректный e-mail!';
        }
    }

    console.log('checkUserRegistrationData():', '3');

    if(req.body.firstName.length===0)
    {
        req.response.success=false;
        req.response.errors[2]='Поле не может быть пустым!';
    }

    console.log('checkUserRegistrationData():', '4');

    if(req.body.lastName.length===0)
    {
        req.response.success=false;
        req.response.errors[3]='Поле не может быть пустым!';
    }

    if(req.body.city.length===0)
    {
        req.response.success=false;
        req.response.errors[4]='Поле не может быть пустым!';
    }

    if(req.body.password.length<4 || req.body.password.length>10 )
    {
        req.response.success=false;
        req.response.errors[5]='Пароль должен быть от 5 до 9 символов!';
    }

    // console.log('checkUserRegistrationData():',req.response.success, req.response.errors)
}

function validateEmail(email) 
{
    // console.log('validateEmail():', '1');

    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 

function checkExistence(req, res, next)
{
    var connection=mysql.createConnection(options);
    console.log(req.response);

    connection.query('select LOGIN from USER where LOGIN = ?',[req.body.login], function(err, rows){
        if(err)
        {
            console.log('checkUserExistence() error:',err.code);
            req.response.success=false;
            req.response.errorText='Ошибка запроса';
            connection.end();
            next(); 
            return;
        }

        if(rows.length!==0)
        {
            req.response.success=false;
            req.response.errorText='Логин занят';
        }

        // console.log(req.response, 'lkfjgskgnk');
        connection.end();
        next(); 
    });
}

function save(req, res, next)
{
    var connection=mysql.createConnection(options);

    connection.beginTransaction(function(err){
        if(err)
        {
            console.log('saveMobileUser() error:', err.code);
            req.response.success=false;
            req.response.errorText='Ошибка запроса';
            connection.end();
            next();
            return;
        }
        var passHash=crypto.createHash('sha256').update(req.body.password).digest('hex');
        connection.query('insert into USER (LOGIN, PASSWORD, ADDRESS, FIRST_NAME, LAST_NAME) values (?, ?, ?, ?, ?)',
            [req.body.login, passHash, req.body.city, req.body.firstName, req.body.lastName], function(err){
                if(err)
                {
                    console.log('saveMobileUser() error:', err.code);
                    req.response.success=false;
                    req.response.errorText='Ошибка запроса';
                    connection.rollback();
                    connection.end();
                    next();
                    return;
                }
                connection.commit(function(err){
                    if(err)
                    {
                        console.log('saveMobileUser() error:', err.code);
                        req.response.success=false;
                        req.response.errorText='Ошибка запроса';
                        connection.rollback();
                    }
                    connection.end();
                    next();
                    return;
                });
            });
    });
}

module.exports = userController;