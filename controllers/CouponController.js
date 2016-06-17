var mysql = require('mysql');
var dbconfig = require('../config/dbconf');
const fs = require('fs');
var path = require('path');
var moment = require('moment');
var Uploads = require('./UploadController');

var couponController = {};

couponController.getCoupon = function (req, res, next)
{
    // console.log(req.params);

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

    // console.log(req.body.couponId, req.session.sid);
    connection.query('select COUPON.*, SUPPLIER.SUPPLIER_ID, SUPPLIER.NAME from COUPON join SUPPLIER ' + 
        'where COUPON.SUPPLIER_ID = SUPPLIER.SUPPLIER_ID and COUPON_ID = ?', 
        [req.params.id], function(err, rows){
        if(err)
        {
            console.log(err.code)
            req.response.success=false;
            req.response.errorText='Ошибка обращения к БД!'
            connection.end();
            next();
            return;
        }

        if(rows.length===1)
        {
            if(rows[0].CREATION_DATE)
            {
                var date=moment(rows[0].CREATION_DATE);
                rows[0].CREATION_DATE=date.format('YYYY-MM-DD');
            }

            if(rows[0].EXPIRATION_DATE)
            {
                var date=moment(rows[0].EXPIRATION_DATE);
                rows[0].EXPIRATION_DATE=date.format('YYYY-MM-DD');
            }

            req.response.success=true;
            req.response.coupon=rows[0];
            req.response.coupon.promoImgUrl=path.join('../private', rows[0].SUPPLIER_ID.toString(), 'img') + 
            '/' + req.params.id + '.jpg';
        }
        else
        {
            req.response.success=false;
            req.response.errorText='Купон не найден!'
        }
        connection.end();
        next();
    });
}

couponController.getList = function (req, res, next)
{
    // console.log('couponController getList()');
	req.response={};

	if(!req.authorized)
	{
		req.response.success=false;
		req.response.redirectUrl='/';
		req.response.errorText='Не авторизован';
		next();
		return;
	}
    // console.log('couponController getList()', '1');


    var connection = mysql.createConnection(dbconfig);
    // console.log('couponController getList()', '2');

    connection.query('select COUPON.COUPON_ID, SHORT_DESCRIPTION, CREATION_DATE, EXPIRATION_DATE, COUNT, ' +
        '(select COUNT(*) from PURCHASE where COUPON.COUPON_ID = PURCHASE.COUPON_ID) as SELL_COUNT ' +
        'from COUPON where SUPPLIER_ID = ?', [req.session.sid], function(err, rows, fields){
        if(err)
        {
            console.log('couponController getList() error:', err.code);
            req.response.success=false;
            req.response.errorText='Ошибка обращения к БД!';
        }
        else
        {
            // console.log('couponController getList()', '3');

            for(var i=0; i<rows.length; i++)
            {
                var date=rows[i]['CREATION_DATE'].getDate()+'.'+(rows[i]['CREATION_DATE'].getMonth()+1)+'.'+rows[i]['CREATION_DATE'].getFullYear();
                var date2=rows[i]['EXPIRATION_DATE'].getDate()+'.'+(rows[i]['EXPIRATION_DATE'].getMonth()+1)+'.'+rows[i]['EXPIRATION_DATE'].getFullYear();
                rows[i]['CREATION_DATE']=date;
                rows[i]['EXPIRATION_DATE']=date2;
            }
            req.response.success=true;
            req.response.data=rows;
        }
        // console.log('couponController getList()', '4');
        connection.end();
        next();
    })
}

couponController.create = function (req,res,next)
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

    validateData(req, function(){
        if(req.success===false)
        {
            next();
            return;
        }

        var connection = mysql.createConnection(dbconfig);

        if(req.response.success===true)
        {
            saveCoupon(req, res, connection,function(){
                if(req.response.success===false)
                {
                    next();
                    return;
                }
                generateCodes(req,res, connection, function(){
                    if(req.response.success===false)
                    {
                        next();
                        return;
                    }
                    connection.commit(function(err){
                        if(err)
                        {
                            req.response.success=false;
                            req.response.errorText='Ошибка обращения к БД!';
                            connection.rollback();
                        }
                        else
                        {
                            req.response.success=true;
                            req.response.redirectUrl='/account';
                        }
                        connection.end();
                        next();
                    });
                });
            });
        }
        else 
        {
            connection.end();
            next();
        }
    });

    
}

