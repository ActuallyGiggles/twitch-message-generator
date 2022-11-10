const section = document.getElementById("section")
const stats = document.getElementById("stats")
const writeModeDiv = document.getElementById("markov_write_mode")
const capacityLabel = document.getElementById("capacity_label")
const logsDiv = document.getElementById("logs")
const loading = document.getElementById("loading-page")
const offline = document.getElementById("offline")

const statsUrl = "https://actuallygiggles.localtonet.com/server-stats?access=security-omegalul"

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
	
    // Time
    const lifeTimeStart = document.getElementById("lifetime_start")
    lifeTimeStart.innerHTML = `${rfc3339ToDate(statistics["Markov"]["LifetimeStartTime"])}`
    const sessionStart = document.getElementById("session_start")
	sessionStart.innerHTML = `${rfc3339ToDate(statistics["Markov"]["SessionStartTime"])}`
    const lifeTimeUptime = document.getElementById("lifetime_uptime")
    lifeTimeUptime.innerHTML = `${nanoToTime(statistics["Markov"]["LifetimeUptime"])}`
    const sessionUptime = document.getElementById("session_uptime")
    sessionUptime.innerHTML = `${nanoToTime(statistics["Markov"]["SessionUptime"])}`

    // Site Visitors
    const homepage = document.getElementById("homepage")
    homepage.innerHTML = statistics["WebsiteHits"]
    const getSentence = document.getElementById("get_sentence")
    getSentence.innerHTML = statistics["SentenceHits"]

    // Memory
    const allocated = document.getElementById("memory_allocated")
	allocated.innerHTML = `${statistics["memory_usage"]["allocated"].toLocaleString()} MB`
    const averageAllocation = document.getElementById("memory_average_allocation")
	averageAllocation.innerHTML = `${Math.trunc((statistics["memory_usage"]["total_allocated"]/(statistics["Markov"]["SessionUptime"]/1000000000))).toLocaleString()} MB/s`
	const system = document.getElementById("memory_system")
    system.innerHTML = `${statistics["memory_usage"]["system"].toLocaleString()} MB`

    // Markov
        // Overview
    const currentCount = document.getElementById("markov_current_count")
    const timeUntilWrite = document.getElementById("markov_time_until_write")
	if (statistics["Markov"]["WriteMode"] == "interval") {
        capacityLabel.title = "How long until the next write cycle is started. (hours:minutes:seconds)"
        currentCount.classList.add("hidden")
        const countLabel = document.getElementById("markov_count_label")
        countLabel.classList.add("hidden")
        const timeUntilLabel = document.getElementById("markov_time_until_label")
        timeUntilLabel.classList.remove("hidden")
        const label = document.getElementById("markov_count_label")
        label.classList.add("hidden")

		timeUntilWrite.innerHTML = `${nanoToSeconds(statistics["Markov"]["TimeUntilWrite"])}`
	} else {
        capacityLabel.title = `How full the intake capacity is, triggering a write cycle. (${statistics["Markov"]["InputCurrentCount"].toLocaleString()}/${statistics["Markov"]["InputCountLimit"].toLocaleString()})`
        timeUntilWrite.classList.add("hidden")
        const countLabel = document.getElementById("markov_count_label")
        countLabel.classList.remove("hidden")
        const timeUntilLabel = document.getElementById("markov_time_until_label")
        timeUntilLabel.classList.add("hidden")

        var percentage = (statistics["Markov"]["InputCurrentCount"]/statistics["Markov"]["InputCountLimit"]) * 100
		currentCount.innerHTML = `${Math.trunc(percentage)}%`
	}
    const workers = document.getElementById("workers")
    workers.innerHTML = statistics["Markov"]["Workers"]

    // Markov
        // Input
    const lifetimeInputs = document.getElementById("lifetime_inputs")
    lifetimeInputs.innerHTML = statistics["Markov"]["LifetimeInputs"].toLocaleString() + " msg"
    const sessionInputs = document.getElementById("session_inputs")
    sessionInputs.innerHTML = statistics["Markov"]["SessionInputs"].toLocaleString() + " msg"
    const averageInputs = document.getElementById("average_inputs")
    averageInputs.innerHTML = `${Math.trunc((statistics["Markov"]["LifetimeInputs"]/(statistics["Markov"]["LifetimeUptime"]/1000000000))).toLocaleString()} msg/s`
    const inputsPerHour = document.getElementById("last_hour_inputs")
    if (statistics["InputsPerHour"] == 0) {
        inputsPerHour.innerHTML = "----- msgs"
    } else {
        inputsPerHour.innerHTML = `${(statistics["InputsPerHour"]).toLocaleString()} msg`
    }
    const peakIntake = document.getElementById("markov_peak_inputs")
    var peakIntakeObj = statistics["Markov"]["PeakChainIntake"]
	if (peakIntakeObj["chain"] == "") {
        peakIntake.innerHTML = `[N/A, 0h0m, 0msg]`
    } else {
        var time = rfc3339ToDate(peakIntakeObj["time"])
        peakIntake.innerHTML = `${peakIntakeObj["chain"]} | ${time.substring(0, 2)}:${time.substring(3, 5)} | ${peakIntakeObj["amount"].toLocaleString()} msg`
    }

    // Markov
        // Output
    const lifetimeOutputs = document.getElementById("lifetime_outputs")
    lifetimeOutputs.innerHTML = statistics["Markov"]["LifetimeOutputs"].toLocaleString() + " msg"
    const sessionOutputs = document.getElementById("session_outputs")
    sessionOutputs.innerHTML = statistics["Markov"]["SessionOutputs"].toLocaleString() + " msg"
    const averageOutputs = document.getElementById("average_outputs")
    averageOutputs.innerHTML = `${Math.trunc((statistics["Markov"]["LifetimeOutputs"]/(statistics["Markov"]["LifetimeUptime"]/1000000000))).toLocaleString()} msg/s`
    const lastHourDeviation = document.getElementById("last_hour_deviation")
    const outputsPerHour = document.getElementById("last_hour_outputs")
    if (statistics["OutputsPerHour"] == 0) {
        outputsPerHour.innerHTML = "----- msgs"
        lastHourDeviation.title = `The deviation in the number of outputs in the last hour.`
    } else {
        lastHourDeviation.title = `The amount of messages put out in the last hour.`
        outputsPerHour.innerHTML = (statistics["OutputsPerHour"]).toLocaleString()

        //var deviation = (statistics["OutputsPerHour"]) - 4686
        //outputsPerHour.innerHTML = `${deviation > 0 ? "+" : ""} ${deviation} msg`
        //lastHourDeviation.title = `The deviation in the number of outputs in the last hour. (current: ${(statistics["OutputsPerHour"]).toLocaleString()} msg | target: 4,686 msg)`
    }

    const logs = statistics["logs"]
    var logsFormatted
    var first = true
    for (let index = 0; index < logs.length; index++) {
        const log = logs[index];
        if (first) {
            logsFormatted = log
            first = false
        } else {
            logsFormatted = logsFormatted + "<br>"+ log
        }
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
    var d = h / 24
    h = h % 24
    return `${Math.trunc(d)}d, ${(h < 10 ? "0" : "") + Math.trunc(h)}:${(m < 10 ? "0" : "") + Math.trunc(m)}`;
}

function nanoToSeconds(nano) {
    var totalSeconds = nano/1000000000
    var seconds = totalSeconds % 60
    var minutes = totalSeconds/60
    var hours = minutes/60
    return `${(hours < 10 ? "0" : "") + Math.trunc(hours)}:${(minutes < 10 ? "0" : "") + Math.trunc(minutes)}:${(seconds < 10 ? "0" : "") + Math.trunc(seconds)}`
}

onReady(async () => {	
    const a = new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(false);
		}, 3 * 1000);
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

function hideCategory(categoryID) {
    var categories = document.getElementsByClassName('category')

    for (const category of categories) {
        if (category.id == categoryID) {
            category.style.display = "flex"
        } else {
            category.style.display = "none"
        }
    }
}