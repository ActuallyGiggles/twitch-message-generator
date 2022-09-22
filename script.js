let DEBUG = false;

async function fetchSentence(event) {
	if (event != null) {
		event.preventDefault();
	}

	userNotFound.classList.add("hidden");
	result.classList.add("hidden");
	result.textContent = "";

	let url = "https://actuallygiggles.localtonet.com/" 

	json = getJson(url)

	// json = await fetch(url, {
	// 	headers: {
	// 		"Access-Control-Allow-Origin": "*",
	// 		"Access-Control-Allow-Methods": "POST",
	// 		"Access-Control-Allow-Headers": "X-PINGOTHER, Content-Type"
	// 	}
	// })

	console.log(json)

	const jsonNode = document.createTextNode(json);
	result.appendChild(jsonNode);
	result.classList.remove("hidden")
}

const getJson = (url) => fetch(url).then(async (response) => {
	const contentType = response.headers.get("Content-Type");
	if (contentType.includes("text/plain")) {
		const text = await response.text();
		return text;	
	} else if (contentType.includes("application/json")) {
		return await response.json();
	}
}).catch((error) => console.error(error));

const channel = document.getElementById("channel");
const userNotFound = document.getElementById("user-not-found");
const result = document.getElementById("result");

generator.addEventListener("submit", (event) => fetchSentence(event));

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
  
onReady(() => { 
	const searchParameters = new URLSearchParams(window.location.search);
	if(searchParameters.get("debug")) {
		DEBUG = true;
	}

	if(searchParameters.has("user")) {
		channel.value = searchParameters.get("user");
		calculateDuplicateEmotes(null);
	}
});