/**
 * Useful functions to use with Twitter
 */

/**
 * Decrements a number as a string
 */

var decStrNum = function(n) {
    n = n.toString();
    var result=n;
    var i = n.length - 1;
    while (i>-1) {
      if (n[i]==="0") {
        result=result.substring(0,i)+"9"+result.substring(i+1);
        i--;
      }
      else {
        result=result.substring(0,i)+(parseInt(n[i],10)-1).toString()+result.substring(i+1);
        return result;
      }
    }
    return result;
}

exports.decStrNum = decStrNum;