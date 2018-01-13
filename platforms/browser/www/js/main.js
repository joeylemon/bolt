var settings = {
	current_page: "home",
	editing_profile: false,
	min_email_length: 4,
	min_pass_length: 2,
	min_username_length: 4,
	max_username_length: 16
};

var user;

function signUp() {
	hideKeyboard();
	var email = document.getElementById("signup-email").value;
	var username = document.getElementById("signup-username").value;
	var pass = document.getElementById("signup-pass").value;
	var confirm_pass = document.getElementById("signup-confirm-pass").value;

	if (email.length < settings.min_email_length || !isEmail(email)) {
		displayLoginError("Invalid email");
		$("#signup-button").shake();
		return;
	}

	if (username.length < settings.min_username_length || username.length > settings.max_username_length) {
		displayLoginError("Username must be 4-16 letters");
		$("#signup-button").shake();
		return;
	}
	
	if (! /^[a-zA-Z0-9]+$/.test(username)) {
		displayLoginError("Username must not contain symbols");
		$("#signup-button").shake();
		return;
	}

	if (pass.length < settings.min_pass_length) {
		displayLoginError("Invalid password");
		$("#signup-button").shake();
		document.getElementById("signup-pass").value = "";
		document.getElementById("signup-confirm-pass").value = "";
		return;
	}

	if (pass != confirm_pass) {
		displayLoginError("Passwords do not match");
		$("#signup-button").shake();
		document.getElementById("signup-pass").value = "";
		document.getElementById("signup-confirm-pass").value = "";
		return;
	}

	createUser(email, pass, username);
}

function createUser(email, pass, username) {
	toggleLoggingIn(false);
	$.ajax({
		type: "POST",
		url: "https://jlemon.org/projects/bolt/db.php",
		data: {
			'c_email': email,
			'c_pass': pass,
			'c_username': username
		},
		success: function (result) {
			if (result == "true") {
				user = {
					email: email,
					data: {
						pins: [],
						friends: []
					}
				};

				$("#sent-email").html(email);
				transition("log-in", "confirm-email");
			} else {
				if (result == "exists") {
					displayLoginError("Email already exists");
					$("#signup-button").shake();
				} else {
					displayLoginError("Unable to create account");
					$("#signup-button").shake();
				}
			}
			toggleLoggingIn(true);
		}
	});
}

function login() {
	hideKeyboard();
	var email = document.getElementById("login-email").value;
	var pass = document.getElementById("login-pass").value;

	if (email.length < settings.min_email_length || !isEmail(email)) {
		displayLoginError("Invalid email");
		$("#login-button").shake();
		return;
	}

	if (pass.length < settings.min_pass_length) {
		displayLoginError("Invalid password");
		$("#login-button").shake();
		document.getElementById("login-pass").value = "";
		return;
	}

	getUser(email, pass);
}

function getUser(email, pass) {
	toggleLoggingIn(false);
	$.ajax({
		type: "POST",
		url: "https://jlemon.org/projects/bolt/db.php",
		data: {
			'g_email': email,
			'g_pass': pass
		},
		success: function (result) {
			if (result != "null") {
				user = $.parseJSON(result)[0];
				user.data = $.parseJSON(user.data);
				setProfile();

				if (user.confirmed == 1) {
					transition("log-in", "landing");
				} else {
					$("#sent-email").html("your email");
					transition("log-in", "confirm-email");
				}
			} else {
				displayLoginError("Incorrect email or password");
				$("#login-button").shake();
			}
			toggleLoggingIn(true);
		}
	});
}

function setProfile() {
	$("#profile-username").html(user.username);
	$("#profile-points").html(user.data.points);
	$("#profile-joined").html(getDateFromSeconds(user.data.joined));
}

function toggleProfileOverlay(){
	if(!settings.editing_profile){
		$("#edit-button").html("Finish editing");
		$("#edit-button").addClass("save");
		$("#edit-overlay").show();
	}else{
		$("#edit-button").html("Edit profile");
		$("#edit-button").removeClass("save");
		$("#edit-overlay").hide();
	}
	settings.editing_profile = !settings.editing_profile;
}

$('#edit-pic-button').click(function(){
   $("#image-upload").trigger('click');
});

function toggleLoggingIn(on, opacity = true) {
	if (on) {
		setTimeout(function () {
			if(opacity){
				$("#login-button").css({
					opacity: 1
				});
				$("#signup-button").css({
					opacity: 1
				});
			}
			
			$("#login-button").prop("disabled", false);
			$("#signup-button").prop("disabled", false);
		}, 500);
	} else {
		if(opacity){
			$("#login-button").css({
				opacity: 0.5
			});
			$("#signup-button").css({
				opacity: 0.5
			});
		}
		
		$("#login-button").prop("disabled", true);
		$("#signup-button").prop("disabled", true);
	}
}

function disableLoggingIn(time){
	toggleLoggingIn(false);
	setTimeout(function(){
		toggleLoggingIn(true);
	}, time);
}

function transition(from, to) {
	/*
	$("#" + from).fadeOut(100);
	$("#" + to).delay(100).fadeIn(100);
	*/
	if(!user){
		toggleLoggingIn(false, false);
		setTimeout(function(){
			toggleLoggingIn(true);
		}, 200);
		displayLoginError("");
	}
	$("#" + from).hide();
	$("#" + to).show();
}

function transitionPage(to) {
	if (user && user.confirmed == 1) {
		transition(settings.current_page, to);
		$("#" + settings.current_page + "-menu-item").removeClass("active");
		$("#" + to + "-menu-item").addClass("active");

		settings.current_page = to;
	}
}

function isEmail(email){
	var re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
	return re.test(email);
}

function displayLoginError(message) {
	if(settings.error_task){
		clearTimeout(settings.error_task);
	}
	
	$("#error").html(message);
	$("#error").fadeIn(100);
	settings.error_task = setTimeout(function(){
		$("#error").fadeOut(100);
		settings.error_task = undefined;
	}, 2500);
}

function toggleCreateAccount(on) {
	if (on) {
		transition("sign-in", "create-account");
	} else {
		transition("create-account", "sign-in");
	}
}

function getDateFromSeconds(secs) {
	var date = new Date(secs * 1000);

	var monthNames = [
		"Jan", "Feb", "Mar",
		"Apr", "May", "Jun", "Jul",
		"Aug", "Sep", "Oct",
		"Nov", "Dec"
	];

	var day = date.getDate();
	var month = date.getMonth();
	var year = date.getFullYear();

	return monthNames[month] + " " + day + ", " + year;
}

function hideKeyboard(){
	document.activeElement.blur();
	$("input").blur();
}

jQuery.fn.shake = function () {
	var settings = {
		distance: 15,
		duration: 120,
		shakes: 2
	}
	
	disableLoggingIn(100);

	this.each(function (i) {
		$(this).css({
			"position": "relative"
		});
		for (var x = 1; x <= settings.shakes; x++) {
			$(this).animate({
				left: -settings.distance
			}, settings.duration / 4).animate({
				left: 0
			}, settings.duration / 4).animate({
				left: settings.distance
			}, settings.duration / 4).animate({
				left: 0
			}, settings.duration / 4);
		}
	});
	return this;
}