couponController.update = function (req,res, next)
{
	req.response = {};

	if(!req.authorized)
	{
		req.response.success=false;
		req.response.redirectUrl='/';
		req.response.errorText='Не авторизован';
		next();
		return;
	}
    //console.log(req.body);
    validateData(req, function(){
        if(req.response.success===false)
        {
            console.log('Update error: data incorrect!');
            next();
            return;
        }
        isCouponActive(req, res, function(active){
            if(req.response.success===false)
            {
                console.log('Update error: unknown coupon status!');
                next();
                return;
                
            }

            if(active)
            {
                console.log('Update error: coupon is active!');
                req.response.success=false;
                req.response.errorText='Нельзя изменить активный купон!';
                next();
                
                return;
            }

            var connection=mysql.createConnection(dbconfig);

            connection.beginTransaction(function(err)
            {
                if(err)
                {
                    console.log('Update error: cannot start transaction!');
                    req.response.success=false;
                    req.response.errorText='Ошибка обращения к БД!';
                    connection.end();
                    next();
                    return;
                } 
                deleteCouponCodes(req, res, connection, function(){
                    if(req.response.success===false)
                    {   
                        console.log('Update error: error during deleting codes!');
                        // connection.rollback();
                        // connection.end();
                        next();
                        return;
                    }
                    updateCouponData(req, res, connection, function(){
                        if(req.response.success===false)
                        {
                            console.log('Update error: error during updating coupon!');
                            // connection.rollback();
                            // connection.end();
                            next();
                            return;
                        }
                        generateCodes(req, res, connection,function(){
                            if(req.response.success===false)
                            {
                                console.log('Update error: cannot generate coupons codes!');
                                next();
                                return;
                            }
                            else
                            {
                                connection.commit(function(err){
                                    if(err)
                                    {
                                        console.log('Update error: cannot commit transaction!',err.code);
                                        req.response.success=false;
                                        req.response.errorText='Ошибка обращения к БД!';
                                        connection.rollback();
                                    }
                                    else
                                    {
                                        console.log('Update info: update successful!');
                                        req.response.success=true;
                                        req.response.redirectUrl='/account';


                                        req.dest=path.join(__dirname, '..','private', req.session.sid.toString(), 'img') + '/' + req.queryData.couponId + '.jpg'
                                        if(req.body.promoImg.length!==0)
                                        {
                                            // console.log('there is promo img!');
                                            req.src=req.files.img.path;
                                            Uploads.moveImg(req, res, function(){});
                                        }
                                    }
                                    connection.end();
                                    next();
                                })
                            }
                        });
                    });
                });
            });
        });
    });
}

couponController.delete = function (req,res,next)
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
    
    connection.beginTransaction(function(err){
        if(err)
        {
            console.log('couponController.delete() error:', err.code);
            req.response.success=false;
            req.response.errorText='Ошибка обращения к БД!';
            connection.end();
            next();
            return;
        }
        isCouponActive(req,res, function(active){

        	if(req.response.success===false)
		    {
		        console.log('Delete error: unknown coupon status!');
		        connection.end();
		        next();
		        return;
		    }

		    if(active)
		    {
		        console.log('Delete error: coupon is active!');
		        req.response.success=false;
		        req.response.errorText='Нельзя изменить активный купон!';
		        connection.end();
		        next();
		        return;
		    }

            connection.query('delete from COUPON ' +
                'where COUPON.COUPON_ID = ? and COUPON.SUPPLIER_ID = ?',[req.body.couponId, req.session.sid], function(err, result){
                if(err)
                {
                    console.log('del5', err.code, req.body.couponId, req.session.sid);
                    req.response.success=false;
                    req.response.errorText='Ошибка обращения к БД!';
                    connection.rollback();
                    connection.end();
                    next();
                    return;
                    
                }

                connection.commit(function(err){
                    if(err)
                    {
                        console.log('del6');
                        req.response.success=false;
                        req.response.errorText='Ошибка обращения к БД!';
                        connection.rollback();
                    }
                    else
                    {
                        req.response.success=true;
                        req.response.redirectUrl='/account';
                    }
                    connection.end();
                    next();
                });
            });
        });
    });
}

