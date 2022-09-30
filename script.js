let DEBUG = false;

let channelName = "";
let message = "";
let channels = {};
let liveChannels = {};
let channelsJson = {};
let channelIds = {};
let emotes = [];
let channelCards = [];

const homeUrl = "https://actuallygiggles.localtonet.com"
const markovUrl = "https://actuallygiggles.localtonet.com/get-sentence?channel="
const channelsUrl = "https://actuallygiggles.localtonet.com/tracked-channels"
const liveUrl = "https://actuallygiggles.localtonet.com/live-channels"
const emotesUrl = "https://actuallygiggles.localtonet.com/tracked-emotes"

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
	if (channels == null || channels == "") {
		loading.classList.add("hidden")
		result.classList.add("hidden")
		channelsTracked.classList.add("hidden")
		using.classList.add("hidden")
		description.classList.add("hidden")
		donation.classList.add("hidden")

		apiError.classList.remove("hidden")
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

		// Create pfp
		const pfp = document.createElement("div")
		pfp.id = "pfp"

		// Create pulse ring
		const pulse = document.createElement("div")
		pulse.classList.add("pulse-ring")

		// Create pfp image
		const image = new Image()
		image.src = profileImage
		image.id = "broadcaster-pfp"
		image.target= '_blank';image
		image.onclick = function() {
			window.location.href = 'https://www.twitch.tv/' + name
		}

		if (liveChannels[name]) {
			// Append pulse to image
			pulse.appendChild(image)

			// Append pulse to pfp
			pfp.appendChild(pulse)
		} else {
			// Append image to pfp
			pfp.appendChild(image)
		}

		// Create channel label
		const channelNameLabel = document.createElement("div")
		channelNameLabel.id = "channel-name-label"
		const channelNameText = document.createTextNode(`${displayName}`)
		channelNameLabel.appendChild(channelNameText)

		// Append pfp, pulse, and label to channel info
		channelInfo.appendChild(pfp)
		channelInfo.appendChild(channelNameLabel)

		// Create twitch popout
		const twitchPopout = document.createElement("div")
		twitchPopout.id = "twitch-popout"

		// Create twitch link
		const twitchLink = document.createElement("a")
		twitchLink.href = 'https://www.twitch.tv/' + name

		// Create twitch logo image
		const twitchLogo = new Image()
		twitchLogo.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Twitch_Glitch_Logo_Purple.svg/878px-Twitch_Glitch_Logo_Purple.svg.png"
		twitchLogo.id = "twitch-logo"
		twitchLogo.target = "_blank"
		twitchLogo.onclick = function() {
			window.location.href = 'https://www.twitch.tv/' + name
		}
		twitchLink.appendChild(twitchLogo)

		// Append twitch logo image to twitch popout
		twitchPopout.appendChild(twitchLink)

		// Append channel info and twitch popout to channel card
		channelCard.appendChild(channelInfo)
		channelCard.appendChild(twitchPopout)

		var channelCardClone = channelCard.cloneNode(true)
		channelCards.push({
			Name: name,
			Card: channelCardClone
		})

		channelsTracked.appendChild(channelCard)
		channelsTracked.classList.remove("hidden");
	}
}

async function fetchMarkovMessage(event, cName) {
	scroll(0,0)
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

	getChannelEmotes(urlParameters["channel"])

	let urlParameterString = `${window.location.pathname}?${encodeQueryData(urlParameters)}`;
	window.history.pushState(null, "", urlParameterString);

	const json = await getJson(`${markovUrl}${urlParameters["channel"]}`);

	var isError

	if(json == undefined) {
		message = "Something went wrong!"
		isError = true
	}
	else if (json.error != "") {
		message = "Error! " + json["error"];
		isError = true
	}
	else {
		message = json["markov_sentence"];
		isError = false
	}

	console.log("original message is -> " + message)

	replaceEmotes(isError)
}

function replaceEmotes(isError) {
	words = message.split(" ")
	var newMessage = ""
	var url = ""
	var resultObj = document.createElement("div")
	var onlyWords = true

	if (!isError) {
		for (let index = 0; index < words.length; index++) {
			const word = words[index];
			var isEmote = false
			
			for (let index = 0; index < emotes.length; index++) {
				const emote = emotes[index];	
				const emoteName = emote["Name"]
				const emoteUrl = emote["Url"]
	
				if (word == emoteName) {
					isEmote = true
					url = emoteUrl
					break
				} else {
					isEmote = false
				}
			}

			if (!isEmote) {
				newMessage = newMessage + word + " "
				onlyWords = true
			} else {
				if (newMessage.length > 0) {
					txt = document.createTextNode(`${newMessage}`)
					txt.id = "result-text"
					resultObj.appendChild(txt)

					newMessage = ""
				}
				
				const emote = new Image()
				emote.src = url
				emote.alt = word
				emote.title = word
				emote.classList.add("result-emote")
				space = document.createTextNode(` `)
				resultObj.appendChild(emote)
				resultObj.appendChild(space)
				onlyWords = false
			}
		}
		
		if (onlyWords) {
			txt = document.createTextNode(`${" " + newMessage}`)
			txt.id = "result-text"
			resultObj.appendChild(txt)
		}
	} else {
		err = document.createTextNode(`${message}`)
		resultObj.appendChild(err)
	}
	
	generateHtml(isError, resultObj)
}

