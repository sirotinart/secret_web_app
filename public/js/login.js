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

    $.post('/login', {regCode:login.value, password:password.value}, function(data){
        if(data['success']===false)
        {
            document.getElementById('log2').innerHTML=data['errorText'];
        }
        else
        {
            window.location=data['redirectUrl'];
            console.log('fesrsreg00');
        }


    });




}