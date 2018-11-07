var token = "";
var tuid = "";
var ebs = "";
const hostUrl = "https://d4nq31xug0.execute-api.us-west-2.amazonaws.com/prod/";
const localUrl = "https://localhost:8081/";

// because who wants to type this every time?
var twitch = window.Twitch.ext;

// create the request options for our Twitch API calls
var requests = {
    set: createRequest('POST', 'cta'),
    get: createRequest('GET', 'config')
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

    setAuth(token);
    $.ajax(requests.get);
});

function updateLink(url, title) {
    twitch.rig.log('Updating link');
    $("#actionLink").show();
    $("#actionLink").attr('href', url);
    $("#actionLink").html(title);

}

function logError(val, error, status) {
    twitch.rig.log('EBS request returned ' + status + ' (' + error + ')');
    twitch.rig.log(error);
    twitch.rig.log(val);
}

function logSuccess(obj, status) {
    // we could also use the output to update the block synchronously here,
    // but we want all views to get the same broadcast response at the same time.
    twitch.rig.log('this the config' + obj.config);
    twitch.rig.log(`EBS request returned ${obj.here} - ${status}`);
    setConfig(obj.config);
}

function setConfig(configClass){
    $("#configDiv").removeClass().addClass(configClass);
}

function removeLink(){
    $("#actionLink").hide();
}

$(function () {
    $("#actionLink").hide();
    $('#displayLink').click(function () {
        if (!token) { return twitch.rig.log('Not authorized'); }
        twitch.rig.log('Requesting a link to go live');
        var linkToDisplay = $("#linkInput").val();
        var linkTitle = $("#linkTitleInput").val()
        console.log(linkToDisplay);
        console.log(linkTitle);

        var url = hostUrl + 'cta';
        var settings = {
            headers: {
                'Authorization': 'Bearer ' + token
            },
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify({
                message: {link: linkToDisplay, title: linkTitle}
            }),
            success: function (obj, status) {
                twitch.rig.log('Success...');
                twitch.rig.log(`EBS request returned ${obj.here} - ${status}`);
                $.notify("Link will be displayed Live", "success");
            },
            error: function (val, error, status) {
                twitch.rig.log('EBS request returned ' + status + ' (' + error + ')');
                twitch.rig.log(error);
                twitch.rig.log(val);
                $.notify("uh oh, something went wrong. try again and then contact support if no luck.", "error");
            }
        };

        // twitch.send('broadcast', 'text', 'hello!');
        $.ajax(url, settings);
    });

    $('#deleteLink').click(function () {
        if (!token) { return twitch.rig.log('Not authorized'); }
        twitch.rig.log('Requesting a link to be removed');

        var url = hostUrl + 'cta';
        var settings = {
            headers: {
                'Authorization': 'Bearer ' + token
            },
            type: 'DELETE',
            dataType: 'json',
            contentType: 'application/json',
            success: function (obj, status) {
                twitch.rig.log('Success... link removed');
                twitch.rig.log(`EBS request returned ${obj.here} - ${status}`);
                $.notify("Link was removed from viewer's stream", "success");
            },
            error: function (val, error, status) {
                twitch.rig.log('EBS request returned ' + status + ' (' + error + ')');
                twitch.rig.log(error);
                twitch.rig.log(val);
                $.notify("uh oh, something went wrong. try again and then contact support if no luck.", "error");
            }
        };

        // twitch.send('broadcast', 'text', 'hello!');
        $.ajax(url, settings);
    });


    twitch.listen('broadcast', function (target, contentType, obj) {
        console.log('Received link');
        console.log(obj);
        if(obj == "rm") {
            removeLink();
        }
        else{
        var parsedObj = JSON.parse(obj);
        updateLink(parsedObj.link, parsedObj.title);
        }
    });
});
