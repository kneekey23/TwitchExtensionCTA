let token, userId;
const hostUrl = "https://d4nq31xug0.execute-api.us-west-2.amazonaws.com/prod/";
const localUrl = "https://localhost:8081/";

const twitch = window.Twitch.ext;

twitch.onContext((context) => {
  twitch.rig.log(context);
});

twitch.onAuthorized((auth) => {
  token = auth.token;
  userId = auth.userId;
});

$(function () {

  $('#saveConfig').click(function () {
      if (!token) { return twitch.rig.log('Not authorized'); }
      twitch.rig.log('Saving Configuration');
      var classChosen = $("#configClass").val();
      console.log(classChosen);


      var url = hostUrl + 'config';
      var settings = {
          headers: {
              'Authorization': 'Bearer ' + token
          },
          type: 'POST',
          dataType: 'json',
          contentType: 'application/json',
          data: JSON.stringify({
              config: classChosen
          }),
          success: function (obj, status) {
              twitch.rig.log('Success...config saved');
              twitch.rig.log(`EBS request returned ${obj.here} - ${status}`);
              $.notify("Configuration saved", "success");
          },
          error: function (val, error, status) {
              twitch.rig.log('EBS request returned ' + status + ' (' + error + ')');
              twitch.rig.log(error);
              twitch.rig.log(val);
              $.notify("uh oh, something went wrong. try again and then contact support if no luck.", "error");
          }
      };

      $.ajax(url, settings);
  });



});