function generateHtml(isError, resultObj) {
	result.appendChild(resultObj);

	if(isError) {
		result.style.backgroundColor = "IndianRed";
	} else {
		result.style.backgroundColor = "";
	}

	using.textContent = ""
	usingTextDiv = document.createElement("div")
	usingTextDiv.id = "using-text"
	usingText = document.createTextNode("Currently using channel: ")
	usingTextDiv.appendChild(usingText)
	using.appendChild(usingTextDiv)

	for (const card of channelCards) {
		if (card.Name == channelName.toLowerCase()) {
			card.Card.id = "using-card"
			using.appendChild(card.Card)
			break
		}
	}

	loading.classList.add("hidden");
	result.classList.remove("hidden");
	using.classList.remove("hidden")
}

const loading = document.getElementById("loading");
const channelsTracked = document.getElementById("channels");
const result = document.getElementById("result");
const using = document.getElementById("using");
const apiError = document.getElementById("api-error");
const description = document.getElementById("description");
const donation = document.getElementById("donation");

onReady(async () => {	
	await getChannelInfo()
	await getLiveInfo()

	generateInitialHtml()

	getGlobalEmotes()

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

async function getChannelInfo() {
	channels = await getJson(`${channelsUrl}`)

	channels.sort((a, b) => a.login.localeCompare(b.login))

	for (let index = 0; index < channels.length; index++) {
		const channel = channels[index];
		
		channelIds[channel.login] = channel.id
	}
}

async function getLiveInfo() {
	live = await getJson(`${liveUrl}`)

	for (let index = 0; index < live.length; index++) {
		const channel = live[index];
		
		liveChannels[channel.Name] = channel.Live
	}
}

async function getGlobalEmotes() {
	var emotesBulk
	emotesBulk = await getJson(emotesUrl)

	var globalEmotes = emotesBulk["global"]
	for (let index = 0; index < globalEmotes.length; index++) {
		const emote = globalEmotes[index];
		emotes.push(emote)
	}
}

function getChannelEmotes(user) {
	var id = channelIds[user]
	get7tvEmotes(user)
	getBttvEmotes(id)
	getFfzEmotes(id)
}

async function get7tvEmotes(user) {
    try {
        const response = await fetch(`https://api.7tv.app/v2/users/${user}/emotes`, {
            method: 'GET'
        });
        const responseJson = await response.json();
		if (responseJson.status == "Not Found") {return}
        for (const emote of responseJson) {
			var name = emote.name
			var url = emote.urls[3][1]
            emotes.push({
				Name: name,
				Url: url
			});
        }
    } catch (err) {
        console.log('get7tvEmotes failed'.bgRed);
    }
}

async function getBttvEmotes(id) {
    try {
        const response = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${id}`, {
            method: 'GET'
        });
        var responseJson = await response.json();
        if (responseJson.message === 'user not found') return;
        for (let index = 0; index < responseJson.channelEmotes.length; index++) {
            const emote = responseJson.channelEmotes[index];
			var name = emote.code
			var url = `https://cdn.betterttv.net/emote/${emote.id}/3x`	
			emotes.push({
				Name: name,
				Url: url
			});
        }
        for (let index = 0; index < responseJson.sharedEmotes.length; index++) {
			const emote = responseJson.sharedEmotes[index];
			var name = emote.code
			var url = `https://cdn.betterttv.net/emote/${emote.id}/3x`
			emotes.push({
				Name: name,
				Url: url
			});
        }
    } catch (err) {
        console.log(`getBttvEmotes failed for ${id}`.bgRed);
    }
}

async function getFfzEmotes(id) {
    try {
        const response = await fetch(`https://api.frankerfacez.com/v1/room/id/${id}`, {
            method: 'GET'
        });
        var responseJson = await response.json();
        var setNumber = responseJson.room.set;
        var emotesGross = responseJson.sets[setNumber].emoticons;
		for (let index = 0; index < emotesGross.length; index++) {
            const emote = emotesGross[index];
			var name = emote.name
			var urls = emote.urls
			var urlChosen
			for (let [key, url] of Object.entries(urls)) {
				switch (key) {
					case "4":
						urlChosen = "https:" + url
						break;
					case "3":
						urlChosen = "https:" + url
						break;
					case "2":
						urlChosen = "https:" + url
						break;
					case "1":
						urlChosen = "https:" + url
						break;
				}
			}
			emotes.push({
				Name: name,
				Url: urlChosen
			});
        }
    } catch (err) {
        console.log(`getFfzEmotes failed for ${id}`.bgRed);
    }
}