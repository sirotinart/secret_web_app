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
        document.getElementById('reg1').innerHTML='Код не может быть пустым!';
        return;
    }

    if(!password || password.value.length===0)
    {
        document.getElementById('reg2').innerHTML='Пароль не может быть пустым!';
        return;
    }

    if(password.value!==passwordRepeat.value)
    {
        document.getElementById('reg3').innerHTML='Пароли не совпадают!';
        return;
    }

    if(city.value.length===0)
    {
        document.getElementById('reg4').innerHTML='Поле не может быть пустым!';
        return;
    }

    if(name.value.length===0)
    {
        document.getElementById('reg5').innerHTML='Поле не может быть пустым!';
        return;
    }


    $.post('/register',{regCode:regCode.value, password:password.value, city:city.value, name:name.value},function(data) {
        console.log('in responseHandler');
        if(data['error']===true)
        {
            if(data['errorCode']===1)
            {
                document.getElementById('reg1').innerHTML=data['errorText'];
            }
            if(data['errorCode']===2)
            {
                document.getElementById('reg4').innerHTML=data['errorText'];
            }
            if(data['errorCode']===3)
            {
                document.getElementById('reg4').innerHTML=data['errorText'];
            }
            if(data['errorCode']===4)
            {
                if(data['errorCode']===3)
                {
                    document.getElementById('reg5').innerHTML=data['errorText'];
                }
            }

        }
        else
        {
            window.location='/';
        }



    });


    //var xhr = new XMLHttpRequest();
    //
    //var body = 'regCode=' + encodeURIComponent(regCode.value) +
    //    '&password=' + encodeURIComponent(password.value);
    //
    //xhr.open("POST", '/register', true)
    //xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    //
    ////xhr.onreadystatechange = ...;
    //
    //xhr.send(body);
}

function responseHandler(data)
{
    console.log('in responseHandler');
}