function validateData(req, next)
{
    // console.log(req.body);

    req.response={success: true};

    var queryData = {};
    req.response.errors = ['', '', '', '', '', '', '', '', '', '', ''];

    if(req.body.shortDescr.length===0)
    {
        req.response.success=false;
        req.response.errors[0]='Данное поле не может быть пустым!';
    }
    else
    {
        if(req.body.shortDescr.length>500)
        {
            req.response.success=false;
            req.response.errors[0]='Введен слишком длинный текст!'; 
        }
        else
        {
            queryData.shortDescr=req.body.shortDescr;
        }
        
    }

    if(req.body.fullDescr.length===0)
    {
        req.response.success=false;
        req.response.errors[1]='Данное поле не может быть пустым!';
    }
    else 
    {
        if(req.body.fullDescr.length>5000)
        {
            req.response.success=false;
            req.response.errors[1]='Введен слишком длинный текст!';
        }
        else
        {
            queryData.fullDescr=req.body.fullDescr;
        }
    }

    var price=Number(req.body.price);
    if(isNaN(price) || req.body.price.length===0 || price<0 || price>100000)
    {
        req.response.success=false;
        req.response.errors[3]='Некорректные данные!';
    }
    else
    {
        queryData.price=price;
    }

    var fullPrice=Number(req.body.fullPrice);
    if(isNaN(fullPrice) || req.body.fullPrice.length===0 || fullPrice<0 || fullPrice>100000)
    {
        req.response.success=false;
        req.response.errors[2]='Некорректные данные!';
    }
    else
    {
        queryData.fullPrice=fullPrice;
    }


    var discount=Number(req.body.discount);
    if(isNaN(discount) || req.body.discount.length===0 || discount>100 || discount<0)
    {
        req.response.success=false;
        req.response.errors[4]='Некорректные данные!';
    }
    else
    {
        queryData.discount=discount;
    }

    var crDate=req.body.crDate.split('-',3);

    if(crDate.length!==3 ||
        (crDate[0].length===0 || crDate[1].length===0 || crDate[2].length===0) ||
        (isNaN(Number(crDate[0])) || isNaN(Number(crDate[1])) || isNaN(Number(crDate[2]))))
    {
        req.response.success=false;
        req.response.errors[5]='Неверная дата!';
        // crDateCorrect=false;
    }
    else
    {
        var now=new Д();
        var crt=new Date(Number(crDate[0]),Number(crDate[1])-1,Number(crDate[2]));
        if(crt.getTime()<=now.getTime())
        {
            req.response.success=false;
            req.response.errors[5]='Дата начала должна быть больше текущей!';
        }
        else
        {
            queryData.creatDate=crDate[0]+'-'+crDate[1]+'-'+crDate[2];
        }

    }

    var expDate=req.body.expDate.split('-',3);
    if(expDate.length!==3 || 
        (expDate[0].length===0 || expDate[1].length===0 || expDate[2].length===0) ||
        (isNaN(Number(expDate[0])) || isNaN(Number(expDate[1])) || isNaN(Number(expDate[2]))))
    {
        req.response.success=false;
        req.response.errors[6]='Неверная дата!';
    }
    else
    {
        if(typeof (queryData.creatDate)!=='undefined')  //доделать нормальную проверку дат!
        {
            // var now=new Date();
            var crt=new Date(Number(crDate[0]),Number(crDate[1])-1,Number(crDate[2]));
            var exp=new Date(Number(expDate[0]),Number(expDate[1])-1,Number(expDate[2]));
            if(exp.getTime()<=crt.getTime())
            {
                req.response.success=false;
                req.response.errors[6]='Дата окончания должна быть больше даты начала акции!';
            }
            else
            {
                queryData.expDate=expDate[0]+'-'+expDate[1]+'-'+expDate[2];
            }
        }
        else
        {
            req.response.success=false;
            req.response.errors[6]='Некорректная дата начала акции!';
        }
        //console.log(now, exp);
    }

    var count=Number(req.body.couponsCount);
    if(isNaN(count) || req.body.couponsCount.length===0 || count<0)
    {
        req.response.success=false;
        req.response.errors[7]='Некорректные данные!';
    }
    else
    {
        queryData.count=count;
    }

    if(req.method === 'PUT')
    {
        var couponId=Number(req.body.couponId);
        if(isNaN(couponId) || req.body.couponId.length===0 || couponId<0)
        {
            req.response.success=false;
            req.response.errors[8]='Некорректные данные!';
        }
        else
        {
            queryData.couponId=couponId;
        }
    }

    if(req.method === 'POST' )
    {
        if(req.body.addressList.length===0)
        {
            req.response.success=false;
            req.response.errors[8]='Данное поле не может быть пустым!';
        }
        else
        {
            if(req.body.addressList.length>2000)
            {
                req.response.success=false;
                req.response.errors[8]='Слишком много адресов!';
            }
            else
            {
                queryData.addressList=req.body.addressList;
            }
           
        }
    }

    if(req.body.city.length===0)
    {
        req.response.success=false; //добавить проверку в справочнике
        req.response.errors[9]='Данное поле не может быть пустым!';
    }


    if(req.body.category.length===0)
    {
        req.response.success=false; //добавить проверку в справочнике
        req.response.errors[10]='Данное поле не может быть пустым!';
    }


    if (req.response.success===true) 
    {
        var connection=mysql.createConnection(dbconfig);

        // console.log('lol5\n');
        connection.query('select * from CATEGORY where NAME = ?', [req.body.category], function(err, rows){
            // console.log('lol4\n');
            if(err)
            {
                console.log('checkCategory() error:', err.code);
                req.response.success=false;
                req.response.errors[10]='Ошибка запроса';
            }
            else
            {
                if(rows.length==1)
                {
                    queryData.category=req.body.category;
                }
                else
                {
                    req.response.success=false;
                    req.response.errors[10]='Введена категория не из списка!';
                }
            }
            
            connection.query('select * from ADDRESS where CITY = ?', [req.body.city], function(err, rows){
                // console.log('lol5\n');
                if(err)
                {
                    console.log('checkCity() error:', err.code);
                    req.response.success=false;
                    req.response.errors[9]='Ошибка запроса';
                }
                else
                {
                    if(rows.length==1)
                    {
                        queryData.city=req.body.city;
                    }
                    else
                    {
                        req.response.success=false;
                        req.response.errors[9]='Введен город не из списка!';
                    }
                }
                
                connection.end();
                
                if(req.response.success===true)
                {
                    req.queryData=queryData;
                }
                else
                {
                    req.response.errorText='Некорректные данные';
                }

                // console.log('lol1', req.queryData,req.response, '\n');
                next();
            });
        });
    }
    else
    {
        // console.log('lol2', req.queryData,req.response, '\n');
        req.response.errorText='Некорректные данные';
        next();
    }
    // console.log('lol3', req.queryData,req.response, '\n');
}

