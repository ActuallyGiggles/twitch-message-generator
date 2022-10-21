const section = document.getElementById("section")
const stats = document.getElementById("stats")
const startTimeDiv = document.getElementById("time_start")
const runTimeDiv = document.getElementById("time_run")
const memoryUsageDiv = document.getElementById("memory_usage")
const allocatedDiv = document.getElementById("memory_allocated")
const averageAllocationSpeedDiv = document.getElementById("memory_average_allocation_speed")
const systemDiv = document.getElementById("memory_system")
const writeModeDiv = document.getElementById("markov_write_mode")
const totalIntake = document.getElementById("total_intake")
const intake = document.getElementById("intake")
const averageIntake = document.getElementById("average_intake")
const timeUntilWriteDiv = document.getElementById("markov_time_until_write")
const currentCountDiv = document.getElementById("markov_current_count")
const peakIntakeDiv = document.getElementById("markov_peak_intake")
const workersDiv = document.getElementById("workers")
const logsDiv = document.getElementById("logs")
const loading = document.getElementById("loading-page")
const offline = document.getElementById("offline")

const statsUrl = "https://actuallygiggles.localtonet.com/server-stats?access=security-omegalul"
var lastMarkovIntake = 0

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
    console.log(statistics)

    const startTime = statistics["start_time"]
    const runTime = statistics["run_time"]
    const memoryUsage = statistics["memory_usage"]
    const writeMode = statistics["write_mode"]
    const timeUntilWrite = statistics["time_until_write"]
    const workers = statistics["workers"]
    const totalCount = statistics["total_count"]
    const currentCount = statistics["current_count"]
    const countLimit = statistics["count_limit"]
    const peakIntake = statistics["peak_intake"]
    const logs = statistics["logs"]
	
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

        var percentage = (currentCount/countLimit) * 100
		currentCountDiv.innerHTML = `${Math.trunc(percentage)}%`
	}
    if (lastMarkovIntake > currentCount || lastMarkovIntake == 0) {
        intake.innerHTML = "-----"
    } else {
        intake.innerHTML = (currentCount-lastMarkovIntake)
    }
    lastMarkovIntake = currentCount
    totalIntake.innerHTML = totalCount
    averageIntake.innerHTML = Math.trunc(totalCount/(runTime/1000000000))
    
	if (peakIntake["chain"] == "") {
        var time = rfc3339ToDate(peakIntake["time"])
        peakIntakeDiv.innerHTML = `[N/A, ${time.substring(0, 2)}h${time.substring(3, 5)}m, ${peakIntake["amount"]}]`
    } else {
        var time = rfc3339ToDate(peakIntake["time"])
        peakIntakeDiv.innerHTML = `${peakIntake["chain"]} | ${peakIntake["amount"]} | ${time.substring(0, 2)}:${time.substring(3, 5)}`
    }

    workersDiv.innerHTML = workers

	allocatedDiv.innerHTML = `${memoryUsage["allocated"]} MB`
	averageAllocationSpeedDiv.innerHTML = `${(memoryUsage["total_allocated"]/(runTime/1000000000)).toString().substring(0, 2)} MB/s`
	systemDiv.innerHTML = `${memoryUsage["system"]} MB`

    var logsFormatted
    for (let index = 0; index < logs.length; index++) {
        const log = logs[index];
        logsFormatted = logsFormatted + "<br>"+ log
    }
    logsDiv.innerHTML = logsFormatted
}

function rfc3339ToDate(rfc) {
    var year = rfc.substring(0, 4)
    var month = rfc.substring(5, 7)
    var day = rfc.substring(8, 10)
    var time = rfc.substring(11, 16)
    return `${time}, ${day}-${month}-${year}`
}

function nanoToTime(nano) {
    var minutes = nano/60000000000
    var m = minutes % 60;
    var h = (minutes-m)/60;
    return (h < 10 ? "0" : "") + Math.trunc(h) + "h" + (m < 10 ? "0" : "") + Math.trunc(m) + "m";
}

onReady(async () => {	
    const a = new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(false);
		}, 2 * 1000);
	});
	const b = new Promise(async (resolve, reject) => {
		await getStats()
		resolve(true);
	});
	const APIOnlineBool = await Promise.race([a, b]);

    loading.classList.add("hidden")
    if (!APIOnlineBool) {
        offline.classList.remove("hidden")
    } else {
        section.classList.remove("hidden")
    }

	generateHtml()

	setInterval(async () => {
        await getStats()

        if (statistics == undefined) {
            offline.classList.remove("hidden")
            section.classList.add("hidden")
        }

	    generateHtml()
    }, 1000);
});