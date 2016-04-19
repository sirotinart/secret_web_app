/**
 * Created by art on 22.02.16.
 */

function login()
{
    var login=document.getElementById('login').valueOf();
    var password=document.getElementById('password').valueOf();

    if(login.value.length===0)
    {
        document.getElementById('log1').innerHTML='Введите регистрационный код!';
        return;
    }

    if(password.value.length===0)
    {
        document.getElementById('log2').innerHTML='Введите пароль!';
        return;
    }

    $.post('/api/login', {regCode:login.value, password:password.value}, function(data){
        if(data.success===false)
        {
            document.getElementById('log2').innerHTML=data.errorText;
        }
        else
        {
            window.location=data.redirectUrl;
        }
    });
}

function logout()
{
    $.post('/api/logout', function(data) {
        if(data.success)
        {
            window.location=data.redirectUrl;
        }
    });
}