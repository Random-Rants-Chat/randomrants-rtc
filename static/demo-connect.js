var video = document.getElementById("video");
var spinner = document.getElementById("spinner");
var clicktostart = document.getElementById("clicktostart");
var urlParams = new URLSearchParams(window.location.search);
var hostid = urlParams.get('id');
var ssc = window.screenShareClient;

if (hostid) {
  (async function () {
    try{
      clicktostart.hidden = false;
      clicktostart.onclick = function () {
        clicktostart.hidden = true;
        spinner.hidden = false;
        var ss = ssc.connectTo(hostid,true,function (stream) {
          if ('srcObject' in video) {
              video.srcObject = stream;
          } else {
              video.src = window.URL.createObjectURL(stream);
          }
          spinner.hidden = true;
          setInterval(() => {
            video.play();
          },1000/60);
        }, () => {
          window.location.reload();
        });
      };
    }catch(e){
      window.alert(e);
    }
  })();
} else {
  window.alert("In order to view screen share, id must be present in the search query.");
}