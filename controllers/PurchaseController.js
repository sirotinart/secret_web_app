var mysql = require('mysql');
var dbconfig = require('../config/dbconf');
const fs = require('fs');
var path = require('path');
var moment = require('moment');
var Uploads = require('./UploadController');

var purchaseController = {};

purchaseController.getUserPurchases = function (req, res, next)
{
	req.response={};
	if(!req.authorized)
	{
		req.response.success=false;
        req.response.errorText='Не авторизован';
        next();
        return;
	}

	var connection = mysql.createConnection(dbconfig);

	connection.query('select DATE, CODE, USER_ID, COUPON.* from test.PURCHASE '+
		'join test.COUPON where PURCHASE.COUPON_ID = COUPON.COUPON_ID and USER_ID = ?', 
		[req.params.id], function(err, rows){
		if(err)
		{
			console.log('getUserPurchases() error:',err.code);
			req.response.success=false;
			req.response.errorText='Ошибка запроса';
			connection.end();
			next();
			return;
		}

		rows.forEach(function(item, i, arr){
                if(item.DATE)
                {
                    var date=moment(item.DATE);
                    item.DATE=date.format('YYYY-MM-DD');
                }
            });
		req.response.userCouponsList=rows;
		// console.log(req.response.userCouponsList);
		req.response.success=true;
		connection.end();
		next();
	});
}

purchaseController.createPurchase = function (req, res, next)
{
	req.response={};
	if(!req.authorized)
	{
		req.response.success=false;
        req.response.errorText='Не авторизован';
        next();
        return;
	}

	var connection = mysql.createConnection(dbconfig);

	connection.query('select * from UNIQUE_CODE where COUPON_ID = ?', [req.body.couponId], function(err, rows){
		if(err)
		{
			console.log('createPurchase() error:', err.code);
			req.response.success=false;
			req.response.errorText='Ошибка запроса';
			connection.end();
			next();
			return;
		}

		if(rows.length===0)
		{
			req.response.success=false;
			req.response.errorText='Купоны закончились';

			// console.log(req.body.couponId, '\n');
			// console.log(rows, '\n');

			connection.end();
			next();
			return;
		}
		else
		{
			req.body.code=rows[0].CODE;
			// console.log(rows, '\n');

			connection.beginTransaction(function (err){
				if(err)
				{
					console.log('createPurchase() error 1:', err.code);
					req.response.success=false;
					req.response.errorText='Ошибка запроса';
					connection.end();
					next();
					return;
				}

				connection.query('insert into PURCHASE (USER_ID, CODE, DATE, COUPON_ID) values (?, ?, now(), ?)',
					[req.body.userId, req.body.code, req.body.couponId], function (err, result)
					{
						if(err)
						{
							console.log('createPurchase() error 2:', err.code, '\n');
							console.log(req.body);
							req.response.success=false;
							req.response.errorText='Ошибка запроса';

							connection.rollback();
							connection.end();
							next();
							return;
						}

						connection.query('delete from UNIQUE_CODE where CODE = ? and COUPON_ID = ?', 
							[req.body.code, req.body.couponId], function (err, result){
								if(err)
								{
									console.log('createPurchase() error 3:', err.code);
									req.response.success=false;
									req.response.errorText='Ошибка запроса';

									connection.rollback();
									connection.end();
									next();
									return;
								}

								connection.commit(function (err){
									if(err)
									{
										console.log('createPurchase() error 4:', err.code);
										req.response.success=false;
										req.response.errorText='Ошибка запроса';

										connection.rollback();
									}
									else
									{
										req.response.success=true;
									}
									connection.end();
									next();
								})
							});

					});
			});
		}
	});
}

module.exports=purchaseController;