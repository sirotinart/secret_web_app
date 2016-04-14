/**
 * Created by art on 20.02.16.
 */
var mysql = require('mysql');
var crypto = require('crypto');
const fs = require('fs');
var path = require('path');

var options = {
    host: 'localhost',
    port: 3306,
    user: 'art',
    password: '96830217',
    database: 'test'
};

function checkUser(req, res, next)
{
    var regCode=req.body['regCode'];
    var password=req.body['password'];
    console.log('in recorder');

    var connection = mysql.createConnection(options);

    connection.query('select REG_NUMBER from SUPPLIER where REG_NUMBER = ?',[regCode],function(err,rows,field){
        console.log('in query');
        var response;
        if(err)
        {
            response={
                error: true,
                errorCode: 2,
                errorText: 'Ошибка регистрации!'
            };

            res.send(response);
            connection.end();
            return;
        }

        if(typeof (rows)!=='undefined' && rows.length===0)
        {
            //var passHash=crypto.createHash('sha256').update(password).digest('hex');
            //connection.query('insert into SUPPLIER (REG_NUMBER, PASSWORD) values (?, ?)', [regCode,passHash], function(err){
            //    if(err)
            //    {
            //        response={
            //            error: true,
            //            errorCode: 2,
            //            errorText: 'Ошибка регистрации'
            //        };
            //        res.send(response);
            //        connection.end();
            //    }
            //    else
            //    {
            //        response={
            //            error: false,
            //            errorCode: 0
            //        };
            //        res.send(response);
            //        connection.end();
            //    }
            //
            //})
            connection.end();
            next();
        }
        else
        {
            response={
                error: true,
                errorCode: 1,
                errorText: 'Пользователь с таким кодом уже существует!'
            };

            res.send(response);
            connection.end();
        }


    });
}

function checkCity(req, res, next)
{
    var city=req.body['city'];

    var connection=mysql.createConnection(options);

    connection.query('select * from ADRESS where CITY = ?', [city], function(err, rows, fields){

        var response;

        if(err)
        {
            response={
                error: true,
                errorCode: 2,
                errorText: 'Ошибка регистрации!'
            };

            res.send(response);
            connection.end();
            return;
        }

        if(typeof (rows)!=='undefined' && rows.length!==0)
        {
            connection.end();
            next();
        }
        else
        {
            response={
                error: true,
                errorCode: 2,
                errorText: 'Вы ввели город не из списка!'
            };

            res.send(response);
            connection.end();
        }
    })

}


function saveUser(req,res,next){

    var regCode=req.body['regCode'];
    var password=req.body['password'];
    var city=req.body['city'];
    var name=req.body['name'];
    console.log('in recorder');

    var response;

    if(name.length===0)
    {
        response={
            error: true,
            errorCode: 4,
            errorText: 'Название организаци не может быть пустым!'
        };
        res.send(response);
        connection.end();
        return;
    }

    var connection = mysql.createConnection(options);
    var passHash=crypto.createHash('sha256').update(password).digest('hex');
    connection.beginTransaction(function(err){
        if(err)
        {
            response={
                error: true,
                errorCode: 2,
                errorText: 'Ошибка регистрации!'
            };
            res.send(response);
            connection.end();
            return;
        }
        connection.query('insert into SUPPLIER (REG_NUMBER, PASSWORD, NAME, CITY) values (?, ?, ?, ?)', [regCode,passHash,name,city], function(err){

            if(err)
            {
                response={
                    error: true,
                    errorCode: 2,
                    errorText: 'Ошибка регистрации!'
                };
                res.send(response);
                connection.rollback();
            }
            else
            {

                connection.commit(function(err){
                    if(err){
                        response={
                            error: true,
                            errorCode: 2,
                            errorText: 'Ошибка регистрации!'
                        };
                        res.send(response);
                        connection.rollback();
                    }
                    else
                    {
                        response={
                            error: false,
                            errorCode: 0
                        };
                        fs.mkdir(path.join(__dirname, 'private', regCode));
                        res.send(response);
                    }
                });

            }
            connection.end();
        });


    })

}

function registerUser(req, res, next)
{
    console.log('registerUser():', '1');

    req.response={success: true};

    console.log('registerUser():', '2');

    checkUserRegistrationData(req);

    console.log('registerUser():', '3');

    if(req.response.success===true)
    {
        //var connection=mysql.createConnection(options); 
        checkUserExistence(req, res, function(){
            if(req.response.success===false)
            {
                next();
                return;
            }
            checkCity2(req, res, function(){
                if(req.response.success===false)
                {
                    next();
                    return;
                }
                saveMobileUser(req, res, function() {
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

function checkUserRegistrationData(req)
{
    console.log('checkUserRegistrationData():', '1');

    req.response.errors=['','','','',''];

    console.log('checkUserRegistrationData():', '2');


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

    console.log('checkUserRegistrationData():',req.response.success, req.response.errors)
}

function validateEmail(email) 
{
    console.log('validateEmail():', '1');

    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 

function checkUserExistence(req, res, next)
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

        console.log(req.response, 'lkfjgskgnk');
        connection.end();
        next(); 
    });
}

function saveMobileUser(req, res, next)
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
                })
            })
    })
}


function checkCity2(req, res, next)
{
    var connection=mysql.createConnection(options);

    connection.query('select * from ADDRESS where CITY = ?', [req.body.city], function(err, rows, fields){

        if(err)
        {
            console.log('checkCity2() error:', err.code);
            req.response.success=false;
            req.response.errorText='Ошибка запроса';
            connection.end();
            next();
            return;
        }

        if(rows.length===0)
        {
            req.response.success=false;
            req.response.errorText='Введен город не из списка';
        }
        connection.end();
        next();
    })

}

module.exports.saveUser=saveUser;
module.exports.checkUser=checkUser;
module.exports.checkCity=checkCity;
module.exports.registerUser=registerUser;