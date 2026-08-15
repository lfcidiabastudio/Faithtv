/*
 FaithTV production configuration.

 IMPORTANT:
 Set STREAM_URL to the real audio stream URL supplied by your streaming server.
 The frontend cannot safely invent or infer a private stream URL.

 Optional backend endpoints:
 LISTENERS_URL -> JSON: {"listeners":147}
 STREAM_STATUS_URL -> JSON: {"live":true,"listeners":147,"title":"Worship Session"}
 NOW_PLAYING_URL -> JSON: {"title":"Worship Session","artist":"FaithTV Live"}

 Example:
 window.FAITH_CONFIG.STREAM_URL = "https://your-stream.example/live.mp3";
*/
window.FAITH_CONFIG = {
  STREAM_URL: "https://faithtv.tail786c83.ts.net/faithtv",
  LISTENERS_URL: "",
  STREAM_STATUS_URL: "https://faithtv.tail786c83.ts.net/status-json.xsl",
  NOW_PLAYING_URL: "",
  SPOTIFY_URL: "https://open.spotify.com/show/3rQSg1gCTou5qL3T68jc6q",
  RECONNECT_MS: 5000,
  POLL_MS: 15000
};
