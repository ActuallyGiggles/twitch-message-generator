const stats = document.getElementById("stats")
const startTimeDiv = document.getElementById("start_time")
const runTimeDiv = document.getElementById("run_time")
const memoryUsageDiv = document.getElementById("memory_usage")
const allocatedDiv = document.getElementById("allocated")
const totalAllocatedDiv = document.getElementById("total_allocated")
const systemDiv = document.getElementById("system")
const numGCDiv = document.getElementById("num_gc")
const writeModeDiv = document.getElementById("write_mode")
const timeUntilWriteDiv = document.getElementById("time_until_write")
const currentCountDiv = document.getElementById("current_count")
const countLimitDiv = document.getElementById("count_limit")
const peakIntakeDiv = document.getElementById("peak_intake")
const chainDiv = document.getElementById("chain")
const amountDiv = document.getElementById("amount")
const timeDiv = document.getElementById("time")

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
	
	startTimeDiv.innerHTML = `Started at: ${startTime}`
	runTimeDiv.innerHTML = `Run time: ${runTime}`
	allocatedDiv.innerHTML = `Memory Allocated: ${memoryUsage["allocated"]}`
	totalAllocatedDiv.innerHTML = `Total memory allocated: ${memoryUsage["total_allocated"]}`
	systemDiv.innerHTML = `System memory obtained: ${memoryUsage["system"]}`
	numGCDiv.innerHTML = `GC cycles: ${memoryUsage["num_gc"]}`
	writeModeDiv.innerHTML = `Write mode: ${writeMode}`
	if (writeMode == "interval") {
		timeUntilWriteDiv.innerHTML = `Time until next write: ${timeUntilWrite}`
	} else {
		currentCountDiv.innerHTML = `Current input count: ${currentCount}`
		countLimitDiv.innerHTML = `Input count limit: ${countLimit}`
	}
	chainDiv.innerHTML = `Peak intake chain: ${peakIntake["chain"]}`
	amountDiv.innerHTML = `Peak intake amount: ${peakIntake["amount"]}`
	timeDiv.innerHTML = `Peak intake time: ${peakIntake["time"]}`
}

onReady(async () => {	
	// await getStats()

	// generateHtml()
	setInterval(async () => {
        await getStats()

	    generateHtml()
    }, 1000);
});