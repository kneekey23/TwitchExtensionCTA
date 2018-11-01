var token = "";
var tuid = "";
var ebs = "";
var link = "";
var hostUrl = "https://d4nq31xug0.execute-api.us-west-2.amazonaws.com/prod/";

// because who wants to type this every time?
var twitch = window.Twitch.ext;

// create the request options for our Twitch API calls
var requests = {
    set: createRequest('POST', 'cta'),
    get: createRequest('GET', 'heartbeat')
};

function createRequest(type, method) {

    return {
        type: type,
        url: hostUrl + method,
        success: logSuccess,
        error: logError
    }
}

function setAuth(token) {
    Object.keys(requests).forEach((req) => {
        twitch.rig.log('Setting auth headers');
        requests[req].headers = { 'Authorization': 'Bearer ' + token }
    });
}

twitch.onContext(function (context) {
    twitch.rig.log(context);
});

twitch.onAuthorized(function (auth) {
    // save our credentials
    twitch.rig.log(auth);
    token = auth.token;
    tuid = auth.userId;

    // enable the button
    $('#cycle').removeAttr('disabled');

    setAuth(token);
    $.ajax(requests.get);
});

function updateLink(url) {
    twitch.rig.log('Updating link');
    $("#actionLink").attr('href', url);

}

function logError(val, error, status) {
    twitch.rig.log('EBS request returned ' + status + ' (' + error + ')');
    twitch.rig.log(error);
    twitch.rig.log(val);
}

function logSuccess(obj, status) {
    // we could also use the output to update the block synchronously here,
    // but we want all views to get the same broadcast response at the same time.
    twitch.rig.log('Success...');
    twitch.rig.log(`EBS request returned ${obj.here} - ${status}`);
}

$(function () {
    $.ajax(requests.get);
    // when we click the cycle button
    $('#displayLink').click(function () {
        if (!token) { return twitch.rig.log('Not authorized'); }
        twitch.rig.log('Requesting a link to go live');
        var linkToDisplay = $("#linkInput").val();
        console.log(linkToDisplay);
        var url = hostUrl + 'cta';
        var settings = {
            headers: {
                'Authorization': 'Bearer ' + token
            },
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({
                message: linkToDisplay
            }),
            success: function (obj, status) {
                twitch.rig.log('Success...');
                twitch.rig.log(`EBS request returned ${obj.here} - ${status}`);
            },
            error: function (val, error, status) {
                twitch.rig.log('EBS request returned ' + status + ' (' + error + ')');
                twitch.rig.log(error);
                twitch.rig.log(val);
            }
        };

        // twitch.send('broadcast', 'text', 'hello!');
        $.ajax(url, settings);
    });

    $("#actionLink").on('click', function(){
        window.open(link, '_blank');
    })

    // listen for incoming broadcast message from our EBS
    console.log(twitch);
    twitch.listen('broadcast', function (target, contentType, link) {
        twitch.rig.log('Received link');
        // twitch.rig.log(contentType);
        // twitch.rig.log(target);
        // twitch.rig.log(link.message);
        link = link;
        updateLink(link);
    });
});
