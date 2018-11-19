!function (e) {
    var a,
        i = navigator.userAgent.toLowerCase(),
        n = document.documentElement,
        t = parseInt(n.clientWidth);
    if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent) || i.indexOf("like mac os x") > 0) {
        var s = /os [\d._]*/gi,
            o = i.match(s);
        a = (o + "").replace(/[^0-9|_.]/gi, "").replace(/_/gi, ".")
    }
    var r = a + "";
    "undefined" != r && r.length > 0 && (a = parseInt(r), a >= 8 && (375 == t || 667 == t || 320 == t || 568 == t || 480 == t)
        ? n.className = "iosx2"
        : (a >= 8 && 414 == t || 736 == t) && (n.className = "iosx3")),
        /(Android)/i.test(navigator.userAgent) && (n.className = "android")
}(window);