function saveCoupon(req, res, connection,next)
{

    // console.log(req.queryData);

    connection.beginTransaction(function(err){
        if(err){
            req.response.success=false;
            req.response.errorText='Ошибка обращения к БД!';
            connection.end();
            next();
            return;
        }

        connection.query('insert into COUPON (PRICE, CREATION_DATE, EXPIRATION_DATE, SUPPLIER_ID, DESCRIPTION, FULL_PRICE, DISCOUNT, ' +
            'SHORT_DESCRIPTION, COUNT, SHOP_ADDRESS_LIST, CITY, CATEGORY) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.queryData.price,req.queryData.creatDate,req.queryData.expDate,req.session.sid,
            req.queryData.fullDescr, req.queryData.fullPrice, req.queryData.discount, req.queryData.shortDescr, req.queryData.count, req.queryData.addressList, req.queryData.city, req.queryData.category],function(err, result){
            if(err)
            {
                req.response.success=false;
                req.response.errorText='Ошибка обращения к БД!';
                connection.rollback();
                connection.end();
            }
            else
            {
                req.response.success=true;
                req.queryData.couponId=result.insertId;
                req.dest=path.join(__dirname, '..', 'private', req.session.sid.toString(), 'img') + '/' + result.insertId + '.jpg'
                if(req.body.promoImg.length!==0)
                {
                    req.src=req.files.img.path;
                }
                else
                {
                    req.src=path.join(__dirname) + '../public/images/kdpv.jpg';
                }
                Uploads.moveImg(req, res, function(){});

            }
            next();
        });
    });
}


