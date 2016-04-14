/**
 * Created by art on 27.02.16.
 */
const EventEmitter = require('events');
const util = require('util');
var mysql = require('mysql');
const fs = require('fs');
var path = require('path');


var options = {
    host: 'localhost',
    port: 3306,
    user: 'art',
    password: '96830217',
    database: 'test'
};


function MyRecorder()
{
    EventEmitter.call(this);
}

util.inherits(MyRecorder, EventEmitter);

const myRecorder = new MyRecorder();


function saveData(req,res,next)
{
    checkData(req);

    var connection = mysql.createConnection(options);

    if(req.response.success===true)
    {
        getSupplierId(req, function(){
            if(req.response.success===false)
            {
                next();
                return;
            }

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
                            req.response['success']=false;
                            req.response['errortext']='Ошибка обращения к БД!';
                            connection.rollback();
                        }
                        else
                        {
                            req.response['success']=true;
                            req.response['redirectUrl']='/account';
                            //req.response['errortext']='Ошибка обращения к БД!';
                        }
                        connection.end();
                        next();
                    });
                });
            });
        });
    }
    else 
    {
        connection.end();
        next();
    }
}

function checkData(req)
{
    var response={
        success: true
    };

    var queryData={};

    console.log('checkData()', req.body, req.originalUrl);

    if(req.body['shortDescr'].length===0)
    {
        response.success=false;
        response['errorText1']='Данное поле не может быть пустым!';
    }
    else
    {
        queryData['shortDescr']=req.body['shortDescr'];
    }

    if(req.body['fullDescr'].length===0)
    {
        response.success=false;
        response['errorText2']='Данное поле не может быть пустым!';
    }
    else
    {
        queryData['fullDescr']=req.body['fullDescr'];
    }

    var price=Number(req.body['price']);
    if(isNaN(price) || req.body['price'].length===0)
    {
        response.success=false;
        response['errorText3']='Некорректные данные!';
    }
    else
    {
        queryData['price']=price;
    }

    var fullPrice=Number(req.body['fullPrice']);
    if(isNaN(fullPrice) || req.body['fullPrice'].length===0)
    {
        response.success=false;
        response['errorText7']='Некорректные данные!';
    }
    else
    {
        queryData['fullPrice']=fullPrice;
    }


    var discount=Number(req.body['discount']);
    if(isNaN(discount) || req.body['discount'].length===0)
    {
        response.success=false;
        response['errorText4']='Некорректные данные!';
    }
    else
    {
        queryData['discount']=discount;
    }

    var crDate=req.body['crDate'].split('-',3);
    if(crDate.length!==3 ||
        (crDate[0].length===0 || crDate[1].length===0 || crDate[2].length===0) ||
        (isNaN(Number(crDate[0])) || isNaN(Number(crDate[1])) || isNaN(Number(crDate[2]))))
    {
        response.success=false;
        response['errorText8']='Неверная дата!';
        crDateCorrect=false;
    }
    else
    {
        queryData['creatDate']=crDate[0]+'-'+crDate[1]+'-'+crDate[2];
    }

    var expDate=req.body['expDate'].split('-',3);
    if(expDate.length!==3)
    {
        response.success=false;
        response['errorText5']='Неверная дата!';
    }
    else
    {
        if(typeof (queryData['creatDate'])!=='undefined')  //доделать нормальную проверку дат!
        {
            var now=new Date();
            var exp=new Date(Number(expDate[0]),Number(expDate[1])-1,Number(expDate[2]));
            if(exp.getTime()<=now.getTime())
            {
                response.success=false;
                response['errorText5']='Дата окончания должна быть больше текущей!';
            }
            else
            {
                queryData['expDate']=expDate[0]+'-'+expDate[1]+'-'+expDate[2];
            }
        }
        else
        {
            response.success=false;
            response['errorText5']='Некорректная дата начала акции!';
        }
        //console.log(now, exp);
    }

    var count=Number(req.body['couponsCount']);
    if(isNaN(count) || req.body['couponsCount'].length===0)
    {
        response.success=false;
        response['errorText6']='Некорректные данные!';
        console.log('kek1');
    }
    else
    {
        queryData['count']=count;
    }

    if(req.originalUrl === '/updateCoupon')
    {
        var couponId=Number(req.body['couponId']);
        if(isNaN(couponId) || req.body['couponId'].length===0)
        {
            response.success=false;
            response['errorText9']='Некорректные данные!';
            console.log('kek2');
        }
        else
        {
            queryData['couponId']=couponId;
        }
    }

    if(req.originalUrl === '/addNewCoupon' )
    {
        if(req.body['addressList'].length===0)
        {
            response.success=false;
            response['errorText9']='Данное поле не может быть пустым!';
        }
        else
        {
            queryData['addressList']=req.body['addressList'];
        }
    }

    if(response.success===true)
    {
        req['queryData']=queryData;
        req['response']=response;
        //getSupplierId(req,res,next);
    }
    else
    {
        response['errorType']='data error';
        req['response']=response;
        //next();
    }
}

