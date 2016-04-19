/**
 * Created by art on 20.02.16.
 */

function registration()
{
    var regCode=document.getElementById('regCode').valueOf();
    var password=document.getElementById('password').valueOf();
    var passwordRepeat=document.getElementById('passwordRepeat').valueOf();
    var city=document.getElementById('regCity').valueOf();
    var name=document.getElementById('regName').valueOf();

    if(!regCode || regCode.value.length===0)
    {
        $('#reg1').html('Код не может быть пустым!');
        return;
    }

    if(!password || password.value.length<4 || password.value.length>10)
    {
        $('#reg3').html('Пароль должен быть от 5 до 9 символов!');
        return;
    }

    if(password.value!==passwordRepeat.value)
    {
        $('#reg4').html('Пароли не совпадают!');
        return;
    }

    if(city.value.length===0)
    {
        $('#reg5').html('Поле не может быть пустым!');
        return;
    }

    if(name.value.length===0)
    {
        $('#reg2').html('Поле не может быть пустым!');
        return;
    }


    $.post('/api/sellers',{regCode:regCode.value, password:password.value, city:city.value, name:name.value},function(response) {
        console.log('in responseHandler');
        if(response.success===false)
        {
            if(!typeof(response.errors[0])!=='undefined' && response.errors[0].length){
                $('#reg1').html(response.errors[0]);
            }

            if(!typeof(response.errors[1])!=='undefined' && response.errors[1].length){
                $('#reg2').html(response.errors[1]);
            }

            if(!typeof(response.errors[2])!=='undefined' && response.errors[2].length){
                $('#reg3').html(response.errors[2]);
            }

            if(!typeof(response.errors[3])!=='undefined' && response.errors[3].length){
                $('#reg5').html(response.errors[3]);
            }
        }
        else
        {
            window.location='/';
        }
    });
}