function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 60; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function generateCodes(req, res, connection, next)
{
    // console.log('generateCodes()')
    var control=0;
    var code=[];
    req.cycleError=false;
    var filename=path.join(__dirname, '../private', req.session.sid.toString(), 'codes') +'/' + req.queryData.couponId + '.txt';
    //console.log(filename);
    var codesFile=fs.createWriteStream(filename, {flags:'w'});

    for(var i=0; i<req.queryData.count; i++)
    {
        code[i]=makeid();
        connection.query('insert into UNIQUE_CODE (CODE, COUPON_ID) values (?, ?)', [code[i],req.queryData.couponId], function(err, rows, fields){
            control++;
            if(err)
            {
                req.response.success=false;
                req.response.errorText='Ошибка обращения к БД!';
                req.cycleError=true;
                if(control===req.queryData.count)
                {
                    connection.rollback();
                    connection.end();
                    next();
                }
            }
            else
            {
                if(control===req.queryData.count)
                {
                    if(req.cycleError===true)
                    {
                        req.response.success=false;
                        req.response.errorText='Ошибка обращения к БД!';
                        connection.rollback();
                        connection.end();
                    }
                    else
                    {

                        req.response.success=true;
                    }
                    next();
                }
            }

        })
        codesFile.write(code[i]+'\n', function(err, written, string){
            if(i===req.queryData.count-1)
            {
                codeList.end();
            }
        });
    }
}

couponController.getCodesList = function (req, res, next)
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
    var filename=path.join('../private', req.session.sid.toString(), 'codes') +'/' + req.params.id + '.txt';


    connection.query('select CODE, test.COUPON.COUPON_ID, test.COUPON.SHORT_DESCRIPTION from test.UNIQUE_CODE join test.COUPON ' +
        'on test.UNIQUE_CODE.COUPON_ID = test.COUPON.COUPON_ID ' +
        'where test.COUPON.COUPON_ID = ? and test.COUPON.SUPPLIER_ID = ?',[req.params.id, req.session.sid], function(err, rows){
        if(err)
        {   
            console.log('couponController getCodesList() error:', err.code)
            req.response.success=false;
            // req.response.redirectUrl='/';
            req.response.errorText='Ошибка запроса';
        }
        else
        {
            if(rows.length!==0)
            {
                req.response.name='Коды купона "'+rows[0]['SHORT_DESCRIPTION']+'"';
            }
            else
            {
                req.response.name='Ошибка! Купон не найден!';
            }
            req.response.success=true;
            req.response.codes=rows;
            req.response.downloadLink=filename;
        }
        connection.end();
        next();
    });
}

function sendCodes(req,res,next)
{
    res.render('codeList.jade', {rows:req.response.codes, name:req.response.name, downloadLink:req.response.downloadLink});
}


