let DEBUG = false;

let channelName = "39daph";
let message = "";

const url = "https://actuallygiggles.localtonet.com/getsentence?channel=";

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

async function fetchMarkovMessage(event) {
	if (event != null) {
		event.preventDefault();
	}

	result.classList.add("hidden");
	result.textContent = "";
	loading.classList.remove("hidden");
	
	channelName = channel.value;

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

	loading.classList.add("hidden");
	if(isError) {
		result.style.backgroundColor = "IndianRed";
	} else {
		result.style.backgroundColor = "";
	}
	result.classList.remove("hidden");
}

const generator = document.getElementById("generator");
const channel = document.getElementById("channel");
const loading = document.getElementById("loading");
const result = document.getElementById("result");

generator.addEventListener("submit", (event) => fetchMarkovMessage(event));

onReady(() => { 
	const searchParameters = new URLSearchParams(window.location.search);
	if(searchParameters.get("debug")) {
		DEBUG = true;
	}

	if(searchParameters.has("channel")) {
		channel.value = searchParameters.get("channel");
		fetchMarkovMessage(null);
	}
});