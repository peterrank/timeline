/* Copyright (C) Peter Rank Software - All Rights Reserved
 * Written by Peter Rank <peter@softmanufaktur.de>, 2016
 *
 * Hilfsfunktionen
 */
let contextID2Text2Array = [];
let text2Width = [];
let text2Height = [];
let jsonString2Object = [];

class Helper {
    /*constructor() {
      this.
    }*/

    static getCursorPosition(canvas, evt) {
        if(canvas) {
            let rect = canvas.getBoundingClientRect();
            if (evt.center) {
                return [evt.center.x - rect.left, evt.center.y - rect.top];
            } else {
                return [evt.clientX - rect.left, evt.clientY - rect.top];
            }
        } else {
            return [0, 0];
        }
    }

    //Zeilenumbrüche
    static textToArrayByMaxWidth(text, maxWidth, fontSize, context) {
        let textArr = [];
        let fragment = "";
        let lastCutPosition = 0;
        let lastPossibleCutPosition = 0;

        let isLastFragmentPushed = false;

        for (var position = 1; position <= text.length; position++) {
            var c = text.charAt(position);

            isLastFragmentPushed = false;
            fragment = text.substring(lastCutPosition, position);

            let textWidth = Helper.textWidthFromCache(fragment, context);//context.measureText(fragment).width;

            //Wenn die Breite des Fragments größer ist als die Maximalbreite
            if (textWidth > maxWidth) {
                if (lastPossibleCutPosition > 0) {
                    //Das letzte Fragment, das nur komplette Wörter enthält
                    fragment = text.substring(lastCutPosition, lastPossibleCutPosition);
                    lastCutPosition = lastPossibleCutPosition + 1;
                    position = lastCutPosition;
                    lastPossibleCutPosition = 0;
                } else {
                    var endPos = position - 1 > lastCutPosition ? position - 1 : position;
                    fragment = text.substring(lastCutPosition, endPos);
                    lastCutPosition = endPos;
                    position = lastCutPosition;
                }
                textArr.push(fragment);
                isLastFragmentPushed = true;
            }

            if (c === " ") {
                lastPossibleCutPosition = position;
            }
        }

        if (!isLastFragmentPushed) {
            textArr.push(fragment);
        }
        return textArr;
    }

    //Zeilenumbrüche
    static textToArray(text) {
        if(!text) {
            return [];
        }
        //Text mit Zeilenumbrüchen in ein Array umwandeln
        return text.split("\n");
    }

    static textToArrayFromCache(text) {
        if(!text) {
            return [];
        }
        let arr = contextID2Text2Array[text];
        if (!arr) {
            arr = this.textToArray(text);
            contextID2Text2Array[text] = arr;
        }
        return arr;
    }

    static textToArrayByMaxWidthFromCache(text, maxWidth, fontSize, context) {
        let arrKey = context.font + "-" + maxWidth + "-" + fontSize +" - " +text;
        let arr = contextID2Text2Array[arrKey];
        if (!arr) {
            arr = this.textToArrayByMaxWidth(text, maxWidth, fontSize, context);
            contextID2Text2Array[arrKey] = arr;
        }
        return arr;
    }

    static textWidthFromCache(text, context) {
        let key = context.font + "-"+text;
        let width = text2Width[key];
        if (!width) {
            width = context.measureText(text).width;
            text2Width[key] = width;
        }
        return width;
    }

    static textHeightFromCache(context) {
        let key = context.font;
        let height = text2Height[key];
        if (!height) {
            height = context.measureText('M').width;
            text2Height[key] = height;
        }
        return height;
    }

    static getObjectFromCache(jsonString) {
        let obj = jsonString2Object[jsonString];
        if (!obj) {
            try {
                obj = JSON.parse(jsonString);
                jsonString2Object[jsonString] = obj;
            } catch(e) {
                
            }
        }
        return obj;

    }