function deleteCouponCodes(req, res, connection, next)
{
    connection.query('delete from UNIQUE_CODE where COUPON_ID = ?', [req.queryData.couponId], function(err){
        if(err)
        {
            req.response.success=false;
            req.response.errorText='Ошибка обращения к БД!';
            connection.rollback();
            connection.end();
        }
        next();
    });
}



function isCouponActive(req, res, next)
{
    var connection=mysql.createConnection(dbconfig);
    req.response={};

    connection.query('select COUPON_ID, CREATION_DATE, EXPIRATION_DATE, SUPPLIER_ID from COUPON ' +
             'where COUPON_ID = ? and SUPPLIER_ID = ?',[req.body.couponId, req.session.sid], function(err, rows){
            if(err)
            {
                req.response.success = false;
                req.response.errorText = 'Ошибка обращения к БД!';

                connection.end();
                next(false);
                return;
            }

            if(rows.length===0)
            {
                req.response.success = false;
                req.response.errorText = 'Купон не найден!';
                
                connection.end();
                next(false);
                return;
            }

            var now=new Date().getTime();
            if(now>= rows[0]["CREATION_DATE"].getTime() && now<=rows[0]['EXPIRATION_DATE'].getTime())
            {
                req.response.success = true;
                req.response.errorText = 'Нельзя удалить активную акцию!';
                connection.end();
                next(true);
            }
            else
            {
                req.response.success = true;
                next(false);
            }
        });
}

function updateCouponData(req, res, connection, next)
{
    connection.query('update COUPON ' + 
        'set PRICE = ?, CREATION_DATE = ?, EXPIRATION_DATE = ?, SUPPLIER_ID = ?, DESCRIPTION = ?, FULL_PRICE = ?, DISCOUNT = ?, '+
        'SHORT_DESCRIPTION = ?, COUNT = ?, CITY = ?, CATEGORY = ? ' +
        'where COUPON_ID = ?', 
        [req.queryData.price, req.queryData.creatDate, req.queryData.expDate, req.session.sid, req.queryData.fullDescr, req.queryData.fullPrice, req.queryData.discount, 
        req.queryData.shortDescr, req.queryData.count, req.queryData.city, req.queryData.category, req.queryData.couponId], function(err, res){
            if(err)
            {   
                console.log(err.code);
                req.response.success=false;
                req.response.errorText='Ошибка обращения к БД!';
                connection.rollback();
                connection.end(); 
            }
            next();
        });
} 

couponController.getAll = function (req, res, next)
{
    req.response={};

    //console.log(req.query);

    if(!req.authorized)
    {
        req.response.success=false;
        req.response.redirectUrl='/';
        req.response.errorText='Не авторизован';
        next();
        return;
    }

    // console.log(req.query.startFrom);

    var connection = mysql.createConnection(dbconfig);

    connection.query('SELECT COUPON.*, SUPPLIER.NAME FROM COUPON join SUPPLIER' + 
        ' WHERE COUPON.SUPPLIER_ID=SUPPLIER.SUPPLIER_ID order by CREATION_DATE desc limit ?, 15', [Number(req.query.startFrom)], function(err, rows){
            if(err)
            {
                console.log('couponController.getAll() error:', err.code);
                // console.log(err);
                req.response.success=false;
                req.response.errorText='Ошибка запроса';
                connection.end();
                next();
                return;
            }

            rows.forEach(function(item, i, arr){
                if(item.CREATION_DATE)
                {
                    var date=moment(item.CREATION_DATE);
                    item.CREATION_DATE=date.format('YYYY-MM-DD');
                }

                if(item.EXPIRATION_DATE)
                {
                    var date=moment(item.EXPIRATION_DATE);
                    item.EXPIRATION_DATE=date.format('YYYY-MM-DD');
                }
            });

            req.response.couponsList=rows;
            // console.log(rows);
            req.response.success=true;
            connection.end();
            next();
        });
}

module.exports = couponController;