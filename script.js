const loadingPage = document.getElementById("loading-page")
const loadingResult = document.getElementById("loading-result");
const channelCardsContainer = document.getElementById("channel-cards-container")
const searchInput = document.querySelector("[channel-search]")
const channelCardTemplate = document.querySelector("[channel-card-template]")
const result = document.getElementById("result");
const using = document.getElementById("using");
const usingCardSpace = document.getElementById("using-card-space")
const apiError = document.getElementById("api-error");
const limiter = document.getElementById("limiter")
const description = document.getElementById("description");
const donation = document.getElementById("donation");

const homeUrl = "https://actuallygiggles.localtonet.com"
const markovUrl = "https://actuallygiggles.localtonet.com/get-sentence?channel="
const channelsUrl = "https://actuallygiggles.localtonet.com/tracked-channels"
const liveUrl = "https://actuallygiggles.localtonet.com/live-channels"
const emotesUrl = "https://actuallygiggles.localtonet.com/tracked-emotes"

let channels = {};
let liveChannels = {};
let channelCards = [];
let emotes = new Map()

async function generateInitialHtml() {
	if (channels == null || channels == "") {
		loadingResult.classList.add("hidden")
		result.classList.add("hidden")
		channelsTracked.classList.add("hidden")
		using.classList.add("hidden")
		description.classList.add("hidden")
		donation.classList.add("hidden")

		apiError.classList.remove("hidden")
	}


	for (let index = 0; index < Object.keys(channels).length; index++) {
		const channel = Object.values(channels)[index];
		const name = channel.login
		const displayName = channel.display_name
		const profileImageUrl = channel.profile_image_url

		const card = channelCardTemplate.content.cloneNode(true).children[0]
		const channelInfo = card.querySelector(".channel-info")
		const liveChannelProfile = card.querySelector(".live-channel-profile")
		const liveChannelProfileImage = card.querySelector(".live-channel-profile-image")
		const deadChannelProfile = card.querySelector(".dead-channel-profile")
		const deadChannelProfileImage = card.querySelector(".dead-channel-profile-image")
		const channelName = card.querySelector(".channel-name")
		const twitchPopoutLink = card.querySelector(".twitch-popout-link")

		card.id = displayName
		channelInfo.id = displayName
		liveChannelProfile.id = displayName
		deadChannelProfile.id = displayName
		channelName.textContent = displayName
		channelName.id = displayName
		twitchPopoutLink.href = `https://twitch.tv/${name}`

		if (liveChannels[name]) {
			liveChannelProfileImage.src = profileImageUrl
			liveChannelProfileImage.id = displayName
			liveChannelProfile.classList.remove("hidden")
		} else {
			deadChannelProfileImage.src = profileImageUrl
			deadChannelProfileImage.id = displayName
			deadChannelProfile.classList.remove("hidden")
		}

		channelCardsContainer.append(card)

		channelCards.push({
			Name: name,
			Card: card
		})
	}
	channelCardsContainer.classList.remove("hidden");

	loadingPage.classList.add("hidden")
}

async function fetchMarkovMessage(event, channelName) {
	scroll(0,0)
	if (event != null) {
		event.preventDefault();
	}

	document.title = "Twitch Msg Gen • " + channelName;

	result.textContent = "";
	result.classList.add("hidden")
	loadingResult.classList.remove("hidden");

	let urlParameters = {};
	if (channelName == "") {
		urlParameters["channel"] = channels[channelName].login;
	} else {
		urlParameters["channel"] = channelName
	}

	let urlParameterString = `${window.location.pathname}?${encodeQueryData(urlParameters)}`;
	window.history.pushState(null, "", urlParameterString);

	getChannelEmotes(channelName)

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

	replaceEmotes(channelName, isError)
}

