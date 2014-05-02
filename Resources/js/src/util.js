var Util = {

	  friendly_url : function (str, max) {
        if (max === undefined) max = 32;
        var a_chars = [
                ["a", /[áàâãªÁÀÂÃ]/g ],
                ["e", /[éèêÉÈÊ]/g ],
                ["i", /[íìîïÍÌÎÏ]/g ],
                ["o", /[òóôõºÓÒÔÕ]/g ],
                ["u", /[úùûüÚÙÛÜ]/g ],
                ["c", /[çÇ]/g ],
                ["n", /[Ññ]/g ]
            ];

        // Replace vowel with accent without them
        for(var i=0;i<a_chars.length;i++)
            str = str.replace(a_chars[i][1],a_chars[i][0]);
        // first replace whitespace by -, second remove repeated - by just one, third turn in low case the chars,
        // fourth delete all chars which are not between a-z or 0-9, fifth trim the string and
        // the last step truncate the string to 32 chars
        return str.replace(/\s+/g,'-').toLowerCase().replace(/[^a-z0-9\-]/g, '').replace(/\-{2,}/g,'-').replace(/(^\s*)|(\s*$)/g, '').substr(0,max);
    }
};