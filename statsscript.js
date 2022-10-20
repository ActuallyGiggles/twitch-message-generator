const stats = document.getElementById("stats")
const startTimeDiv = document.getElementById("start_time")

const statsUrl = "http://actuallygiggles.localtonet.com/server-stats?access=security-omegalul"
let statistics = {}

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

const getJson = (markovUrl) => fetch(markovUrl, { method: "GET" }).then(async (response) => {
	const contentType = response.headers.get("Content-Type");
	if (contentType.includes("text/plain")) {
		const text = await response.text();
		return text;
	} else if (contentType.includes("application/json")) {
		return await response.json();
	}
}).catch((error) => console.error(error));

async function getStats() {
    const stats = await getJson(`${statsUrl}`)

    statistics = stats
}

function generateHtml() {
    const startTime = statistics["start_time"]
    const runTime = statistics["run_time"]
    const memoryUage = statistics["memory_usage"]
    const writeMode = statistics["write_mode"]
    const TimeUntilWrite = statistics["time_until_write"]
    const currentCount = statistics["current_count"]
    const countLimit = statistics["write_count_limit"]
    const peakIntake = statistics["peak_intake"]
    const peakIntakeChain = peakIntake["chain"]
    const peakIntakeAmount= peakIntake["amount"]
    const peakIntakeTime = peakIntake["time"]

    var startTimeText = document.createTextNode(`${startTime}`)
    startTimeDiv.appendChild(startTimeText)
}

onReady(async () => {	
	setInterval(async () => {
        await getStats()

	    generateHtml()
    }, 1000);
});