var express = require('express');
var regMgr=require('../modules/regMgr');
var loginMgr=require('../modules/loginMgr');
var dataMgr=require('../modules/dataMgr');
const fs = require('fs');
var path = require('path');
var multipart = require('connect-multiparty');
var router = express.Router();



var multipartMiddleware = multipart({ uploadDir: path.join(__dirname, '..','tmpdir') });


var options = {
    root: __dirname + '/../',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
};


//router.use(fileUpload());

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile('/html/index.html',options);
});

router.get('/private/codes',function(req, res, next){
    console.log('trying to acess private!');
});

router.post('/register', regMgr.checkCity, regMgr.checkUser,regMgr.saveUser);

router.post('/login', function(req,res,next){
    console.log('login request');
    loginMgr.login(req,res);
});

router.get('/register', function(req,res, next){
    res.sendFile('/html/register.html', options)
});


router.get('/account', loginMgr.isAuthorized, function(req,res,next){
    if(req.authorized===true)
    {
        res.sendFile('/html/account.html',options);
    }
    else
    {
        res.redirect('/');
    }
});

router.get('/profile', loginMgr.isAuthorized, function(req,res,next){
    if(req.authorized===true)
    {
        //res.render('profile.jade');
        next();
    }
    else
    {
        res.redirect('/');
    }
});

router.get('/profile', dataMgr.getUserInfo, function(req,res){
    if(req.response.success===false)
    {
        res.redirect('/');
    }
    else
    {
        //console.log(req.response);
        res.render('profile.jade', {regCode:req.response.regCode , orgName:req.response.orgName , orgCity:req.response.orgCity , imgUrl:req.response.imgUrl });
        // res.sendFile('/html/profile.html', options);
    }
});



router.get('/logout',loginMgr.isAuthorized,function(req,res,next){

    if(req.authorized===true)
    {
        req.session.destroy();
        res.redirect('/');
    }
    else
    {
        res.redirect('/');
    }
});

router.get('/stat', loginMgr.isAuthorized, function(req,res,next){
    if(req.authorized===true)
    {
        res.sendFile('/html/stat.html',options);
    }
    else
    {
        res.redirect('/');
    }
});

router.get('/addcoupon', loginMgr.isAuthorized, function(req, res, next){
    if(req.authorized===true)
    {
        //res.send('redirectUrl','/addcoupon');
        res.sendFile('/html/newcoupon.html', options);
    }
    else
    {
        //res.send('redirectUrl', '/');
        res.redirect('/');
    }
});


router.post('/addNewCoupon', loginMgr.isAuthorized, function(req, res, next){
    if(req.authorized===true)
    {
        next();
    }
    else
    {
        response={
            success: false,
            errorType: 'not authorized',
            redirectUrl: '/'
        };
        res.send(response);
    }
});


router.post('/addNewCoupon', multipartMiddleware, dataMgr.saveData, function(req,res){

    if(req.response.success===true)
    {
        req.response['redirectUrl']='/account';

    }
    res.send(req.response);

});


router.get('/getCities',dataMgr.getCities, function(req, res, next){
    res.send(req.response);
});


router.post('/getCouponList', loginMgr.isAuthorized, function (req, res, next) {
    if(req.authorized===true)
    {
        next();
    }
    else
    {
        response={
            success: false,
            errorType: 'not authorized',
            redirectUrl: '/'
        };
        res.send(response);
    }
});

router.post('/getCouponList',dataMgr.getCouponList,function (req,res,next){
    res.send(req.response);
});

router.get('/getCodeList', loginMgr.isAuthorized, function(req, res, next){
    if(req.authorized===true)
    {
        //res.download(__dirname + '/../'+'/html/lol.txt');
        next();
    }
    else
    {
        // response={
        //     success: false,
        //     errorType: 'not authorized',
        //     redirectUrl: '/'
        // };
        // res.send(response);
        res.redirect('/');
    }
});

router.get('/getCodeList', dataMgr.getCodes);

router.post('/deleteCoupon', loginMgr.isAuthorized, function(req, res, next){
    if(req.authorized===true)
    {
        next();
    }
    else
    {
        response={
            success: false,
            errorType: 'not authorized',
            redirectUrl: '/'
        };
        res.send(response);
    }
});

router.post('/deleteCoupon', dataMgr.deleteCoupon, function(req, res){
    res.send(req.response);
});

router.post('/getCouponInfo', loginMgr.isAuthorized, function(req, res, next){

    //console.log('kek');

    if(req.authorized===true)
    {
        next();
    }
    else
    {
        response={
            success: false,
            errorType: 'not authorized',
            redirectUrl: '/'
        };
        res.send(response);
    }
});

router.post('/getCouponInfo', dataMgr.getCouponInfo, function(req,res){
    //console.log('kek1')
    res.send(req.response);
});

router.post('/updateCoupon', loginMgr.isAuthorized, function(req, res, next){

    console.log('coupon update request!');

    if(req.authorized===true)
    {
        next();
    }
    else
    {
        response={
            success: false,
            errorType: 'not authorized',
            redirectUrl: '/'
        };
        res.send(response);
    }
});

router.post('/updateCoupon', multipartMiddleware, dataMgr.updateCoupon, function(req, res){
    res.send(req.response);
});


router.post('/uploadAvatar', loginMgr.isAuthorized, function(req,res, next){
    //console.log('uploading file', req.body, req.files);
    if(req.authorized===true)
    {
        next();
    }
    else
    {
        response={
            success: false,
            errorType: 'not authorized',
            redirectUrl: '/'
        };
        res.send(response);
    }
});

router.post('/uploadAvatar', multipartMiddleware, function(req, res, next){
        req.src=req.files.img.path;
        req.dest=path.join(__dirname, '..', 'private', req.session.username) + '/avatar.jpg';
        next();
    }, dataMgr.moveImg, function(req,res){
    res.redirect('/profile');
});

router.get('/getUserInfo', loginMgr.isAuthorized, function(req,res,next){
    if(req.authorized===true)
    {
        //res.render('profile.jade');
        next();
    }
    else
    {
        req.response={ redirectUrl: '/'};
        req.send(req.response);
    }
});

router.get('/getUserInfo', dataMgr.getUserInfo, function(req,res){
    if(req.response.success===false)
    {
        req.response.redirectUrl='/';
        req.send(req.response);
    }
    else
    {
        //console.log(req.response);
        //res.render('profile.jade', {regCode:req.response.regCode , orgName:req.response.orgName , orgCity:req.response.orgCity , imgUrl:req.response.imgUrl });
        // res.sendFile('/html/profile.html', options);
        res.send(req.response);
    }
});

router.post('/registerUser', regMgr.registerUser, function (req, res){
    res.send(req.response);
});

router.post('/userLogin', loginMgr.mobileLogin, function(req, res){
    res.send(req.response);
});

module.exports = router;
