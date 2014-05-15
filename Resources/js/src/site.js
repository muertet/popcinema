var Site = {
    mediaType: {
        1: {singular: 'serie', plural: 'series'},
        2: {singular: 'peli', plural: 'pelis'},
        3: {singular: 'programa de TV', plural: 'programas de TV'},
        4: {singular: 'documental', plural: 'documentales'}
    },
    TYPE_SERIE : 1,
    TYPE_MOVIE : 2,
    TYPE_TVSHOW : 3,
    TYPE_DOCU : 4,
    login: function(displayError) {
        if (typeof displayError === undefined) {
            displayError = false;
        }
        
        if (typeof localStorage.username != 'undefined' && localStorage.username != '') {
			User.login(localStorage.username, localStorage.password);
			return false;
		}
        
        Site.parseTemplate('login.html', {displayError: displayError}, function(html)
        {
            Site.html({html: html, title: 'Acceder a tu cuenta',callback:function()
            {
            	$(document).ready(function(){
    				$("#username").focus();

    				$('#loginForm form').on('submit',function(e){
    					e.preventDefault();
    					$('.loginError').hide();
    					
    					var username=$('#username').val(),
    						password=$('#password').val();

    					if(username=='' || password==''){
    						return false;
    					}
    					
    					User.login(username,password);
    				});
    			});
            }});
        });
    },
    loadLinks: function(idm,mediaType) {
        SL.api('/media/episode/links',{idm:idm,mediaType:mediaType},function(links)
        {
        	DManager.getList(function(dList)
        	{
        		var link={},
				html='',
				video;
				
        		for (k in dList[mediaInfo.idm+'-'+mediaInfo.mediaType])
        		{
        			video = dList[mediaInfo.idm+'-'+mediaInfo.mediaType][k];
					if (video.idmEpisode == idm) {
						video.link = 'file:///'+jDownloader.getDownloadDirectory()+'/'+video.file_name;
						
						html+=Site.parseTemplate(function(){/*
			                <li class="downloaded-content">
				                <a href="<%=video.link%>" target="_blank">
				                	<span class="host">
				                		<strong><%=video.file_name%> </strong>
				                	</span> 
				                	<span class="lang">
				                	</span>
				                	<span>
				                		<% if (video.file_percent != "100.00") { %>
				                			<div data-idmepisode="<%=video.idmEpisode%>" data-mediatype="<%=video.mediaType%>" data-idm="<%=video.idm%>" data-type="download" data-file="<%=video.file_name%>" data-value="<%=video.file_percent%>" style="display: inline-block;float: right;height: 20px;width: 200px;"></div>
				                		<% }else{ %>
				                			VER
				                		<% } %>
				                	</span>
				                </a>
			                </li>
						*/},{video:video,auth_token:SL.auth_token,userToken:SL.user_token});
					}
				}
				
				if(typeof links.streaming !== 'undefined')
	            {
		            for(k in links.streaming)
		            {
		                link=links.streaming[k];

		                if(link.features===undefined){
		                    link.features='';
		                }
		                if(link.quality===undefined){
		                    link.quality='';
		                }

		                html+=Site.parseTemplate(function(){/*
		                <li id="link-<%=link.idv%>" data-idv="<%=link.idv%>" data-idm="<%=idm%>" data-mediatype="<%=mediaType%>">
			                <a href="<%=link.video_url%>?auth_token=<%=auth_token%>&user_token=<%=userToken%>" target="_blank">
			                	<span class="host">
			                		<strong><%=link.host%></strong>
			                	</span> 
			                	<span class="lang"><%=link.lang%></span> 
			                	<span data-id="download-bar"><%=link.quality%></span>
			                </a>
			                <button onclick="Site.jd(<%=idm%>,<%=mediaType%>,<%=link.idv%>);">Enviar a JDownloader</button>
			                <button data-action="watch-online">Ver online</button>
		                </li>
						*/},{link:link,idm:idm,mediaType:mediaType,auth_token:SL.auth_token,userToken:SL.user_token});
		            }
	            }

	            if(mediaType==5){
	                $('#episode-'+idm).html(html).show();
	            }else{
	                $('.content-media-episodes ul').html(html);
	            }
	            
	            $('button[data-action="watch-online"]').on('click',function(){
                    var parent = $(this).parent(),
                        idm = parent.data('idm'),
                        mediaType = parent.data('mediatype'),
                        idv = parent.data('idv');

                    $(this).attr('disabled','disabled');

                    App.getLink(idm, mediaType, idv, function(link) {
                        var embed = Site.buildEmbed(link);
                        Site.html({html:'<div style="text-align:center">'+embed+'</div>'});
                    });
                });
	            
	            Site.startDownloadBars();
        	});
        });
    },
    startDownloadBars:function()
    {
    	//prevent multiple intervals
    	if (typeof downloadBarInterval != 'undefined') {
			clearInterval(downloadBarInterval);
			delete(downloadBarInterval);
		}
		
		if ( $('div[data-type=download]').length > 0 )
        {
        	$('div[data-type=download]').each(function(){
            	$(this).progressbar({ value: $(this).data('value'), max: 100 });
            });
        
            downloadBarInterval = setInterval(function()
            {
            	DManager.getList(function(list)
            	{
            		var dList = {};
            		
            		for(media2 in list){
						for(k in list[media2]){
							dList[list[media2][k].file_name] = list[media2][k].file_percent;
						}
					}
					
            		$('div[data-type=download]').each(function(){
	            		var file = $(this).data('file'),
	            			idm = $(this).data('idm'),
	            			idmEpisode = $(this).data('idmepisode'),
	            			mediaType = $(this).data('mediatype');
	            		
	            		$(this).progressbar({ value:parseFloat(dList[file]), max: 100, change: function() {
					        $(this).children().text( $(this).progressbar( "value" ) + "%" );
					      },
					      complete: function() {
					        // notify about the started download
							Site.getMediaName(idm, mediaType, idmEpisode, function (name){
								var notification = Ti.Notification.createNotification({
								    'title' : 'PopCinema',
								    'message' : ' Descarga de '+name+' completada',
								    'timeout' : 10,
								    'icon' : 'app://download.png'
								});

								notification.show();
							});
							$(this).remove();
					      }
				      });
	            	});
	            	if( $('div[data-type=download]').length < 1 ) {
						clearInterval(downloadBarInterval);
					}
            	});
            },1000);
        }	
	},
	jd: function(idm,mediaType,idv){
		
		$('#link-'+idv+' button').attr('disabled','disabled').text('Enviando descarga...');
		
		$.post(App.url+'go.php',{idv:idv, idm:idm, mediaType:mediaType},function(vlink){
			if(vlink == '' || vlink.indexOf('http') == -1){
                alert('No se pueden obtener enlaces, la app parece caída.');
				return false;
			}

            DManager.add({
                idm : mediaInfo.idm,
                idmEpisode : idm,
                mediaType : mediaInfo.mediaType,
                idv : idv,
                vlink : vlink,
                manager : DManager.MANAGER_JDOWNLOADER,
            },function(data) {

                // hide all download buttons
                $('#link-'+idv+' button').remove();
                $('#link-'+idv).addClass('downloaded-content');
                
                // insert downloadbar
                $('#link-'+idv+' span[data-id="download-bar"]').html('<div data-idmepisode="'+data.idmEpisode+'" data-mediatype="'+data.mediaType+'" data-idm="'+data.idm+'" data-type="download" data-file="'+data.file_name+'" data-value="00.00" class="download-bar"></div>');
                Site.startDownloadBars();
            });
		});
	},
	getMediaName : function(idm, mediaType, idmEpisode , callback) {
		
		if (typeof idmEpisode == 'function') {
			callback = idmEpisode;
			delete(idmEpisode);	
		}
		
		Site.cache(idm, mediaType, 'full', function(media) {
			
			if (typeof idmEpisode != 'undefined') {
				
				for (k in media.seasons)
				{
					var season = media.seasons[k];
					for (i in season) {
						var episode = season[i];
						
						if (episode.idm == idmEpisode) {
							callback(episode.season+'x'+episode.num+' - '+episode.name);	
						}
					}
				}
				return '';
			}else{
				callback(media.name);
			}
		});
	},
    cache: function(id,mediaType,type,callback) {
        var key='mediaCache'+id+'_'+mediaType,
            data={};

        if(id === undefined || type === undefined){
            return false;
        }

        data = localStorage[key];

        if(data===undefined)
        {
            SL.api('/media/'+type+'_info',{idm:id,mediaType:mediaType},function(media)
            {
                var obj={
                    basic:{
                        idm:media.idm,
                        mediaType:media.mediaType,
                        name:media.name,
                        image:media.poster.small
                    }
                };

                if(type=='full')
                {
                    if(typeof media.plot_es !='undefined'){
                        media.plot=media.plot_es;
                    }
                    
                    // download media poster
                    App.downloadPoster(media.poster.large);

                    obj.full=media;
                    //obj.full=obj.basic;
                    //obj.full.plot=media.plot;

                    if(typeof media.seasons_episodes !='undefined'){
                        obj.full.seasons=media.seasons_episodes;
                    }
                }

                callback(obj[type]);
                obj=JSON.stringify(obj);
                localStorage[key]=obj;
            });
        }else{
            data=jQuery.parseJSON(data);
            
            if (type=='full') {
                data[type] = Site.parseMedia(data[type]);
            }
            
            return callback(data[type]);
        }
    },
    delCache : function(id,mediaType) {
        delete(localStorage['mediaCache'+id+'_'+mediaType]);
    },
    buildEmbed : function(link, width, height) {
         if(width === undefined){
             width = 1280;
         }
         if(height === undefined){
             height = 720;
         }
        var hostList = {
            1:{
                'id':1,
                'name':'streamCloud',
                'domain':'streamcloud.eu',
                'embed':'<iframe width="{{width}}" height="{{height}}" src="http://www.cinezer.com/streamcloud/{{code}}" frameborder="0" ></iframe>',
                'regex':[
                    /streamcloud\.eu\/(.*)/
                ]
            },
            2:{
                'id':2,
                'name':'VK',
                'domain':'vk.com',
                'embed':'<iframe src="{{url}}" width="{{width}}" height="{{height}}" frameborder="0"></iframe>',
                'regex':[
                    /vk\.com\/video_ext.php?(.*)/,
                    /vk\.com\/video(.*)/
                ]
            },
            3:{
                'id':3,
                'name':'Youtube',
                'domain':'youtube.com',
                'embed':'<iframe width="{{width}}" height="{{height}}" src="//www.youtube.com/embed/{{code}}" frameborder="0" allowfullscreen></iframe>',
                'regex':[
                    /youtube\.com\/watch\?v=(.*)/,
                    /youtube\.com\/v\/(.*)/
                ]
            },
            4:{
                'id':4,
                'name':'NowVideo',
                'domain':'nowvideo.sx',
                'embed':'<iframe width="{{width}}" height="{{height}}" frameborder="0" src="http://embed.nowvideo.sx/embed.php?v={{code}}" scrolling="no"></iframe>',
                'regex':[
                    /nowvideo\.sx\/video\/(.*)/,
                    /nowvideo\.eu\/video\/(.*)/
                ]
            },
            5:{
                'id':5,
                'name':'Allmyvideos',
                'domain':'allmyvideos.net',
                'embed':'<iframe src="http://allmyvideos.net/embed-{{code}}.html" frameborder=0 marginwidth=0 marginheight=0 scrolling=NO width="{{width}}" height="{{height}}"></iframe>',
                'regex':[
                    /allmyvideos.net\/(.*)/
                ]
            },
            6:{
                'id':6,
                'name':'Vimeo',
                'domain':'vimeo.com',
                'embed':'<iframe src="//player.vimeo.com/video/{{code}}" width="{{width}}" height="{{height}}" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>',
                'regex':[
                    /vimeo.com\/(.*)/
                ]
            },
            7:{
                'id':7,
                'name':'Magnovideo',
                'domain':'magnovideo.com',
                'embed':"Magno requires more work to be embed..",
                'regex':[
                    /magnovideo.com\/\?v=(.*)/
                ]
            },
            8:{
                'id':8,
                'name':'Played.to',
                'domain':'played.to',
                'embed':'<iframe src="http://played.to/embed-{{code}}-{{width}}x{{height}}.html" width="{{width}}" height="{{height}}" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>',
                'regex':[
                    /played.to\/(.*)/
                ]
            },
            9:{
                'id':9,
                'name':'Upafile',
                'domain':'upafile.com',
                'embed':'<iframe id="videoPlayerTest" src="gkplugins/runVideo.php?link={{url}}" style="width: {{width}}; height: {{height}}"></iframe>',
                'regex':[
                    /upafile.com\/(.*)/
                ]
            }
        },
        host={},
        regex='',
        matches=[],
        embed='';

            for(hostId in hostList)
            {
                host=hostList[hostId];

                for(k in host.regex)
                {
                    regex=host.regex[k];

                    matches=link.match(regex);

                    if(matches!=null){

                        embed=host.embed.replace(/\{\{code\}\}/g,matches[1])
                                        .replace(/\{\{url\}\}/g,link)
                                        .replace(/\{\{height\}\}/g,height)
                                        .replace(/\{\{width\}\}/g,width);
                        return embed;
                    }
                }
            }
            return false;

    },
    loading: function(status) { 
        if (typeof status == 'undefined') {
            status = false;
        }
        if (status) {
            $('#loadingDiv').show();
            $('#loadingBar').show().animate({width: "80%"}, 500);
        } else {
            $('#loadingDiv').hide();
            $('#loadingBar').animate({width: "100%"}, 100, function(){
                $(this).hide().animate({width: "10%"}, 0);
            });
        }
    },

    checkImages: function() {
        $('.gameImage').each(function()
        {
            if($(this).attr('onerror')==null){
                $(this).attr('onerror',"$(this).attr('src','images/noImage.jpg');");
            }
        });
    },

    parseTemplate: function(f,data,callback) {
        var html='',
            result;
        
        if(typeof f =='string')
        {
            var templateName=f.replace(/\//,'-').replace('.html','')+'-template';
            
            if(callback===undefined){
                throw "parseTemplate error: No callback set";
                return false;
            }
            
            if($('#'+templateName).length==0)
            {
                $.ajax({
                  url: 'templates/'+f,
                  dataType: "script",
                  error: function(a)
                  {
                    if(a.status!=200){
                        throw 'Template '+f+' not found';
                        return false;
                    }
                
                    $('body').append('<script type="text/system-template" id="'+templateName+'">'+a.responseText+'</script>');
                    Site.parseTemplate(f,data,callback);
                    return true;
                }});
                return false;
            }else{
                html=$('#'+templateName).html().replace(/^[^\/]+\/\*!?/, '').replace(/\*\/[^\/]+$/, '');
            }
            
        }else{
            html=f.toString().replace(/^[^\/]+\/\*!?/, '').replace(/\*\/[^\/]+$/, '');
        }
        
        if(typeof data !='undefined')
        {   
            result=_tmpl(html,data);
            
            if(callback===undefined){
                return result;
            }else{
                callback(result);
            }
        }else{
            if(callback===undefined){
                return html;
            }else{
                callback(html);
            }
        }
    },

    html: function(obj)
    {
        if(typeof obj.title !='undefined'){
            $('title').html(App.title+' - '+obj.title);
        }
        
        if ( obj.fullscreen === undefined) {
            $('#content').html(obj.html);
        }else{
            $('body').html(obj.html);
        }
        
        Site.loading();
        
        if (typeof obj.callback != 'undefined') {
			obj.callback();
		}
    },

    statusMedia:function(mediaType, status){

        switch(status){
            case 1:
                if (mediaType == 1 || mediaType == 4){
                    statusMedia = "Siguiendo";
                } else {
                    statusMedia = "Visto";
                }
            break;

            case 2:
                if (mediaType == 1 || mediaType == 4){
                    statusMedia = "Pendiente";
                } else {
                    statusMedia = "Favorito";
                }
            break;

            case 3:
                if (mediaType == 1 || mediaType == 4){
                    statusMedia = "Visto";
                } else {
                    statusMedia = "Pendiente";
                }
            break;
        }

        return statusMedia;
    },

    mediaType: function(mediaType) {
        switch(mediaType){
            case 1: type = "Serie"; break;
            case 2: type = "Película"; break;
            case 3: type = "Documental"; break;
            case 4: type = "Programa"; break;
        }

        return type;
    },
    parseMedia : function(media) {

        var path,
            mediaType;

        if (media === undefined) {
            return {};
        }

        if (media.img === undefined) {
            if (media.mediaType == Site.TYPE_SERIE || media.mediaType == Site.TYPE_TVSHOW) {
                mediaType = 'series';
            }else{
                mediaType = 'pelis';
            }
            path = 'http://cdn.opensly.com/'+mediaType+'/'+media.id_media+'.jpg';
        }else{
            path = media.img;
        }
        
        path = App.downloadPoster(path);
        media.img = path;

        if (media.poster === undefined) {
            media.poster = {};
        }
        media.poster.large = path;

        return media;
    }
};