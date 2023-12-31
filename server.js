import express from "express";
import fetch from "node-fetch";

const app = express();

app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.static("public"));

const redirect_uri = "http://localhost:3000/callback"
const client_id = "bcbd4575e7574f90a0681f1748aa5ed4"
const client_secret = "c0832496b07a4b4fb3adfbe2bd52a23d"

global.access_token;

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/authorize", (req, res) => {
  var auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: client_id,
    scope: "user-library-read",
    redirect_uri: redirect_uri
  })

  res.redirect(
    "https://accounts.spotify.com/authorize?" + auth_query_parameters.toString()
  );
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  var body = new URLSearchParams({
    code: code,
    redirect_uri: redirect_uri,
    grant_type: "authorization_code"
  })

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "post",
    body: body,
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
      'Authorization':
        'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
    }
  })
  const data = await response.json();
  global.access_token = data.access_token;

  res.redirect("/dashboard")
});

async function getData(endpoint) {
  const response = await fetch("https://api.spotify.com/v1" + endpoint, {
    method: "get",
    headers: {
      'Authorization': "Bearer " + global.access_token
    }
  });

  const data = await response.json();
  return data;
}

app.get("/dashboard", async (req, res) => {

  const userInfo = await getData("/me");
  const savedTracks = await getData("/me/tracks?limit=10");

  res.render("dashboard", { user: userInfo, userTracks: savedTracks.items })
});

app.get("/recommendations", async (req, res) => {
  const artist_id = req.query.artists;
  const track_id = req.query.track;
  const params = new URLSearchParams({
    seed_artist: artist_id,
    seed_tracks: track_id,
  })
  const data = await getData('/recommendations?' + params);
  res.render("recommendation", { tracks: data.tracks, seed_artist: artist_id, seed_tracks: track_id })
});

let listener = app.listen(3000, function () {
  console.log(
    "Your app is listening on http://localhost:" + listener.address().port
  );
});
