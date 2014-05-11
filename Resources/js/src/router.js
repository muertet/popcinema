
crossroads.addRoute('/media/{idm}/{mediaType}/{useless}', function(idm,mediaType){
	mediaInfo = {
		idm: idm,
		mediaType: mediaType,
	};
    Site.cache(idm, mediaType, 'full', function(media)
	{
		DManager.getList(function(dList){
			var currentSeason = 0,
				episode;

			if (media.mediaType == 1 || media.mediaType == 4) {
				for (k in media.seasons) {
					for (i in media.seasons[k]) {
						episode = media.seasons[k][i];
						media.seasons[k][i].title = media.seasons[k][i].title.replace(/\\/g, '');
						media.seasons[k][i].name = media.seasons[k][i].name.replace(/\\/g, '');
						if (episode.watched && episode.season > currentSeason) {
							currentSeason = episode.season;
						}
					}
				}	
			}

			Site.parseTemplate('media.html', {media:media, currentSeason:currentSeason, dList:dList[media.idm+'-'+media.mediaType]}, function(html) {
				Site.html({html:html, title: media.name});

				if (media.mediaType == 2 || media.mediaType == 3) {
					Site.loadLinks(media.idm,media.mediaType);
				}

				$('li[data-episode]').on('click',function(){
				    var idm = $(this).data('episode');

				    if ($('#episode-' + idm + ' li').length == 0) {
				        Site.loadLinks(idm, 5);
				    } else {
				        $('#episode-' + idm).toggle();
				    }
				});

				$('.content-media-season').on('click',function(){
				    var season = $(this).data('season');

				    $('.content-media-season').removeClass("selected");
				    $('#season-indicator-' + season).addClass("selected");

				    $('.content-media-episodes-list').hide();
				    $('#season-' + season).show();
				});
			});
		});
	});
});

crossroads.addRoute('/episode/{idm}/{mediaType}', function(idm,mediaType){
    loadEpisode(idm,mediaType);
});

crossroads.addRoute('/', function(){
    if(sessionStorage.user_token === undefined){
        Site.login();
    }else{
    	SL.user_token = sessionStorage.user_token;
    	setTimeout(function(){
    		crossroads.parse('/miseriesly');
    	},300);
    }
});

crossroads.addRoute('/wellcome', function(){
    Site.parseTemplate('wellcome.html',{},function(html){
		Site.html({html:html,title:"Configuración",fullscreen:true});

		$('#preference-max-downloads').on('change',function(){			
			var val = $(this).val();
			if (val == -1) {return false;}
			
			localStorage.maxMediaDownloads = val;
		});
		$('#preference-language').on('change',function(){
			var val = $(this).val();
			if (val == -1) {return false;}
			
			localStorage.language = val;
		});
		$('#preference-host').on('change',function(){
			var val = $(this).val();
			if (val == -1) {return false;}
			
			localStorage.host = val;
		});
		$('#wellcome-page button').on('click', function(){
			if (localStorage.maxMediaDownloads === undefined || localStorage.language === undefined || localStorage.host === undefined) {
				alert('¡Aún no has completado los ajustes!');
				return false;
			}
			console.log('i join');
			document.location.reload();
		});
	});
});

crossroads.addRoute('/miseriesly', function(){
    if(sessionStorage.user_token === undefined){
        Site.login();
    }else{
    	SL.api('/user/media/pending',function(medias)
        {
            sessionStorage.pendingMedias = JSON.stringify(medias);
            
            for (k in medias) {
            	for (l in medias[k]) {
            		medias[k][l] = Site.parseMedia(medias[k][l]);
            	}
            }

            DManager.getList(function(dList) {

                Site.parseTemplate('miseriesly.html',{myMedia:medias, dList:dList},function(html){
                    Site.html({html:html,title:"Mi series.ly"});

                    $('.content-subtitle').on('click',function () 
                    {
                        $(".content-subtitle").removeClass("selected");
                        $(this).addClass("selected");

                        $(".content-miseriesly").hide();

                        var itemType = $(this).attr("item-type");

                        $("#content-miseriesly-"+itemType).show();
                    });

                    $('.home-media input[type=checkbox]').on('click',function(){

                    	 
                    	var add = $(this).is(':checked'),
                    		idm = $(this).data('idm'),
                    		mediaType = $(this).data('mediatype');

                		if (add) {
				    		PendingMedias.add(idm, mediaType);
				    	}else{
				    		PendingMedias.del(idm, mediaType);
				    	}
                    });
                });
                DManager.startDownloads();
            });
        });
    }
});

crossroads.addRoute('/profile', function(){
    SL.api('/user/followers', function(followers){
		SL.api('/user/following', function(following){
			Site.parseTemplate('perfil.html', {user:User.info, followers:followers, following: following} , function(html){
				Site.html({html:html, title: "Perfil"});
				
				$('#preference-language').on('change',function(){
					var val = $(this).val();
					
					if (val == -1) {
						return false;
					}
					
					localStorage.language = val;
				});
				$('#preference-host').on('change',function(){
					var val = $(this).val();
					
					if (val == -1) {
						return false;
					}
					
					localStorage.host = val;
				});
			});
		});
	});
});

crossroads.addRoute('/logout', function(){
    $.get(App.url + 'logout.php', {}, function() {
    	sessionStorage.removeItem('user_token');
    	localStorage.removeItem('user');
    	window.location = baseUrl;
    });
});

crossroads.addRoute('/search', function(){
    Site.parseTemplate('search.html', {} , function(html)
    {
		Site.html({html:html, title: "Búsqueda"});

		$("#searchInput").focus();

		$('#search-form').on('submit',function(){
			searchInput = $("#searchInput").val();

			if(searchInput.length > 2){
				SL.api('/search',{q:searchInput,limit:25}, function(data){
					var results = data.response.results;
					s = results;
					html = "";

					for(k in results){
						if (results[k].type == 1 || results[k].type == 2 || results[k].type == 3 || results[k].type == 4){	
							html += '<a href="media/'+ results[k].object.idm + '/' + results[k].object.mediaType + '/'+ results[k].object.mediaType+'"><img src="'+results[k].object.img+'" onError="$(this).hide();" class="item" data-name="'+results[k].object.name+'"></a>'
						}
					}

					$("#searchResults").html(html);
				});
			}
		});
	});
});

crossroads.addRoute('/?e=error', function(){
    Site.login(true);
});

$(document).on('click', 'a', function(event) {
	var href = $(this).attr('href');

	if (href.indexOf('file:///') == -1 && href.indexOf('http') == -1 && href.indexOf('#') == -1 && href.indexOf('void(0)') == -1) {		
		
		//PS3 browser hasn't got HTML5 history feature
		event.preventDefault();
		if (typeof history.pushState != 'undefined') { 
			history.pushState('test', {}, href);
		}

		console.log('parsing', href);
		
		if (href.substring(0, 1) != '/') {
			href = '/' + href;
		}

		crossroads.parse(href);
		window.scrollTo(0, 0);
	}
});

function loadPage() {
	var currentRoute = window.location.href.replace($('base').attr('href'), '/');
	
	currentRoute = currentRoute.replace('index.htm','');
	if (currentRoute != '') {
		crossroads.parse(currentRoute);
	}
}
