var SDK = {

	dataHost:			'https://api.mirascape.com/', // Set to the API location. Trailing slash does not matter.
	features:			{
		stats:		false,
		collections:	true,
		groups:		false,
		missions:	false,
		media:		true
	},

	activeGeolocation:		true, // set to true if you want to turn on active geolocation.
	geolocationHighAccuracy:	false,

	authenticationEnabled:		true,
	interfaceAnimationEnabled:	false,
	
	requireLogin:			false,

	init: function() { return this.initialize(); },
	initialize: function() {

		if (SDK.interfaceAnimationEnabled !== true) {
			$.fx.off = true;
		} else if (this.benchmark() >= 250) {
			// alert('We will be disabling animations for you. ');
			$.fx.off = true;
		}

		this.createTemplates();
		this.loadUserAccount();

		if (SDK.requireLogin !== true) {
			this.loadCampaign(this.campaignID);
		} else {
			this.displayLogin();
		}
		
		this.enableControls();

		if (this.activeGeolocation) {
		
			if (navigator.geolocation) {

				this.geolocator = navigator.geolocation.watchPosition(
					this.updateLocation,
					this.errorCallback,
					{
						enableHighAccuracy: this.geolocationHighAccuracy,
						timeout: 180000
					}
				);
			} else {
				alert('Your device does not appear to support GPS, so you may not have access to all features.');
			}
		}

	},

	errorCallback: function() {},

	reload: function() {  $('#loading').css('z-index', '9001').show(); this.init(); },
	restart: function() { window.location.reload(); },

	createTemplates: function() {
		$('#shareDialogTemplate').template('shareDialog');
		$('#statListTemplate').template('statList');
		$('#groupListTemplate').template('groupList');
		$('#missionListTemplate').template('missionList');
		$('#collectionListTemplate').template('collectionList');
		$('#assetListTemplate').template('mediaList');
		$('#itemViewTemplate').template('itemView');
	},

	enableControls: function() {

		var tabContainers=$('.tab_box');

		$('#tabs a').click(function(){
			tabContainers.hide().filter(this.hash).fadeIn();
			$('#tabs td').removeClass('selected');
			$(this).parents('td:first').addClass('selected');
			return false;
		});
		var local = location.hash;
		if (local != '') {
			// Check if the tab exists first! If not, we'll use the first one.
			// TODO: try...
			// <temp01> crescendo: you can just do $('#tabs a').filter('[href="'+local+'"], :first').first().click();
			if ($('#tabs a').filter('[href="'+local+'"]').length == 0) {
				$('#tabs a').filter(':first').click();
			} else {
				$('#tabs a').filter('[href="'+local+'"]').click();
			}
		} else {
			$('#tabs a').filter(':first').click();
		}

	},

	showInterface: function () {
		$('#container').css({ display: 'table' }); // prepare the container object as a table element.
		$('#loading').fadeOut(); // hide the loading screen.
	},

	login: function(email, password) {
		$.ajax({
			url:		this.dataHost,
			dataType:	'jsonp',
			jsonpCallback:	'SDK.handleLogin',
			data:		{
				action:		'login',
				email:		email,
				password:	password
			}
		});
	},

	createUser: function(userData) {
		$.ajax({
			url:		this.dataHost,
			dataType:	'jsonp',
			jsonpCallback:	'SDK.handleRegistration',
			data:		{
				action:		'createUser',
				email:		userData.email,
				firstName:	userData.firstName,
				lastName:	userData.lastName,
				password:	userData.password,
				gender:		userData.gender,
				birthdate:	userData.birthdate
			}
		});
	},

	handleLogin: function(response) {
		if (response.status == 'error') {
			alert(response.message);
			SDK.restart();
		} else {
			$('#login').dialog('destroy');
			SDK.reload();
		}
	},

	handleRegistration: function(response) {
		if (response.status == 'error') {
			alert(response.message);
			//SDK.restart();
		} else {
			$('#register').dialog('destroy');
			SDK.reload();
		}
	},

	loadUserAccount: function() {
		$.ajax({
			url:		this.dataHost,
			async:		false,
			dataType:	'jsonp',
			jsonpCallback:	'SDK.displayUserAccount',
			data:		{
				action:		'myAccount'
			}
		});
	},

	loadCampaign: function(id) {
		$.ajax({
			url:		this.dataHost,
			async:		false,
			dataType:	'jsonp',
			jsonpCallback:	'SDK.displayCampaign',
			data:		{
				action:		'getCampaign',
				depth:		'full',
				campaignID: 	this.campaignID
			}
		});
	},

	displayLogin: function() {
		$('#login').dialog({
			title:		'Login',
			autoOpen:	true,
			modal: 		true,
			draggable:	false,
			resizable:	false,
			position:	'top',

			buttons:	{
				"Register":	function() {
					$(this).dialog('destroy');
					SDK.displayRegistration();
				},
				"Login":	function() {
					SDK.login(
						$('#loginForm #emailField').val(),
						$('#loginForm #passwordField').val()
					);
				}
			}
		});
	},

	displayRegistration: function() {
		$('#register').dialog({
			title:		'Register',
			autoOpen:	true,
			modal: 		true,
			draggable:	false,
			resizable:	false,
			position:	'top',

			buttons:	{
				"Register":	function() {

					var userData = {
						email:		$('#registrationForm #emailField').val(),
						firstName:	$('#registrationForm #firstNameField').val(),
						lastName:	$('#registrationForm #lastNameField').val(),
						password:	$('#registrationForm #passwordField').val(),
						gender:		$('#registrationForm #genderField').val(),
						birthdate:	$('#registrationForm #birthdateField').val()
					};

					SDK.createUser(userData);
				}
			}
		});
	},

	displayUserAccount: function(account) {
		if (account.status !== 'error') {
			$('.myDisplayName').html(account.displayName);
		}
		
		this.enableControls();
	},

	displayCampaign: function(campaign) {
		this.campaign = campaign;
		document.title = campaign.title;

		$('.campaignName').html(campaign.title);
		$('.campaignSynopsis').html(campaign.synopsis);
		$('.campaignDescription').html(campaign.description);
		$('.campaignStatus').html(campaign.status);
		if(campaign.status === 'Open') $('.campaignStatus').removeClass('inactive').addClass('active');

		$('.campaignThumbnail').attr("src", campaign.thumbnailURL);
		$('.campaignThumbnail').attr("href", campaign.thumbnailURL);

		$.tmpl('statList', campaign).appendTo('.statList');
		$.tmpl('groupList', campaign).appendTo('.groupList');
		$.tmpl('missionList', campaign).appendTo('.missionList');
		$.tmpl('collectionList', campaign).appendTo('.collectionList');
		$.tmpl('mediaList', campaign).appendTo('.mediaList');

		// Notably: this must take place after templates create the markup.
		$('.accordion').accordion({
			autoHeight: false
		});

		$('.item.active').click(function() {
			//$('#itemDetail').html( $(this).children('.detail').clone(true).html() );
			$(this).children('.detail').clone(true).appendTo('#itemDetail');
			$('#itemDetail .detail').slideToggle();
			$('#collections .accordion').slideToggle();
			
			$('#itemDetail .detail img.large_icon').click(function() {
				$('#itemDetail .detail .itemView').clone(true).dialog({
					modal:	true,
					stack:	false,
					draggable:	false,
					resizable:	false,
					
					dialogClass:	'lightbox',
					
					height: 'auto',
					width: 'auto',
					open: function(){
						$('.ui-widget-overlay').hide().fadeIn();
					},
					show: "fade",
					hide: "fade",		
					
				});
				
				$('.ui-widget-overlay').addClass('lightbox-overlay');
				
				$('.lightbox, .ui-widget-overlay').click(function() {
					
					$('*').dialog('close', function() {
						$('*').dialog('destroy');
					});
					
				});
			});
		});

		$('.detail-breadcrumb a').click(function(){
			$('#collections .accordion').slideToggle();
		
			$('#itemDetail .detail').slideUp(function(){
				
				$('#itemDetail .detail').remove();				
			});
		});

		$('#share').click(function() {

			$.tmpl('shareDialog', campaign).dialog({
				title:		'Share!',
				modal: 		true,
				stack:		false,
				draggable:	false,
				resizable:	false,
				position:	'top',

				buttons:	{
					'Close':	function() {
						$(this).dialog('destroy');
					},
					'Share!':	function() {
					
						$.ajax({
							url:		SDK.dataHost,
							async:		false,
							dataType:	'jsonp',
							jsonpCallback:	'SDK.handleShareResponse',
							data:		{
								action:		'share',
								text:		$(this).children('textarea').val()	// $('#shareText').val(); ?	
							}
						});
						
						$(this).dialog('destroy');
											
					}
				}
			});

			$('textarea').blur();

			$('#tweetButton').click(function () {
				window.location.href = 'http://mobile.twitter.com/?status=' + $('#shareText').val();
			});

			$('#facebookButton').click(function () {
				window.location.href = 'http://www.facebook.com/sharer.php?u='+ campaign.shortURL +'&t=' + $('#shareText').val();
			});
		});

		this.showInterface();

	},
	
	handleShareResponse:	function(response) {
		alert(response.status + ': ' + response.message);
	},

	showDetail:	function (target) {

		//$(this).children('.detail').css('display', 'block');
		target.dialog('open');
	},

	geolocate: function() {},
	
	benchmark:  function() {
		SDK.timeDiff.start();
		
		for ( i = 0; i <= 10000; i= i+1) {
			$('#debug').html(i);
		}
		
		SDK.benchmarkTime = SDK.timeDiff.end();
		$('#debug').html(SDK.benchmarkTime);
		
		return SDK.benchmarkTime;
	},
	
	timeDiff:	{
		start:	function (){
				d = new Date();
				SDK.timeDiff.time  = d.getTime();
		},

		end:	function (){
				d = new Date();
				return (d.getTime()-SDK.timeDiff.time);
		}		
	},

	updateLocation: function(position) {
		$.ajax({
			url:	this.dataHost,
			type:	'POST',
			data:	{
				latitude: 	position.coords.latitude,
				longitude:	position.coords.longitude
			}
		});
	},

}

