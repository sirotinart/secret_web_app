ymaps.ready(init);
var myMap;
var myCollection;
var placemark;

function init(){   


    myMap = new ymaps.Map("map", {
        center: [55.76, 37.64],
        zoom: 11,
        controls: ['geolocationControl', 'zoomControl']
    });

    var myButton = new ymaps.control.Button({
    	data: {content: 'Добавить адрес'},
    	options: {maxWidth : 200}

    });
	myButton.events.add(
	    'select',
	    function () {
	    	myMap.events.add('click', test);
	      	console.log('myButton select');
	    }).add(
	    'deselect',
	    function () {
	    	myMap.events.remove('click', test);
	      	console.log('myButton deselect');
	    }
  	);

	var searchControl = new ymaps.control.SearchControl({
		options: {
			float: 'left',
         	size: 'large'
     	}
	});    

  	myMap.controls.add(myButton, {float: "right"});
  	myMap.controls.add(searchControl);

  	myCollection=new ymaps.GeoObjectCollection();

  	myMap.geoObjects.add(myCollection);

  	$.get('/getUserInfo', function (response){
		if(response.sucsess===false)
		{
			window.location=response.redirectUrl;
		}
		else
		{
			var city=ymaps.geocode(response.orgCity, {kind: 'locality'});
			city.then(
				function (res){
					myMap.setCenter(res.geoObjects.get(0).geometry.getCoordinates());
				},
				function (err){
					console.log(err);
				});
		}
	});
}


function test(e)
{
	console.log('test()');
	var coords = e.get('coords');
	console.log(coords);
	placemark=new ymaps.Placemark(coords);
	placemark.events.add('contextmenu', function(e){
		myCollection.remove(e.get('target'));
		updateAddressList();
	})
	
	var place=ymaps.geocode(coords, {kind: 'house'});
	place.then(
		function (res) {
			console.log(res.geoObjects.get(0).properties);
			placemark.adress=res.geoObjects.get(0).properties.get('metaDataProperty').GeocoderMetaData.AddressDetails.Country.AddressLine;
			//console.log(placemark);
			myCollection.add(placemark);
			updateAddressList();
		}, 
		function (err) {
			console.log(err);
		});
}


function updateAddressList()
{
	//console.log(myCollection);

	var iterator = myCollection.getIterator(), object;

	$("#addressList").empty();
	while ((object = iterator.getNext()) != iterator.STOP_ITERATION) 
	{
		console.log(object.adress);
		$("#addressList").append(object.adress + '\n');
	}
}