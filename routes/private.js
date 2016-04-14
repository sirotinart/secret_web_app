/**
 * Created by art on 05.03.16.
 */
var express = require('express');
var regMgr=require('../modules/regMgr');
var loginMgr=require('../modules/loginMgr');
var dataMgr=require('../modules/dataMgr');

var router = express.Router();

var options = {
    root: __dirname + '/../private/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
};

router.get('/*', loginMgr.isAuthorized, checkAcsess, function(req, res){
	req.response={};

	if(req.authorized===false)
	{
		res.redirect('/');
		return;
	}

	if(req.acsessGranted===false)
	{
		res.render('errorPage.jade', {errorText: 'Acsess denied'});
		return;
	}

    res.sendFile(req.url,options);

});

function checkAcsess(req, res, next)
{
	var supplier=req.url.split('/',2);
	
	if(supplier[1]===req.session.username)
	{
		req.acsessGranted=true;
		console.log('checkAcsess(): ', req.url, req.session.username, 'acsess granted!');
	}
	else
	{
		req.acsessGranted=false;
		console.log('checkAcsess(): ', req.url, req.session.username, 'acsess denied!');
	}
	next();
}

module.exports=router;