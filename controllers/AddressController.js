var mysql = require('mysql');
var dbconfig = require('../config/dbconf');


var addressController = {}

addressController.getList = function (req,res, next)
{
    var connection = mysql.createConnection(dbconfig);
    req.response={};

    connection.query('select CITY from ADDRESS order by CITY ASC', function(err, row, fields){
        if(err)
        {
            req.response.success=false;
            req.response.errortext='Ошибка обращения к БД!';
        }
        else
        {
        	req.response.success=true;
            req.response.cities=[];

            var i=0;
            for (i=0; i<row.length; i++)
            {
                req.response.cities[i]=row[i]['CITY'];
            }
        }
        connection.end
        next();
    });
};

addressController.checkExistence = function (req, res, next)
{
    req.response={};

    var connection=mysql.createConnection(dbconfig);

    connection.query('select * from ADDRESS where CITY = ?', [req.body.city], function(err, rows, fields){

        if(err)
        {
            console.log('addressController checkExistence() error:', err.code);
            req.response.success=false;
			req.response.errorText='Ошибка запроса!'

            connection.end();
            next();
            return;
        }

        if(rows.length!==0)
        {
        	req.response.success=true;
        }
        else
        {
        	req.response.success=false;
        	req.response.errorText='Введен город не из списка!'
        }
        connection.end();
        next();
    });

}

module.exports = addressController;