function getSupplierId(req, next)
{
    var connection=mysql.createConnection(options);

    connection.query('select SUPPLIER_ID from SUPPLIER where REG_NUMBER = ?', [req.session.username], function(err, rows, fields){
        if(err)
        {
            req.response['success']=false;
            req.response['errortext']='Ошибка обращения к БД!';
            connection.end();
            next();
            return;
        }

        if(typeof (rows)!=='undefined' && rows.length===0)
        {
            req.response['success']=false;
            req.response['errortext']='Пользователь не найден!';
            
        }
        else
        {
            req.response['success']=true;
            req.queryData['supplierId']=rows[0]['SUPPLIER_ID'];
        }
        connection.end();
        next();
    });
}

function saveCoupon(req, res, connection,next)
{

    //console.log('saveCoupon()', req.files);
    
    //var connection = mysql.createConnection(options);

    connection.beginTransaction(function(err){
        if(err){
            req.response['success']=false;
            req.response['errortext']='Ошибка обращения к БД!';
            connection.end();
            next();
            return;
        }

        connection.query('insert into COUPON (PRICE, CREATION_DATE, EXPIRATION_DATE, SUPPLIER_ID, DESCRIPTION, FULL_PRICE, DISCOUNT, ' +
            'SHORT_DESCRIPTION, COUNT, SHOP_ADDRESS_LIST) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.queryData.price,req.queryData.creatDate,req.queryData.expDate,req.queryData.supplierId,
            req.queryData.fullDescr, req.queryData.discount, req.queryData.fullPrice, req.queryData.shortDescr, req.queryData.count, req.queryData.addressList],function(err, result){
            if(err)
            {
                req.response['success']=false;
                req.response['errortext']='Ошибка обращения к БД!';
                connection.rollback();
                connection.end();
            }
            else
            {
                req.response['success']=true;
                req.queryData['couponId']=result.insertId;
                //generateCodes(req,res,connection,next);
                var promoImg;
                req.dest=path.join(__dirname, 'private', req.session.username) + '/' + result.insertId + '.jpg'
                if(req.body.promoImg.length!==0)
                {
                    console.log('there is promo img!');
                    req.src=req.files.img.path;
                }
                else
                {
                    req.src=path.join(__dirname) + '/public/images/kdpv.jpg';
                }
                moveImg(req, res, function(){});

            }
            next();
        });
    });
}



function getCities(req,res, next)
{
    var connection = mysql.createConnection(options);
    var response={};

    connection.query('select CITY from ADDRESS order by CITY ASC', function(err, row, fields){
        if(err)
        {
            response['success']=false;
            response['errortext']='Ошибка обращения к БД!';
        }
        else
        {
            var cities=[];
            var i=0;
            for (i=0; i<row.length; i++)
            {
                cities[i]=row[i]['CITY'];
            }

            response['success']=true;
            response['cities']=cities;
            req['response']=response;

        }
        next();
    });
}


