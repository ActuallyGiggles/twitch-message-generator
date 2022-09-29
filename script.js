let DEBUG = false;

let channelName = "";
let message = "";
let channels = {};
let channelsJson = {}

const homeUrl = "https://actuallygiggles.localtonet.com"
const markovUrl = "https://actuallygiggles.localtonet.com/get-sentence?channel="
const channelsUrl = "https://actuallygiggles.localtonet.com/tracked-channels"
const emotesUrl = "https://actuallygiggles.localtonet.com/tracked-emotes"

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
  }

const onReady = (callback) => {
	if (document.readyState != "loading") {
		callback();
	}
	else if (document.addEventListener) {
		document.addEventListener("DOMContentLoaded", callback);
	}
	else {
		document.attachEvent("onreadystatechange", function() {
			if (document.readyState == "complete") {
				callback();
			}
		});
	}
};

// https://stackoverflow.com/questions/111529/how-to-create-query-parameters-in-javascript
function encodeQueryData(data) { 
    const ret = [];
    for (let d in data) {
        if (data[d]) {
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
		}
    }
    return ret.join('&');
}

const getJson = (markovUrl) => fetch(markovUrl, { method: "GET" }).then(async (response) => {
	const contentType = response.headers.get("Content-Type");
	if (contentType.includes("text/plain")) {
		const text = await response.text();
		return text;
	} else if (contentType.includes("application/json")) {
		return await response.json();
	}
}).catch((error) => console.error(error));

async function generateInitialHtml() {
	channels = await getJson(`${channelsUrl}`)

	if (channels == null || channels == "") {
		loading.classList.add("hidden")
		result.classList.add("hidden")
		channelsTracked.classList.add("hidden")
		using.classList.add("hidden")
		description.classList.add("hidden")
		donation.classList.add("hidden")

		error.classList.remove("hidden")
	}

	for (const channel of channels) {
		const name = channel.login
		const displayName = channel.display_name
		const profileImage = channel.profile_image_url
		
		channelsJson[displayName] = name

		// Create channel card
		const channelCard = document.createElement("div")
		channelCard.classList.add("channel-card")

		// Create channel info
		const channelInfo = document.createElement("div")
		channelInfo.classList.add("channel-info")

		// Create pfp image
		const pfp = new Image()
		pfp.src = profileImage
		pfp.id = "broadcaster-pfp"
		pfp.target= '_blank';

		// Create channel label
		const channelNameLabel = document.createElement("div")
		channelNameLabel.id = "channel-name-label"
		const channelNameText = document.createTextNode(`${displayName}`)
		channelNameLabel.appendChild(channelNameText)

		// Append pfp and label to channel info
		channelInfo.appendChild(pfp)
		channelInfo.appendChild(channelNameLabel)

		// Create twitch popout
		const twitchPopout = document.createElement("div")
		twitchPopout.id = "twitch-popout"

		// Create twitch logo image
		const twitchLogo = new Image()
		twitchLogo.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Twitch_Glitch_Logo_Purple.svg/878px-Twitch_Glitch_Logo_Purple.svg.png"
		twitchLogo.id = "twitch-logo"
		twitchLogo.target = "_blank"
		twitchLogo.onclick = function() {
			window.location.href = 'https://www.twitch.tv/' + name
		}

		// Append twitch logo image to twitch popout
		twitchPopout.appendChild(twitchLogo)

		// Append channel info and twitch popout to channel card
		channelCard.appendChild(channelInfo)
		channelCard.appendChild(twitchPopout)

		channelsTracked.appendChild(channelCard)
		channelsTracked.classList.remove("hidden");
	}
}

async function fetchMarkovMessage(event, cName) {
	if (event != null) {
		event.preventDefault();
	}

	document.title = "Twitch Msg Gen • " + channelName;

	result.textContent = "";
	result.classList.add("hidden")
	loading.classList.remove("hidden");

	let urlParameters = {};
	if (cName == "") {
		urlParameters["channel"] = channelsJson[channelName];
	} else {
		urlParameters["channel"] = cName
	}

	if (DEBUG) {
		urlParameters["debug"] = true;
	}

	let urlParameterString = `${window.location.pathname}?${encodeQueryData(urlParameters)}`;
	window.history.pushState(null, "", urlParameterString);

	const json = await getJson(`${markovUrl}${urlParameters["channel"]}`);

	var isError

	if(json == undefined) {
		message = "Something went wrong!"
	}
	else if (json.error != "") {
		message = "Error! " + json["error"];
		isError = true
	}
	else {
		message = json["markov_sentence"];
		isError = false
	}

	generateHtml(isError);
}

function generateHtml(isError) {
	const messageNode = document.createTextNode(message);
	result.appendChild(messageNode);

	if(isError) {
		result.style.backgroundColor = "IndianRed";
	} else {
		result.style.backgroundColor = "";
	}

	using.textContent = ""
	usingMessage = document.createTextNode("Currently using channel: " + capitalizeFirstLetter(channelName))
	using.appendChild(usingMessage)

	loading.classList.add("hidden");
	result.classList.remove("hidden");
	using.classList.remove("hidden")
}

const loading = document.getElementById("loading");
const channelsTracked = document.getElementById("channels");
const result = document.getElementById("result");
const using = document.getElementById("using");
const error = document.getElementById("api-error");
const description = document.getElementById("description");
const donation = document.getElementById("donation");

onReady(async () => {
	generateInitialHtml()

	document.addEventListener('click', function (event) {
		if (event.target.className == "channel-card") {
			channelName = event.target.innerText
			fetchMarkovMessage(event, "")
		}
		
		if (event.target.offsetParent.className == "channel-card") {
			channelName = event.target.offsetParent.innerText
			fetchMarkovMessage(event, "")
		}
	})

	const searchParameters = new URLSearchParams(window.location.search);
	if(searchParameters.get("debug")) {
		DEBUG = true;
	}

	if(searchParameters.has("channel")) {
		channelName = searchParameters.get("channel");
		fetchMarkovMessage(null, channelName);
	}
});
