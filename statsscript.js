const stats = document.getElementById("stats")
const startTimeDiv = document.getElementById("time_start")
const runTimeDiv = document.getElementById("time_run")
const memoryUsageDiv = document.getElementById("memory_usage")
const allocatedDiv = document.getElementById("memory_allocated")
const averageAllocationSpeedDiv = document.getElementById("memory_average_allocation_speed")
const systemDiv = document.getElementById("memory_system")
const writeModeDiv = document.getElementById("markov_write_mode")
const timeUntilWriteDiv = document.getElementById("markov_time_until_write")
const currentCountDiv = document.getElementById("markov_current_count")
const peakIntakeDiv = document.getElementById("markov_peak_intake")
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
    const memoryUsage = statistics["memory_usage"]
    const writeMode = statistics["write_mode"]
    const timeUntilWrite = statistics["time_until_write"]
    const currentCount = statistics["current_count"]
    const countLimit = statistics["count_limit"]
    const peakIntake = statistics["peak_intake"]
	
	startTimeDiv.innerHTML = `${rfc3339ToDate(startTime)}`
	runTimeDiv.innerHTML = `${nanoToTime(runTime)}`

	if (writeMode == "interval") {
        currentCountDiv.classList.add("hidden")
        const countLabel = document.getElementById("markov_count_label")
        countLabel.classList.add("hidden")
        const timeUntilLabel = document.getElementById("markov_time_until_label")
        timeUntilLabel.classList.remove("hidden")
        const label = document.getElementById("markov_label")
        label.classList.add("hidden")

		timeUntilWriteDiv.innerHTML = `${timeUntilWrite}`
	} else {
        timeUntilWriteDiv.classList.add("hidden")
        const countLabel = document.getElementById("markov_count_label")
        countLabel.classList.remove("hidden")
        const timeUntilLabel = document.getElementById("markov_time_until_label")
        timeUntilLabel.classList.add("hidden")
        const label = document.getElementById("markov_label")
        label.classList.add("hidden")

        var percentage = currentCount / countLimit * 100
		currentCountDiv.innerHTML = `${percentage.toString().substring(0,2)}% (${currentCount}/${countLimit})`
	}
    
	if (peakIntake["chain"] == "") {
        var time = rfc3339ToDate(peakIntake["time"])
        peakIntakeDiv.innerHTML = `[N/A, ${time.substring(0, 2)}h${time.substring(3, 5)}m, ${peakIntake["amount"]}]`
    } else {
        var time = rfc3339ToDate(peakIntake["time"])
        peakIntakeDiv.innerHTML = `[${peakIntake["chain"]}, ${time.substring(0, 2)}h${time.substring(3, 5)}m, ${peakIntake["amount"]}]`
    }

	allocatedDiv.innerHTML = `${memoryUsage["allocated"]} MB`
	averageAllocationSpeedDiv.innerHTML = `${(memoryUsage["total_allocated"]/(runTime/1000000000)).toString().substring(0, 2)} MB/s`
	systemDiv.innerHTML = `${memoryUsage["system"]} MB`
}

function rfc3339ToDate(rfc) {
    var year = rfc.substring(0, 4)
    var month = rfc.substring(5, 7)
    var day = rfc.substring(8, 10)
    var time = rfc.substring(11, 16)
    return `${time} ${day}-${month}-${year}`
}

function nanoToTime(nano) {
    var minutes = nano/60000000000
    var m = minutes % 60;
    var h = (minutes-m)/60;
    return (h < 10 ? "0" : "") + h.toString() + "h" + (m < 10 ? "0" : "") + m.toString().substring(0,2) + "m";
}

onReady(async () => {	
	await getStats()

	generateHtml()
	setInterval(async () => {
        await getStats()

	    generateHtml()
    }, 1000);
});