    /**
     * UTF-8 Encode wie in PHP
     */
    static utf8_encode(argString) {
        //  discuss at: http://phpjs.org/functions/utf8_encode/
        // original by: Webtoolkit.info (http://www.webtoolkit.info/)
        // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // improved by: sowberry
        // improved by: Jack
        // improved by: Yves Sucaet
        // improved by: kirilloid
        // bugfixed by: Onno Marsman
        // bugfixed by: Onno Marsman
        // bugfixed by: Ulrich
        // bugfixed by: Rafal Kukawski
        // bugfixed by: kirilloid
        //   example 1: utf8_encode('Kevin van Zonneveld');
        //   returns 1: 'Kevin van Zonneveld'

        if (argString === null || typeof argString === 'undefined') {
            return '';
        }

        var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        var utftext = '',
            start, end, stringl = 0;

        start = end = 0;
        stringl = string.length;
        for (var n = 0; n < stringl; n++) {
            var c1 = string.charCodeAt(n);
            var enc = null;

            if (c1 < 128) {
                end++;
            } else if (c1 > 127 && c1 < 2048) {
                enc = String.fromCharCode(
                    (c1 >> 6) | 192, (c1 & 63) | 128
                );
            } else if ((c1 & 0xF800) !== 0xD800) {
                enc = String.fromCharCode(
                    (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
                );
            } else { // surrogate pairs
                if ((c1 & 0xFC00) !== 0xD800) {
                    throw new RangeError('Unmatched trail surrogate at ' + n);
                }
                var c2 = string.charCodeAt(++n);
                if ((c2 & 0xFC00) !== 0xDC00) {
                    throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
                }
                c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
                enc = String.fromCharCode(
                    (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
                );
            }
            if (enc !== null) {
                if (end > start) {
                    utftext += string.slice(start, end);
                }
                utftext += enc;
                start = end = n + 1;
            }
        }

        if (end > start) {
            utftext += string.slice(start, stringl);
        }

        return utftext;
    }

    /**
     * SHA1 wie in PHP
     */
    static sha1(str) {
        //  discuss at: http://phpjs.org/functions/sha1/
        // original by: Webtoolkit.info (http://www.webtoolkit.info/)
        // improved by: Michael White (http://getsprink.com)
        // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        //    input by: Brett Zamir (http://brett-zamir.me)
        //  depends on: utf8_encode
        //   example 1: sha1('Kevin van Zonneveld');
        //   returns 1: '54916d2e62f65b3afa6e192e6a601cdbe5cb5897'

        var rotate_left = function (n, s) {
            var t4 = (n << s) | (n >>> (32 - s));
            return t4;
        };

        /*var lsb_hex = function (val) { // Not in use; needed?
          var str="";
          var i;
          var vh;
          var vl;

          for ( i=0; i<=6; i+=2 ) {
            vh = (val>>>(i*4+4))&0x0f;
            vl = (val>>>(i*4))&0x0f;
            str += vh.toString(16) + vl.toString(16);
          }
          return str;
        };*/

        var cvt_hex = function (val) {
            var str = '';
            var i;
            var v;

            for (i = 7; i >= 0; i--) {
                v = (val >>> (i * 4)) & 0x0f;
                str += v.toString(16);
            }
            return str;
        };

        var blockstart;
        var i, j;
        var W = new Array(80);
        var H0 = 0x67452301;
        var H1 = 0xEFCDAB89;
        var H2 = 0x98BADCFE;
        var H3 = 0x10325476;
        var H4 = 0xC3D2E1F0;
        var A, B, C, D, E;
        var temp;

        str = Helper.utf8_encode(str);
        var str_len = str.length;

        var word_array = [];
        for (i = 0; i < str_len - 3; i += 4) {
            j = (str.charCodeAt(i) << 24) | (str.charCodeAt(i + 1) << 16) | (str.charCodeAt(i + 2) << 8) | str.charCodeAt(i + 3);
            word_array.push(j);
        }

        switch (str_len % 4) {
            case 0:
                i = 0x080000000;
                break;
            case 1:
                i = (str.charCodeAt(str_len - 1) << 24) | 0x0800000;
                break;
            case 2:
                i = (str.charCodeAt(str_len - 2) << 24) | (str.charCodeAt(str_len - 1) << 16) | 0x08000;
                break;
            case 3:
                i = (str.charCodeAt(str_len - 3) << 24) | (str.charCodeAt(str_len - 2) << 16) | (str.charCodeAt(str_len - 1) << 8) | 0x80;
                break;
            default:
        }

        word_array.push(i);

        while ((word_array.length % 16) !== 14) {
            word_array.push(0);
        }

        word_array.push(str_len >>> 29);
        word_array.push((str_len << 3) & 0x0ffffffff);

        for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
            for (i = 0; i < 16; i++) {
                W[i] = word_array[blockstart + i];
            }
            for (i = 16; i <= 79; i++) {
                W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
            }

            A = H0;
            B = H1;
            C = H2;
            D = H3;
            E = H4;

            for (i = 0; i <= 19; i++) {
                temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
                E = D;
                D = C;
                C = rotate_left(B, 30);
                B = A;
                A = temp;
            }

            for (i = 20; i <= 39; i++) {
                temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
                E = D;
                D = C;
                C = rotate_left(B, 30);
                B = A;
                A = temp;
            }

            for (i = 40; i <= 59; i++) {
                temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
                E = D;
                D = C;
                C = rotate_left(B, 30);
                B = A;
                A = temp;
            }

            for (i = 60; i <= 79; i++) {
                temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
                E = D;
                D = C;
                C = rotate_left(B, 30);
                B = A;
                A = temp;
            }

            H0 = (H0 + A) & 0x0ffffffff;
            H1 = (H1 + B) & 0x0ffffffff;
            H2 = (H2 + C) & 0x0ffffffff;
            H3 = (H3 + D) & 0x0ffffffff;
            H4 = (H4 + E) & 0x0ffffffff;
        }

        temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
        return temp.toLowerCase();
    }


    static intColorToHexString(i) {
        let r = (i & 0xFF).toString(16);
        let g = ((i >> 8) & 0xFF).toString(16);
        let b = ((i >> 16) & 0xFF).toString(16);

        r = ('0' + r).slice(-2);
        g = ('0' + g).slice(-2);
        b = ('0' + b).slice(-2);

        return "#" + r + g + b;
    }

    static toTransparent(rrggbb, transparency) {
        if(rrggbb.startsWith("#")) {
            let red = parseInt(rrggbb.substr(1, 2), 16);
            let green = parseInt(rrggbb.substr(3, 2), 16);
            let blue = parseInt(rrggbb.substr(5, 2), 16);
            let col = "rgba(" + red + "," + green + "," + blue + "," + transparency + ")";
            return col;
        } else if(rrggbb.startsWith("rgba(")) {
            //die Zahl zwischen dem letzen Komma und der schließenden Klammer tauschen
            let commaIndex = rrggbb.lastIndexOf(",");
            rrggbb = rrggbb.substr(0, commaIndex)+","+transparency+")";

        }
        return rrggbb;
    }

    /**
     * Zum Bestimmen, ob eine helle Vordergrundfarbe verwendet werden muss
     */
    static isDarkBackground(rrggbb) {
        //Übersetzt von https://webdesign.weisshart.de/blog.php?p=171
        const sum = Helper.getGrayValue(rrggbb);
        return sum < 127000;
    }

    static getGrayValue(rrggbb) {
        //Übersetzt von https://webdesign.weisshart.de/blog.php?p=171
        let red = parseInt(rrggbb.substr(1, 2), 16);
        let green = parseInt(rrggbb.substr(3, 2), 16);
        let blue = parseInt(rrggbb.substr(5, 2), 16);
        let sum = red * 299 + green * 587 + blue * 114;
        return sum;
    }

    static hexColorStringToInt(rrggbb) {
        var bbggrr = rrggbb.substr(5, 2) + rrggbb.substr(3, 2) + rrggbb.substr(1, 2);
        return parseInt(bbggrr, 16);
    }

    static isEquivalent (a, b) {
        if((a && !b) || (b&& !a)) {
            return false;
        }
        if(!a && !b) {
            return true;
        }
        // Create arrays of property names
        var aProps = Object.getOwnPropertyNames(a);
        var bProps = Object.getOwnPropertyNames(b);

        // If number of properties is different,
        // objects are not equivalent
        if (aProps.length !== bProps.length) {
            return false;
        }

        for (var i = 0; i < aProps.length; i++) {
            var propName = aProps[i];

            // If values of same property are not equal,
            // objects are not equivalent
            if (JSON.stringify(a[propName]) !== JSON.stringify(b[propName])) {
                return false;
            }
        }

        // If we made it this far, objects
        // are considered equivalent
        return true;
    }


    static arraysEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;

        for (let i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}


export default Helper;
