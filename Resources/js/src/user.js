var User={
	info:{},
	maxMediaDownloads:3,
	login : function(username, password){
		$.post(App.url+'login.php',{username:username,password:password},function(data){
			if (data == 0) {
				if ($('.loginError').length < 1) {
					
					localStorage.removeItem('username');
					localStorage.removeItem('password');
					
					Site.login();
				}else{
					$('.loginError').show();
				}
			}else{
				var data = jQuery.parseJSON(data);
				
				sessionStorage.user_token = data.user_token;
				localStorage.user = JSON.stringify(data.user);
				localStorage.username = username;
				localStorage.password = password;
				document.location.reload();
			}
		});
	}
};