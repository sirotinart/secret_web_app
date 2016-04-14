/**
 * Created by art on 25.02.16.
 */


// function sendNewCoupon(url)
// {
//     var data={};
//     data['shortDescr']=document.getElementById('shortDescr').valueOf().value;
//     data['fullDescr']=document.getElementById('fullDescr').valueOf().value;
//     data['price']=document.getElementById('price').valueOf().value;
//     data['discount']=document.getElementById('discount').valueOf().value;
//     data['expDate']=document.getElementById('expDate').valueOf().value;
//     data['crDate']=document.getElementById('crDate').valueOf().value;
//     data['count']=document.getElementById('couponsCount').valueOf().value;
//     data['fullPrice']=document.getElementById('fullPrice').valueOf().value;
//     if(url==='/updateCoupon')
//     {
//         data['couponId']=document.getElementById('couponId').valueOf().value;
//     }
//     console.log(typeof (data['shortDescr']), typeof (data['fullDescr']), typeof (data['price']), typeof (data['discout']), typeof (data['expDate']), typeof (data['count']));

//     console.log('lol');
//     $.post(url, data, function (response){
//         if(response['success']==true)
//         {
//             window.location=response.redirectUrl;
//         }
//         else
//         {
//             if(typeof (response.errorText)!== 'undefined')
//             {
//                 document.getElementById('add').innerHTML=response.errorText;
//             }
//             if(typeof (response.errorText1)!== 'undefined')
//             {
//                 document.getElementById('add1').innerHTML=response.errorText1;
//             }
//             if(typeof (response.errorText2)!== 'undefined')
//             {
//                 document.getElementById('add2').innerHTML=response.errorText2;
//             }
//             if(typeof (response.errorText3)!== 'undefined')
//             {
//                 document.getElementById('add3').innerHTML=response.errorText3;
//             }
//             if(typeof (response.errorText4)!== 'undefined')
//             {
//                 document.getElementById('add4').innerHTML=response.errorText4;
//             }
//             if(typeof (response.errorText5)!== 'undefined')
//             {
//                 document.getElementById('add5').innerHTML=response.errorText5;
//             }
//             if(typeof (response.errorText6)!== 'undefined')
//             {
//                 document.getElementById('add6').innerHTML=response.errorText6;
//             }
//             if(typeof (response.errorText7)!== 'undefined')
//             {
//                 document.getElementById('add7').innerHTML=response.errorText7;
//             }
//             if(typeof (response.errorText8)!== 'undefined')
//             {
//                 document.getElementById('add8').innerHTML=response.errorText8;
//             }

//         }

//     })
// }




function loadCoupons()
{
    $.post('/getCouponList', function(response){
        if(response.success===true)
        {
            var i=0;
            for(i=0; i<response.data.length; i++)
            {
                //$('#listTempl').tmpl(response.data[i]).attr('data-id', response.data[i].COUPON_ID).appendTo('#table')
                $('#listTempl').tmpl(response.data[i]).attr('data-id', response.data[i].COUPON_ID).appendTo('#table')
            }
        }
        else
        {
            if(data.errorType==='not authorized')
            {
                window.location=data.redirectUrl;
            }
            console.log('Пичалька=\\');
        }

    })

}

function lol(atr)
{
    console.log('kek');
}

function downloadCodes(btn)
{
    var couponId=btn.parent().parent().attr('data-id');
    window.location='/getCodeList?couponId='+couponId;

}

function deleteCoupon(btn)
{
    var couponId=btn.parent().parent().attr('data-id');
    $.post('/deleteCoupon', {couponId: couponId}, function(response) {
        if(response.success===true)
        {
            window.location=response.redirectUrl;
        }
        else
        {
            if(typeof (response['errorType'])!=='undefined' && response['errorType']==='not authorized')
            {
                window.location=response.redirectUrl;
            }
            else
            {
                document.getElementById('log1').innerHTML=response['errortext'];
            }
        }
    })
}


