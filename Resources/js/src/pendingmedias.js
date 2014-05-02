/**
	Simple CRUD class for medias that user wants to keep up-to-date/download
**/
var PendingMedias = 
{
	add : function(idm, mediaType) {
		var pMedias = PendingMedias.getList();

		if (pMedias[mediaType] === undefined) {
			pMedias[mediaType] = {};
		}

    	pMedias[mediaType][idm] = true;

    	localStorage.mediasToDownload = JSON.stringify(pMedias);
	},
	del : function(idm, mediaType) {
		var pMedias = PendingMedias.getList();

		try{
			delete(pMedias[mediaType][idm]);

			localStorage.mediasToDownload = JSON.stringify(pMedias);
		}catch(e){}
	},
	isPending: function(idm, mediaType) {
		var pMedias = PendingMedias.getList();

		if (pMedias[mediaType] === undefined || pMedias[mediaType][idm] === undefined) {
			return false;
		}else{
			return true;
		}
	},
	getList : function() {
		var pMedias = localStorage.mediasToDownload;

    	if (pMedias === undefined) {
    		pMedias = {};
    	}else{
    		pMedias = JSON.parse(pMedias);
    	}

    	return pMedias;
	}
}