var express = require('express');
const fs = require('fs');
var path = require('path');
var multipart = require('connect-multiparty');
var router = express.Router();

var Sessions = require('../controllers/SessionController');
var Cities = require('../controllers/AddressController');
var Sellers = require('../controllers/SellerController');
var Users = require('../controllers/UserController');
var Coupons = require('../controllers/CouponController');
var Uploads = require('../controllers/UploadController');
var Purchases = require('../controllers/PurchaseController');

var multipartMiddleware = multipart({ uploadDir: path.join(__dirname, '..','tmpdir') });


var options = {
    root: __dirname + '/../',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
};


router.get('/', function(req, res, next) { res.sendFile('/html/index.html',options); });

router.get('/register', function(req,res, next){ res.sendFile('/html/register.html', options) });

router.get('/account', function(req,res,next){
    if(req.authorized===true)
    {
        res.sendFile('/html/account.html',options);
    }
    else
    {
        res.redirect('/');
    }
});

router.get('/stat', function(req,res,next){
    if(req.authorized===true)
    {
        res.sendFile('/html/stat.html',options);
    }
    else
    {
        res.redirect('/');
    }
});

router.get('/addcoupon', function(req, res, next){
    if(req.authorized===true)
    {
        res.sendFile('/html/newcoupon.html', options);
    }
    else
    {
        res.redirect('/');
    }
});

router.get('/profile', function(req, res, next){
    if(req.authorized===true)
    {
        res.sendFile('/html/profile.html', options);
    }
    else
    {
        res.redirect('/');
    }
});

router.get('/codes/:id', function(req, res, next){
    if(req.authorized===true)
    {
        res.render('codeList.jade', {couponId:req.params.id});
    }
    else
    {
        res.redirect('/');
    }
});




router.post('/api/sellers', Sellers.create, function (req, res){res.send(req.response);});

router.get('/api/profile', Sellers.getSeller, function(req, res){res.send(req.response);});


router.post('/api/login', Sessions.sellerLogin, function (req, res){res.send(req.response);});

router.post('/api/logout', Sessions.logout, function(req, res){res.send(req.response);});

router.post('/api/mobile/login', Sessions.userLogin, function(req, res){res.send(req.response);});

router.post('/api/mobile/logout', Sessions.logout, function(req, res){res.send(req.response);});


router.get('/api/cities', Cities.getList, function(req, res, next){res.send(req.response);});


router.post('/api/coupons', multipartMiddleware, Coupons.create, function(req,res){res.send(req.response);});

router.get('/api/coupons/list', Coupons.getList, function (req,res,next){res.send(req.response);});

router.get('/api/coupons/:id/codes', Coupons.getCodesList,function(req, res){res.send(req.response);});

router.delete('/api/coupons/:id', Coupons.delete, function(req, res){res.send(req.response);});

router.get('/api/coupons/:id', Coupons.getCoupon, function(req,res){res.send(req.response);});

router.put('/api/coupons/:id', multipartMiddleware, Coupons.update, function(req, res){res.send(req.response);});

router.get('/api/coupons', Coupons.getAll, function(req, res){res.send(req.response);});


router.get('/private/:id/codes/*', Uploads.sendCodes);

router.get('/private/:id/img/*', Uploads.sendImg);

router.post('/api/uploadavatar', multipartMiddleware, Uploads.uploadAvatar, function(req,res){res.redirect('/profile');});


router.post('/api/users', Users.create, function (req, res){res.send(req.response);});

router.put('/api/users', Users.update, function (req, res){res.send(req.response);});


router.get('/api/purchases/:id', Purchases.getUserPurchases, function(req, res){res.send(req.response);});

router.post('/api/purchases', Purchases.createPurchase, function(req, res){res.send(req.response);});


module.exports = router;