function getCouponList(req,res,next)
{
    var connection = mysql.createConnection(options);

    var response={};
    connection.query('select test.COUPON.COUPON_ID, SHORT_DESCRIPTION, CREATION_DATE, EXPIRATION_DATE, COUNT, ' +
        '(select COUNT(*) from test.PURCHASE where test.COUPON.COUPON_ID = test.PURCHASE.COUPON_ID) as SELL_COUNT ' +
        'from test.COUPON where SUPPLIER_ID = ?', [req.session.sid], function(err, rows, fields){
        if(err)
        {
            response['success']=false;
            response['errortext']='Ошибка обращения к БД!';
            req.response=response;
        }
        else
        {
            //var data=rows;
            for(var i=0; i<rows.length; i++)
            {
                var date=rows[i]['CREATION_DATE'].getDate()+'.'+(rows[i]['CREATION_DATE'].getMonth()+1)+'.'+rows[i]['CREATION_DATE'].getFullYear();
                var date2=rows[i]['EXPIRATION_DATE'].getDate()+'.'+(rows[i]['EXPIRATION_DATE'].getMonth()+1)+'.'+rows[i]['EXPIRATION_DATE'].getFullYear();
                rows[i]['CREATION_DATE']=date;
                rows[i]['EXPIRATION_DATE']=date2;
            }
            response['success']=true;
            response['data']=rows;
            req.response=response;
        }
        next();
    })
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
    //var connection = mysql.createConnection(options);
    console.log('generateCodes()')
    var control=0;
    var code=[];
    req['cycleError']=false;
    var filename=path.join(__dirname, 'private', req.session.username) +'/' + req.queryData.couponId + '.txt';
    //console.log(filename);
    var codesFile=fs.createWriteStream(filename, {flags:'w'});

    for(var i=0; i<req.queryData.count; i++)
    {
        code[i]=makeid();
        connection.query('insert into UNIQUE_CODE (CODE, COUPON_ID) values (?, ?)', [code[i],req.queryData.couponId], function(err, rows, fields){
            control++;
            if(err)
            {
                req.response['success']=false;
                req.response['errortext']='Ошибка обращения к БД!';
                req['cycleError']=true;
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
                    if(req['cycleError']===true)
                    {
                        req.response['success']=false;
                        req.response['errortext']='Ошибка обращения к БД!';
                        connection.rollback();
                        connection.end();
                    }
                    else
                    {

                        req.response['success']=true;
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

function getCodes(req, res, next)
{
    var connection=mysql.createConnection(options);
    var filename=path.join('private', req.session.username) +'/' + req.query.couponId + '.txt';

    connection.query('select CODE, test.COUPON.COUPON_ID, test.COUPON.SHORT_DESCRIPTION from test.UNIQUE_CODE join test.COUPON ' +
        'on test.UNIQUE_CODE.COUPON_ID = test.COUPON.COUPON_ID ' +
        'where test.COUPON.COUPON_ID = ? and test.COUPON.SUPPLIER_ID = ?',[req.query.couponId, req.session.sid], function(err, rows){
        if(err)
        {
            res.redirect('/account');
        }
        else
        {
            if(rows.length!==0)
            {
                req.name='Коды купона "'+rows[0]['SHORT_DESCRIPTION']+'"';
            }
            else
            {
                req.name='Ошибка! Купон не найден!';
            }
            req.codes=rows;
            req.downloadLink=filename;
            connection.end();
            sendCodes(req, res, next);
        }
    })


}

function sendCodes(req,res,next)
{
    res.render('codeList.jade', {rows:req.codes, name:req.name, downloadLink:req.downloadLink});
}

function deleteCoupon(req,res,next)
{
    console.log('deleting coupon!');
    var connection=mysql.createConnection(options);
    req.response={};
    connection.beginTransaction(function(err){
        if(err)
        {
            console.log('del1');
            req.response['success']=false;
            req.response['errortext']='Ошибка обращения к БД!';
            connection.end();
            next();
            return;
        }
        connection.query('select COUPON_ID, CREATION_DATE, EXPIRATION_DATE, SUPPLIER_ID from COUPON ' +
             'where COUPON_ID = ? and SUPPLIER_ID = ?',[req.body.couponId, req.session.sid], function(err, rows){
            if(err)
            {
                console.log('del2');
                req.response['success'] = false;
                req.response['errortext'] = 'Ошибка обращения к БД!';
                connection.rollback();
                connection.end();
                next();
                return;
            }

            if(rows.length===0)
            {
                console.log('del3');
                req.response['success'] = false;
                req.response['errortext'] = 'Купон не найден!';
                connection.rollback();
                connection.end();
                next();
                return;
            }

            var now=new Date().getTime();
            if(now>= rows[0]["CREATION_DATE"].getTime() && now<=rows[0]['EXPIRATION_DATE'].getTime())
            {
                console.log('del4');
                req.response['success'] = false;
                req.response['errortext'] = 'Нельзя удалить активную акцию!';
                connection.rollback();
                connection.end();
                next();
                return;
            }

            connection.query('delete from COUPON ' +
                'where COUPON.COUPON_ID = ? and COUPON.SUPPLIER_ID = ?',[req.body.couponId, req.session.sid], function(err, result){
                if(err)
                {
                    console.log('del5', err.code, req.body.couponId, req.session.sid);
                    req.response['success']=false;
                    req.response['errortext']='Ошибка обращения к БД!';
                    connection.rollback();
                    connection.end();
                    next();
                    return;
                    
                }

                connection.commit(function(err){
                    if(err)
                    {
                        console.log('del6');
                        req.response['success']=false;
                        req.response['errortext']='Ошибка обращения к БД!';
                        connection.rollback();
                    }
                    else
                    {
                        req.response['success']=true;
                        req.response.redirectUrl='/account';
                    }
                    connection.end();
                    next();
                });
            });

        });
    });

}


function getCouponInfo(req, res, next)
{
    var connection=mysql.createConnection(options);
    req.response={};

    connection.query('select * from COUPON where COUPON_ID = ? and SUPPLIER_ID = ?', [req.body.couponId, req.session.sid], function(err, rows){
        if(err)
        {
            console.log(err.code)
            req.response.success=false;
            req.response.errortext='Ошибка обращения к БД!'
            next;
            return;
        }

        if(rows.length===1)
        {
            req.response.success=true;
            req.response.data=rows[0];
            req.response.data.promoImgUrl=path.join('private', req.session.username) + '/' + req.body.couponId + '.jpg';
        }
        else
        {
            req.response.success=false;
            req.response.errortext='Ошибка обращения к БД!'
        }
        next();
    });
}

function isCouponActive(req, res, next)
{
    var connection=mysql.createConnection(options);
    req.response={};

    connection.query('select COUPON_ID, CREATION_DATE, EXPIRATION_DATE, SUPPLIER_ID from COUPON ' +
             'where COUPON_ID = ? and SUPPLIER_ID = ?',[req.body.couponId, req.session.sid], function(err, rows){
            if(err)
            {
                req.response['success'] = false;
                req.response['errortext'] = 'Ошибка обращения к БД!';

                connection.end();
                next(false);
                return;
            }

            if(rows.length===0)
            {
                req.response['success'] = false;
                req.response['errortext'] = 'Купон не найден!';
                
                connection.end();
                next(false);
                return;
            }

            var now=new Date().getTime();
            if(now>= rows[0]["CREATION_DATE"].getTime() && now<=rows[0]['EXPIRATION_DATE'].getTime())
            {
                req.response['success'] = true;
                req.response['errortext'] = 'Нельзя удалить активную акцию!';
                //req.response['couponActive']=true;

                connection.end();
                next(true);
            }
            else
            {
                req.response['success'] = true;
                //req.response['couponActive']=false;
                next(false);
            }
        });
}



function updateCoupon(req,res, next)
{
    console.log('updateCoupon()');
    //console.log(req.body);
    checkData(req);
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
            req.response['success']=false;
            req.response['errortext']='Нельзя изменить активный купон!';
            next();
            
            return;
        }

        var connection=mysql.createConnection(options);

        connection.beginTransaction(function(err)
        {
            if(err)
            {
                console.log('Update error: cannot start transaction!');
                req.response['success']=false;
                req.response['errortext']='Ошибка обращения к БД!';
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
                                    req.response['success']=false;
                                    req.response['errortext']='Ошибка обращения к БД!';
                                    connection.rollback();
                                }
                                else
                                {
                                    console.log('Update info: update successful!');
                                    req.response['success']=true;
                                    req.response['redirectUrl']='/account';


                                    req.dest=path.join(__dirname, 'private', req.session.username) + '/' + req.queryData.couponId + '.jpg'
                                    if(req.body.promoImg.length!==0)
                                    {
                                        console.log('there is promo img!');
                                        req.src=req.files.img.path;
                                        moveImg(req, res, function(){});
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
}


function deleteCouponCodes(req, res, connection, next)
{
    connection.query('delete from UNIQUE_CODE where COUPON_ID = ?', [req.queryData.couponId], function(err){
        if(err)
        {
            req.response['success']=false;
            req.response['errortext']='Ошибка обращения к БД!';
            connection.rollback();
            connection.end();
        }
        next();
    });
}

function updateCouponData(req, res, connection, next)
{
    connection.query('update COUPON ' + 
        'set PRICE = ?, CREATION_DATE = ?, EXPIRATION_DATE = ?, SUPPLIER_ID = ?, DESCRIPTION = ?, FULL_PRICE = ?, DISCOUNT = ?, SHORT_DESCRIPTION = ?, COUNT = ? ' +
        'where COUPON_ID = ?', 
        [req.queryData.price, req.queryData.creatDate, req.queryData.expDate, req.session.sid, req.queryData.fullDescr, req.queryData.fullPrice, req.queryData.discount, 
        req.queryData.shortDescr, req.queryData.count, req.queryData.couponId], function(err, res){
            if(err)
            {   
                console.log(err.code);
                req.response['success']=false;
                req.response['errortext']='Ошибка обращения к БД!';
                connection.rollback();
                connection.end(); 
            }
            next();
        });
}   

function getUserInfo(req,res,next)
{
    console.log('getUserInfo()');
    req.response={};
    var connection=mysql.createConnection(options);
    var filename=path.join(__dirname, 'private', req.session.username) + '/avatar.jpg';
   
    fs.stat(filename, function(err, stats){
        if(err) 
        {
            req.response.imgUrl='/images/kdpv.jpg';
            console.log('getUserInfo() error:', err.code);
            //return;
        }
        else
        {
            if(stats.isFile())
            {
                req.response.imgUrl=path.join('private', req.session.username) + '/avatar.jpg';
            }
            else
            {
                req.response.imgUrl='/images/kdpv.jpg';
            }
        }

        connection.query('select REG_NUMBER, NAME, CITY from SUPPLIER where SUPPLIER_ID = ?', [req.session.sid], function(err,rows){
            if(err)
            {
                req.response['success']=false;
                req.response['errortext']='Ошибка обращения к БД!';
                connection.end();
                next();
                return;
            }

            
            req.response['success']=true;
            req.response.regCode=rows[0].REG_NUMBER;
            req.response.orgName=rows[0].NAME;
            req.response.orgCity=rows[0].CITY;

            connection.end();
            next();
        });
    });
}

function moveImg(req, res, next)
{
    fs.rename(req.src, req.dest, function(err){
        if(err)
        {
            console.log('moveImg() error: ', err.code);
        }
    });

    next();
}




module.exports.getCodes=getCodes;
module.exports.saveData=saveData;
module.exports.saveCoupon=saveCoupon;
module.exports.getCities=getCities;
module.exports.getCouponList=getCouponList;
module.exports.deleteCoupon=deleteCoupon;
module.exports.getCouponInfo=getCouponInfo;
module.exports.updateCoupon=updateCoupon;
module.exports.getUserInfo=getUserInfo;
module.exports.moveImg=moveImg;