function showDescription(coupon)
{
    var couponId=coupon.parent().attr('data-id');
    $.post('/getCouponInfo', {couponId: couponId}, function(response){
        if(response.success===true)
        {
            $("#myModal").find(".modal-title").text(response.data['SHORT_DESCRIPTION'])
            $("#myModal").find('#promoImg').attr('src', response.data['promoImgUrl']);
            $("#myModal").find('#couponDescription').text(response.data['DESCRIPTION']);
            $("#myModal").find('#couponDiscount').text(response.data['DISCOUNT']);
            $("#myModal").find('#couponPrice').text(response.data['PRICE']);
            $("#myModal").find('#couponFullPrice').text(response.data['FULL_PRICE']);
            $("#myModal").find('#couponShops').text(response.data['SHOP_ADDRESS_LIST']);
            $("#myModal").modal();
        }
        else
        {
            document.getElementById('log1').innerHTML=response['errortext'];
        }
    });
}

function loadCouponData(btn)
{
    var couponId=btn.parent().parent().attr('data-id');
    $.post('/getCouponInfo', {couponId: couponId}, function(response){
        if(response.success===true)
        {
            var crDate=moment(response.data['CREATION_DATE']);
            var expDate=moment(response.data['EXPIRATION_DATE']);
            $("#modal2").find("#shortDescr").val(response.data['SHORT_DESCRIPTION'])
            $("#modal2").find('#fullDescr').val(response.data['DESCRIPTION']);
            $("#modal2").find('#discount').val(response.data['DISCOUNT']);
            $("#modal2").find('#price').val(response.data['PRICE']);
            $("#modal2").find('#fullPrice').val(response.data['FULL_PRICE']);
            $("#modal2").find('#crDate').val(crDate.format('YYYY-MM-DD'));
            $("#modal2").find('#expDate').val(expDate.format('YYYY-MM-DD'));
            $("#modal2").find('#couponsCount').val(response.data['COUNT']);
            $("#modal2").find('#couponId').val(response.data['COUPON_ID']);
            $("#modal2").modal();
        }
        else
        {
            document.getElementById('log1').innerHTML=response['errortext'];
        }
    });
}

$(document).ready(function (e) {
    $('#dataForm').on('submit',(function(e) {
        e.preventDefault();
        var formData = new FormData(this);

        $.ajax({
            type:'POST',
            url: $(this).attr('action'),
            data:formData,
            cache:false,
            contentType: false,
            processData: false,
            success:function(response){
                if(response['success']==true)
                {
                    window.location=response.redirectUrl;
                }
                else
                {
                    if(typeof (response.errorText)!== 'undefined')
                    {
                        document.getElementById('add').innerHTML=response.errorText;
                    }
                    if(typeof (response.errorText1)!== 'undefined')
                    {
                        document.getElementById('add1').innerHTML=response.errorText1;
                    }
                    if(typeof (response.errorText2)!== 'undefined')
                    {
                        document.getElementById('add2').innerHTML=response.errorText2;
                    }
                    if(typeof (response.errorText3)!== 'undefined')
                    {
                        document.getElementById('add3').innerHTML=response.errorText3;
                    }
                    if(typeof (response.errorText4)!== 'undefined')
                    {
                        document.getElementById('add4').innerHTML=response.errorText4;
                    }
                    if(typeof (response.errorText5)!== 'undefined')
                    {
                        document.getElementById('add5').innerHTML=response.errorText5;
                    }
                    if(typeof (response.errorText6)!== 'undefined')
                    {
                        document.getElementById('add6').innerHTML=response.errorText6;
                    }
                    if(typeof (response.errorText7)!== 'undefined')
                    {
                        document.getElementById('add7').innerHTML=response.errorText7;
                    }
                    if(typeof (response.errorText8)!== 'undefined')
                    {
                        document.getElementById('add8').innerHTML=response.errorText8;
                    }
                    if(typeof (response.errorText9)!== 'undefined')
                    {
                        document.getElementById('add').innerHTML=response.errorText9;
                    }

                }
            },
            error: function(response){
                console.log("error");
                console.log(response);
            }
        });
    }));

    // $("#ImageBrowse").on("change", function() {
    //     $("#imageUploadForm").submit();
    // });
});