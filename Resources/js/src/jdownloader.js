var jDownloader = 
{
	ip : 'localhost',
	port : 10025,
	directory : '',
	online: false,
	init : function(){
		jDownloader.getDownloadDirectory();
	},
	api : function (url,callback,errorCallback) {
		
		if (errorCallback === undefined) {
			errorCallback = function (){};
		}
		
		$.get(jDownloader.ip+':'+jDownloader.port+''+url,callback).fail(errorCallback);
	},
	getDownloadDirectory: function()
	{
		if (jDownloader.directory == '') {
			jDownloader.api('/get/config',function(data){
				jDownloader.online = true;
				var result = /DOWNLOAD_DIRECTORY = (.*)/g.exec(data);
				
				jDownloader.directory = result[1];
				return result[1].replace(/\\/g,"/");
			});
		}else{
			return jDownloader.directory.replace(/\\/g,"/");
		}
	},
	getList : function (callback,eCallback) {

		jDownloader.api('/get/downloads/alllist',function(data){
			var json = jDownloader.xmlToJson(jDownloader.stringToJson(data));
			callback(json.jdownloader.package);
		},eCallback);
	},
	send : function(grabber,start,linkList,callback,errorCallback)
	{
		if (typeof grabber == 'string') {
			errorCallback = linkList;
			callback = start;
			linkList = grabber;
			grabber = 0;	
			start = 1;	
		}
		
		// compare the downloadlist before and after adding the link to find the new added file, yes.. jdownloader doesnt give it..
		jDownloader.getList(function (oldList){
			
			var oldFiles = {},
				fileName,
				file = '';
			
			for (k in oldList) {
				file = oldList[k].file['@attributes'];
				oldFiles[file.file_name] = file;
			}
			
			jDownloader.api('/action/add/links/grabber0/start1/'+linkList,function(data){
				if(data == 'Link(s) added. ()'){
					return false;
				}else{
					// jDownloader is slow, so we have to wait to get the updatedlist
					setTimeout(function(){
						jDownloader.getList(function (newList){
							var newFiles = {},
								file = '';
							
							for (k in newList) {
								file = newList[k].file['@attributes'];
								newFiles[file.file_name] = file;
							}
							
							for(fileName in newFiles){
								if (oldFiles[fileName] == undefined) {
									callback(newFiles[fileName]);
								}
							}
							return false;
						});
					},4000);
					
				}
			},errorCallback);
		});
		
	},
	stringToJson: function(string){
		var parseXml;

		if (window.DOMParser) {
		    parseXml = function(xmlStr) {
		        return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
		    };
		} else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
		    parseXml = function(xmlStr) {
		        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
		        xmlDoc.async = "false";
		        xmlDoc.loadXML(xmlStr);
		        return xmlDoc;
		    };
		} else {
		    parseXml = function() { return null; }
		}

		return parseXml(string);
	},
	xmlToJson : function (xml) {
		
		// Create the return object
		var obj = {};

		if (xml.nodeType == 1) { // element
			// do attributes
			if (xml.attributes.length > 0) {
			obj["@attributes"] = {};
				for (var j = 0; j < xml.attributes.length; j++) {
					var attribute = xml.attributes.item(j);
					obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
				}
			}
		} else if (xml.nodeType == 3) { // text
			obj = xml.nodeValue;
		}

		// do children
		if (xml.hasChildNodes()) {
			for(var i = 0; i < xml.childNodes.length; i++) {
				var item = xml.childNodes.item(i);
				var nodeName = item.nodeName;
				if (typeof(obj[nodeName]) == "undefined") {
					obj[nodeName] = jDownloader.xmlToJson(item);
				} else {
					if (typeof(obj[nodeName].push) == "undefined") {
						var old = obj[nodeName];
						obj[nodeName] = [];
						obj[nodeName].push(old);
					}
					obj[nodeName].push(jDownloader.xmlToJson(item));
				}
			}
		}
		return obj;
	}
}