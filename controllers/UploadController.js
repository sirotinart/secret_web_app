const fs = require('fs');
var path = require('path');

var uploadController={}


uploadController.uploadAvatar = function(req, res, next)
{
	if(!req.authorized)
	{
		req.response.success==false;
    	req.response.redirectUrl='/';
    	req.response.errorText='Не авторизован';
    	next();
    	return;
	}

    //console.log(req.files);
    req.src=req.files.avatar.path;
    req.dest=path.join(__dirname, '..', 'private', req.session.username) + '/avatar.jpg';
    uploadController.moveImg(req, res, function(){
    	next();
    });
}

uploadController.moveImg = function moveImg(req, res, next)
{
    console.log(req.src, req.dest);
    fs.rename(req.src, req.dest, function(err){
        if(err)
        {
            console.log('uploadController moveImg() error: ', err.code);
        }
    });

    next();
}

uploadController.downloadCodes = function (req, res, next)
{
    if(req.acsessGranted===false)
    {
        res.render('errorPage.jade', {errorText: 'Acsess denied'});
        return;
    }

    // console.log(req.url, req.originalUrl)

    res.download('.' + req.originalUrl);
}

module.exports=uploadController;