function replaceEmotes(channelName, isError) {
	var words = message.split(" ")
	var newMessage = ""
	var resultObj = document.createElement("div")
	var onlyWords = true

	if (!isError) {
		for (let index = 0; index < words.length; index++) {
			const word = words[index];
			var isEmote = false

			var url = emotes.get(word)

			if (url != undefined) {
				isEmote = true
			} else {
				isEmote = false
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
	
	generateResultHtml(channelName, resultObj, isError)
}

function generateResultHtml(channelName, resultObj, isError) {
	result.appendChild(resultObj);

	if(isError) {
		result.style.backgroundColor = "IndianRed";
	} else {
		result.style.backgroundColor = "";
	}

	var child = using.lastElementChild; 
	while (child) {
		using.removeChild(child);
		child = using.lastElementChild;
	}

	using.textContent = ""
	usingTextDiv = document.createElement("div")
	usingTextDiv.id = "using-text"
	usingText = document.createTextNode("Currently using channel: ")
	usingTextDiv.appendChild(usingText)
	using.appendChild(usingTextDiv)

	usingCardSpace.removeChild(usingCardSpace.childNodes[0])

	for (const card of channelCards) {
		if (card.Name == channelName.toLowerCase()) {
			var cardClone = card.Card.cloneNode(true)
			usingCardSpace.appendChild(cardClone)
			using.appendChild(usingCardSpace)
			break
		}
	}

	loadingResult.classList.add("hidden");
	result.classList.remove("hidden");
	using.classList.remove("hidden")
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

function encodeQueryData(data) { 
    const ret = [];
    for (let d in data) {
        if (data[d]) {
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
		}
    }
    return ret.join('&');
}

async function getChannelsInfo() {
	const chans = await getJson(`${channelsUrl}`)
	if (chans.hasOwnProperty("Error")) {
		limiter.classList.remove("hidden")
		return
	}
	chans.sort((a, b) => a.login.localeCompare(b.login))
	for (let index = 0; index < chans.length; index++) {
		const channel = chans[index];
		channels[channel.display_name] = channel
	}
}

async function getLiveInfo() {
	const live = await getJson(`${liveUrl}`)
	if (live.hasOwnProperty("Error")) {
		limiter.classList.remove("hidden")
		return
	}
	for (let index = 0; index < live.length; index++) {
		const channel = live[index];
		liveChannels[channel.Name] = channel.Live
	}
}

async function getGlobalEmotes() {
	const emotesBulk = await getJson(emotesUrl)
	if (emotesBulk.hasOwnProperty("Error")) {
		limiter.classList.remove("hidden")
		return
	}
	var globalEmotes = emotesBulk["global"]
	for (let index = 0; index < globalEmotes.length; index++) {
		const emote = globalEmotes[index];
		emotes.set(emote.Name, emote.Url)
	}
}

function getChannelEmotes(channelName) {
	var id = channels[channelName].id
	get7tvEmotes(channelName.toLowerCase() )
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
			emotes.set(name, url)
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
			emotes.set(name, url)
        }
        for (let index = 0; index < responseJson.sharedEmotes.length; index++) {
			const emote = responseJson.sharedEmotes[index];
			var name = emote.code
			var url = `https://cdn.betterttv.net/emote/${emote.id}/3x`
			emotes.set(name, url)
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
			emotes.set(name, urlChosen)
        }
    } catch (err) {
        console.log(`getFfzEmotes failed for ${id}`.bgRed);
    }
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

onReady(async () => {	
	await getChannelsInfo()
	await getLiveInfo()

	generateInitialHtml()

	searchInput.addEventListener("input", e => {
		const value = e.target.value.toLowerCase()
		channelCards.forEach(card => {
			const isVisible = card.Name.includes(value)
			card.Card.classList.toggle("hidden", !isVisible)
		});
	})

	getGlobalEmotes()
	
	document.addEventListener('click', function (event) {
		if (event.target.className == "channel-card"
		|| event.target.className == "channel-info"
		|| event.target.className == "live-channel-profile"
		|| event.target.className == "dead-channel-profile"
		|| event.target.className == "live-channel-profile-image"
		|| event.target.className == "dead-channel-profile-image"
		|| event.target.className == "channel-name") {
			var channelName = event.target.id
			//console.log(channelName)
			fetchMarkovMessage(event, channelName)
		}
	})

	const searchParameters = new URLSearchParams(window.location.search);
	if(searchParameters.has("channel")) {
		var channelName = searchParameters.get("channel");
		fetchMarkovMessage(null, channelName);
	}
});
