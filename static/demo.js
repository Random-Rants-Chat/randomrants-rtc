var StartHost = document.getElementById("StartHost");
var StartHostMic = document.getElementById("StartHostMic");
var StartHostCamera = document.getElementById("StartHostCamera");
var hostKeyText = document.getElementById("hostKeyText");
async function startStuff(streamMethod) {
  try {
    const displayMediaOptions = {
  video: {
    displaySurface: "browser",
  },
  audio: {
    suppressLocalAudioPlayback: false,
  },
  preferCurrentTab: false,
  selfBrowserSurface: "exclude",
  systemAudio: "include",
  surfaceSwitching: "include",
  monitorTypeSurfaces: "include",
};
    var stream = null;
    if (streamMethod == "displayMedia") {
      stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    }
    if (streamMethod == "userMediaAudioOnly") {
      stream = await navigator.mediaDevices.getUserMedia({audio: true});
    }
      if (streamMethod == "userMedia") {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
    }
    async function connect () {
      try {
        hostKeyText.innerHTML = `Connecting...`;
        var screenshare = await window.screenShareClient.newHost(stream,true,connect);
        var url = `${window.location.protocol + "//" + window.location.host}/connect.html?id=${screenshare.host.key}`;
        hostKeyText.innerHTML = `Host key is: ${screenshare.host.key}<br> Go to <a href="${url}" target="_blank">${url}</a> to see it in action!`;
        window.screenshare = screenshare;
      } catch (e) {
        window.alert(e);
      }
    }
    connect();
  }catch(e){
    console.error(e);
    window.alert("Failed to start hosting, does your browser support webrtc and stream APIs?");
  }
  
}
StartHost.onclick = async function () {
  startStuff("displayMedia");
};
StartHostMic.onclick = async function () {
  startStuff("userMediaAudioOnly");
};
StartHostCamera.onclick = async function () {
  startStuff("userMedia");
};
