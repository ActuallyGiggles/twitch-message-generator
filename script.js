let DEBUG = false;

let channelName = "";
let message = "";

const url = "https://actuallygiggles.localtonet.com/getsentence?channel=";

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

const getJson = (url) => fetch(url, { method: "GET" }).then(async (response) => {
	const contentType = response.headers.get("Content-Type");
	if (contentType.includes("text/plain")) {
		const text = await response.text();
		return text;
	} else if (contentType.includes("application/json")) {
		return await response.json();
	}
}).catch((error) => console.error(error));

<<<<<<< Updated upstream
=======
async function generateInitialHtml() {
	channels = await getJson(`${channelsUrl}`)
	
	for (const channel of channels) {
		var name = channel.display_name
		var profileImage = channel.profile_image_url

		const channelCard = document.createElement("div")
		channelCard.classList.add("channel-card")

		const pfp = new Image()
		pfp.src = profileImage
		pfp.id = "broadcaster-pfp"
		channelCard.appendChild(pfp)

		const channelNameLabel = document.createElement("div")
		channelNameLabel.id = "channel-name-label"
		const channelNameText = document.createTextNode(`${name}`)
		channelNameLabel.appendChild(channelNameText)
		channelCard.appendChild(channelNameLabel)

		channelsTracked.appendChild(channelCard)
		channelsTracked.classList.remove("hidden");
	}
}

>>>>>>> Stashed changes
async function fetchMarkovMessage(event) {
	if (event != null) {
		event.preventDefault();
	}

	result.textContent = "";
	loading.classList.remove("hidden");

	let urlParameters = {};
	urlParameters["channel"] = channelName;

	if (DEBUG) {
		urlParameters["debug"] = true;
	}

	let urlParameterString = `${window.location.pathname}?${encodeQueryData(urlParameters)}`;
	window.history.pushState(null, "", urlParameterString);

	// const json = JSON.parse(await getJson(`${url}${channelName}`));
	const json = await getJson(`${url}${channelName}`);

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

<<<<<<< Updated upstream
	loading.classList.add("hidden");
=======
>>>>>>> Stashed changes
	if(isError) {
		result.style.backgroundColor = "IndianRed";
	} else {
		result.style.backgroundColor = "";
	}
<<<<<<< Updated upstream
	result.classList.remove("hidden");
}

const generator = document.getElementById("generator");
const channel = document.getElementById("channel");
const loading = document.getElementById("loading");
const result = document.getElementById("result");

generator.addEventListener("submit", (event) => fetchMarkovMessage(event));
=======

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

onReady(() => {
	generateInitialHtml()

	document.addEventListener('click', function (event) {
		if (event.target.className == "channel-card") {
			channelName = event.target.innerText
			channelName = channelName.toLowerCase()
			fetchMarkovMessage(event)
		}
		
		if (event.target.offsetParent.className == "channel-card") {
			channelName = event.target.offsetParent.innerText
			channelName = channelName.toLowerCase()
			fetchMarkovMessage(event)
		}
	})
>>>>>>> Stashed changes

onReady(() => { 
	const searchParameters = new URLSearchParams(window.location.search);
	if(searchParameters.get("debug")) {
		DEBUG = true;
	}

	if(searchParameters.has("channel")) {
		channelName = searchParameters.get("channel");
		fetchMarkovMessage(null);
	}
});