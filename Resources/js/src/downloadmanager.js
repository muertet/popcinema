var DManager = 
{
	MANAGER_JDOWNLOADER : 1,
	startDownloads : function()
	{
		if (!jDownloader.online) {
			return false;
		}

		//check if is his first time
		if (localStorage.maxMediaDownloads === undefined) {
			crossroads.parse('/wellcome');
			return false;
		}else if(localStorage.mediasToDownload === undefined) {
			return false;
		}

		var medias = JSON.parse(sessionStorage.pendingMedias),
			mediasToDownload = PendingMedias.getList();

		if (mediasToDownload.length == 0) {
			return false;
		}

		DManager.getList(function(dList)
		{
			var pList = {},
				link;
			
			//check pending downloads amount of each media
			for (idm in dList)
			{
				for (k in dList[idm])
				{
					link = dList[idm][k];
					
					if (link.file_percent != '100.00')
					{
						if(pList[idm] === undefined){
							pList[idm] = [];
						}

						pList[idm].push(link);
					}
				}
			}
			// start downloads for valid medias
			for (mType in mediasToDownload) 
			{
				for (idm in mediasToDownload[mType]) 
				{
					if (pList[idm+'-'+mType] === undefined || pList[idm+'-'+mType].length < localStorage.maxMediaDownloads) {

						var pMedia;

						switch (parseInt(mType)) {
							case Site.TYPE_SERIE:
								pMedia = medias.series;
							break;
							case Site.TYPE_MOVIE:
								pMedia = medias.movies;
							break;
							case Site.TYPE_TVSHOW:
								pMedia = medias.tvshows;
							break;
							case Site.TYPE_DOCU:
								pMedia = medias.documentaries;
							break;
						}

						for (k in pMedia) {
							if (pMedia[k].idm == idm) {
								pMedia = pMedia[k].pending;
								pMedia.episode = parseInt(pMedia.episode);
								break;
							}
						}

						if (pMedia === undefined || pMedia.episode === undefined) {
							throw "Something went extremly bad";
						}

						Site.cache(idm,mType,'full',function(data)
						{
							var season,
								episode,
								tmp,
								mediaInfo = {},
								recommendedHostList = ["mega","streamcloud","firedrive"],
								secondaryHostList = ["allmyvideos","vidspot","magnovideo"],
								i = 0;

							if (mType == Site.TYPE_SERIE || mType == Site.TYPE_DOCU)
							{
								for (sName in data.seasons_episodes)
								{
									season = parseInt(sName.replace('season_',''));

									if (season >= pMedia.season)
									{
										for (k in data.seasons_episodes[sName])
										{
											episode = data.seasons_episodes[sName][k];

											// get next episodes from same season or bigger one
											if ( (season == pMedia.season && episode.episode >= pMedia.episode || season > pMedia.season) && i < localStorage.maxMediaDownloads)
											{
												// creating a function was the only way i found to maintain the real episode info
												tmp = function(episode) {
													SL.api('/media/episode/links',{idm:episode.idm,mediaType:episode.mediaType},function(links)
	        										{
	        											var link;
	        											$.extend(links.streaming, links.direct_download);
	        											

	        											// filter links by user preferences
	        											for (k in links.streaming) 
	        											{
	        												var link = links.streaming[k];

	        												//if (link.lang.toLowerCase() == localStorage.language.toLowerCase() && link.host == localStorage.host.toLowerCase()) {
	        												if (link.lang.toLowerCase() == localStorage.language.toLowerCase() && (jQuery.inArray(link.host.toLowerCase(), recommendedHostList) != -1 || jQuery.inArray(link.host.toLowerCase(), secondaryHostList) != -1) ) {
	        													
	        													// get direct link and send it to downloader
	        													App.getLink(episode.idm, episode.mediaType, link.idv, function(vlink){

	        														DManager.add({
	        															idm : idm,
														                idmEpisode : episode.idm,
														                mediaType : mType,
														                idv : link.idv,
														                vlink : vlink,
														                manager : DManager.MANAGER_JDOWNLOADER,
	        														});
	        													});
	        													break;
	        												}
	        											}
	        										});
												}
												tmp(episode);
												
        										i++; // count new added links
											}
											if (i == localStorage.maxMediaDownloads) {
												return true;
											}
										}
									}
								}
							}
						});
					}
				}
			}
		});
	},
	del: function (media, video){
		
		var list = JSON.parse(localStorage.downloadedMedias)
		
		for (k in list[media]) {
			if (list[media][k].file_name == video.file_name) {
				list[media].splice(k,1);
				
				if (list[media].length < 1) {
					delete(list[media]);
				}
				
				localStorage.downloadedMedias = JSON.stringify(list);
				break;
			}
		}
	},
	add : function(linkInfo, callback)
	{
		if (!jDownloader.online) {
			return false;
		}

		// fix mega url encoding problems
		if (linkInfo.vlink.indexOf('mega.co') != -1) {
			linkInfo.vlink = linkInfo.vlink.replace('#','%23');
		}

		jDownloader.send(linkInfo.vlink,function(data)
		{
			if (!data) {
				alert('jDownloader no reconoce el enlace :(');
			}else{

				jQuery.extend(linkInfo, data);
				
				// notify about the started download
				Site.getMediaName(linkInfo.idm, linkInfo.mediaType, linkInfo.idmEpisode, function (name) {
					var notification = Ti.Notification.createNotification({
					    'title' : 'PopCinema',
					    'message' : 'Descargando '+name,
					    'timeout' : 10,
					    'icon' : 'app://images/download.png'
					});
					notification.show();
				});
				
				// save download and callback
				DManager.getList(function(list)
				{
					if(list[linkInfo.idm+'-'+linkInfo.mediaType] === undefined){
						list[linkInfo.idm+'-'+linkInfo.mediaType] = [];	
					}
					
					list[linkInfo.idm+'-'+linkInfo.mediaType].push(linkInfo);
					
					localStorage.downloadedMedias = JSON.stringify(list);
					callback(linkInfo);
				});
			}
		},function(data){
			alert('No tienes instalado/encendido jDownloader o activada la función de control remoto dentro de este');
		});
	},
	getList : function(callback) {
		if (localStorage.downloadedMedias === undefined || localStorage.downloadedMedias == '') {
			callback({});
		}

		// update download status
		jDownloader.getList(function(jDList) {
			var list = JSON.parse(localStorage.downloadedMedias),
				video;
				jDFiles = {};
			
			for (k in jDList) {
				file = jDList[k].file['@attributes'];
				jDFiles[file.file_name] = file;
			}
			// media name var is reserved by tidesdk..
			for (media2 in list) {
				for (k in list[media2]) {
					video = list[media2][k];
					
					// check if file was externally deleted by user
					if (!Ti.Filesystem.getFile(jDownloader.getDownloadDirectory()+'/'+video.file_name).exists() && (jDFiles[video.file_name] === undefined || jDFiles[video.file_name].file_percent == '100.00' )) {
						DManager.del(media2,video);
					}
					
					if (video.manager == DManager.MANAGER_JDOWNLOADER && typeof jDFiles[video.file_name] != 'undefined') {	
						list[media2][k].file_percent = jDFiles[video.file_name].file_percent;
					}
				}
			}
			callback(list);
		},
		// when jDownloader is off, just return the locally saved list
		function(){
			callback(JSON.parse(localStorage.downloadedMedias));
		});
	},
	hasLinks: function(mediaList, idmEpisode) {
		for (k in mediaList) {
			if (mediaList[k].idmEpisode == idmEpisode) {
				return true;
			}
		}
		return false;
	}
}