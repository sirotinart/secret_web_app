/**
 * Created by art on 25.02.16.
 */


function loadCoupons()
{
    $.get('/api/coupons/list', function(response){
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
            if(data.errorText==='Не авторизован')
            {
                window.location=data.redirectUrl;
            }
            // console.log('Пичалька=\\');
        }
    });
}

function lol(atr)
{
    console.log('kek');
}

function downloadCodes(btn)
{
    var couponId=btn.parent().parent().attr('data-id');
    window.location='/codes/'+couponId;

}

function deleteCoupon(btn)
{
    var couponId=btn.parent().parent().attr('data-id');
    $.ajax({
        type: 'DELETE',
        url:'/api/coupons/'+couponId,
        data: {couponId:couponId},
        success: function(response){
            if(response.success===true)
            {
                window.location=response.redirectUrl;
            }
            else
            {
                if(typeof (response.errorText!=='undefined') && response.errorText==='Не авторизован')
                {
                    window.location=response.redirectUrl;
                }
                else
                {
                    $('#log1').html(response.errorText);
                }
            }
        }
    });
}


function showDescription(coupon)
{
    var couponId=coupon.parent().attr('data-id');
    $.get('/api/coupons/'+couponId, function(response){
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
            $('#log1').html(response.errorText);
        }
    });
}

function loadCouponData(btn)
{
    var couponId=btn.parent().parent().attr('data-id');
    $.get('/api/coupons/'+couponId, function(response){
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
            $("#modal2").find('#dataForm').attr('action', '/api/coupons/'+response.data['COUPON_ID']);
            $("#modal2").modal();
        }
        else
        {
            $('#log1').html(response.errorText);
        }
    });
}

$(document).ready(function (e) {
    $('#dataForm').on('submit',(function(e) {
        e.preventDefault();
        var formData = new FormData(this);

        $.ajax({
            type:$(this).attr('method'),
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
                    if(typeof(response.errors)!=='undefined')
                    {
                        response.errors.forEach(function(item, i, arr){
                            if(item.length)
                            {
                                var id='#err'+(i+1);
                                $(id).html(item);
                            }
                        })
                    }
                }
            },
            error: function(response){
                console.log("error");
                console.log(response);
            }
        });
    }));
});

function loadCodes()
{
    var couponId=$('#codesList').attr('data-id');
    $.get('/api/coupons/'+couponId+'/codes', function (response){
        if(response.success===true)
        {
            $('#couponName').html(response.name);
            $('#downloadBtn').attr('href', response.downloadLink);
            response.codes.forEach(function(item, i ,arr){
                $('#codesList').append("<tr><td class='text-center'>"+item.CODE+"</td></tr>");
            });
        }
    })
}