// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;
///<reference path="../index.d.ts" />

// Other cool stuff

let files = {
    resetDate: {
        name: "resetDate.txt",
        value: "January 1, 2024", // Defaults
    },
    resetHistory: {
        name: "resetHistory.txt",
        value: []
    }
}



const fm = FileManager.local() // Start fileManager
let storagePath = fm.joinPath(fm.documentsDirectory(), "CountUpStorage")

console.log(storagePath)

// Create Storage Directory
if (!fm.isDirectory(storagePath)) {
    fm.createDirectory(storagePath)
    console.log("Creating Storage Directory")
	await displayMessage("Created Storage", "File storage is set up now...", "Cool", false)
	let reset = await promptUser("When was the last reset?", "mm / dd / yyyy")

	files.resetDate.value = reset
	files.resetHistory.value = [ reset ]
	saveFiles()

	await displayMessage("Done Initializing", "", "Yippee", false)
}

// Create and read files
for (const [key, value] of Object.entries(files)) {
    let propertyPath = fm.joinPath(storagePath, value.name)

    if (fm.fileExists(propertyPath)) {
        files[key].value = JSON.parse(fm.readString(propertyPath))
    }
}

// Saves files
function saveFiles() {
    console.log("Saving: ")
    console.log(files)
    console.log("")

    for (const [key, value] of Object.entries(files)) {
        console.log(value)

        let propertyPath = fm.joinPath(storagePath, value.name)
        fm.writeString(propertyPath, JSON.stringify(value.value))
    }
}





// Main UI
if (!config.runsInWidget) {

	let copyDate = false;
	let present = false;
	let deleteHist = false;

	let mainAlert = new Alert()
	mainAlert.title = "Choose Action"
	mainAlert.addDestructiveAction("Reset Date 🫠")
	mainAlert.addAction("Set Date")
	mainAlert.addAction("Display Date")
	mainAlert.addAction("Refresh Widget")
	mainAlert.addAction("Present Widget")
	mainAlert.addAction("History")
	mainAlert.addAction("Update Script")
	mainAlert.addAction("Close")
	
	switch ( await mainAlert.present() ) {
		case 0: {
			if (
				await confirmUser("Are You Sure?", "Yes 😐", "No 🕺")
			) { 
				// Reset Date
				let newDate = new Date().toISOString()
				files.resetDate.value = newDate

				addToHistory(newDate)

				refreshWidgets()
				present = false;
			} else {
				await displayMessage("That Was Close 😳", "", "yeah it was...", false)
			}
			break;
		}
		case 1: {
			// Set Date
			let newDate = await promptUser("Enter Date", "1 / 1 / 24")
			if (newDate != "") {

				editHistory(files.resetDate.value, newDate)
				files.resetDate.value = newDate

				refreshWidgets()
				present = false;
			}
			
			break;
		}
		case 2: {	// Display Date String
			copyDate = true
			present = false;
			break;
		}
		case 3: { // Refresh
			refreshWidgets()
			present = true
			break;
		}
		case 4: {
			// Present Widget / Do Nothing
			present = true;
			break;
		}
		case 5: {
			// Stats
			present = false

			let choice = await confirmUser("History", "View History", "Clear History")
			if (choice) {
				await historyMenu()
			} else {
				if (await confirmUser("Are you sure you want to delete your history?", "Yes", "Cancel")) {
					deleteHist = true
				}
			}

			break;
		}
		case 6: {
			// Update
			present = false

			await update();

			return;
		}
		case 7: {
			// Close
			present = false
			break;
		}
	}

	saveFiles()

	if (copyDate) {
		if (await confirmUser(new Date(files.resetDate.value).toString(), "Copy", "Close")) {
			Pasteboard.copyString(files.resetDate.value)
			await displayMessage("Date String Copied", files.resetDate.value, "Yippee", false)
			console.log("Date Copied")
		}
	}
	if (present) {
		await presentWidget();
	}

	if (deleteHist) {
		console.log("Deleting History")
		fm.remove(storagePath)

		await displayMessage("Cleared History", "Run widget again to reinitialize", "Ok...")
	}
}






function refreshWidgets() {
	Safari.open("shortcuts://run-shortcut?name=RefreshWidgets", false)
}

async function displayMessage(title, body, okMessage, isDestructive) {
	let alert = new Alert()
	alert.title = title
	alert.message = body
	if (isDestructive) {
		alert.addDestructiveAction(okMessage)
	} else {
		alert.addAction(okMessage)
	}
	await alert.present()
}
async function confirmUser(title, yesMessage, noMessage) {
	let alert = new Alert()
	alert.title = title
	alert.addAction(yesMessage)
	alert.addCancelAction(noMessage)
	let result = await alert.present()
	return result != -1
}
async function promptUser(title, body) {
	let setDateAlert = new Alert()
	setDateAlert.title = title
	setDateAlert.addTextField(body, "")
	setDateAlert.addAction("Confirm")
	await setDateAlert.present()
	return setDateAlert.textFieldValue(0)
}
async function chooseFromList(title, cancelText, list) {
	let alert = new Alert()
	alert.title = title
	alert.addCancelAction(cancelText)

	list.forEach(item => {
		alert.addAction(item)
	});

	return await alert.present()
}


function getHistory() {
	let histData = []
	try {
		histData = files.resetHistory.value
	} catch (err) {
		console.log(err)
	}
	return histData
}
function saveHistory(hist) {
	files.resetHistory.value = hist
}
function addToHistory(date) {
	let history = getHistory()
	history.push(date)
	saveHistory(history)
}
function editHistory(oldEntry, newEntry) {
	console.log("Editing History")

	let histData = getHistory()
	let location = histData.indexOf(oldEntry)

	if (location == -1) {
		// Entry not valid
		console.log("Could not find: " + oldEntry)
		console.log("Adding to History: " + newEntry)
		addToHistory(newEntry)
		return;
	}

	histData[location] = newEntry
	saveHistory(histData)

	console.log("Editing History: " + oldEntry + " -> " + newEntry)
}



function createRow(text) {
    let row = new UITableRow()
    
    
    let cell = UITableCell.text(text)
    cell.leftAligned()
    row.addCell(cell)
    return row
}
async function historyMenu() {
	// let index = await chooseFromList("Reset History", "Close", [
	// 	"View",
	// 	"Reset"
	// ])

	let table = new UITable()
	table.showSeparators = true

	let histData = getHistory()
    
    table.addRow(createRow(histData.length + " Total Entries"))
    
    
    var avg = 0
    var avgCount = 0
    
    let prevDay = new Date(histData[0])
    for (let i = 1; i < histData.length; i++) {
        let day = new Date(histData[i])
        avg += getDayCountUp(day, prevDay)
        prevDay = day
        avgCount++
    }
    avg /= avgCount
    table.addRow(createRow("Avg of " + avg + " Days Between Resets"))
    
    
    var summer = 0
    for (let i = 0; i < histData.length; i++) {
        if (new Date(histData[i]) > new Date("5/23/24")) {
            summer++
        }
    }
    
    table.addRow(createRow(summer + " Resets This Summer"))
    table.addRow(createRow(""))

	for (let i = 0; i < histData.length; i++) {
	
		table.addRow(createRow(
            new Date(histData[i]).toString()
        ))
	}

	table.present(false)
}


async function update() {
	console.log("Updating")

	try {
		// Construct the URL to the raw content of the script on GitHub
		const url = `https://raw.githubusercontent.com/ChickenNuggetsPerson/ScriptableScripts/main/Count%20Up%20Widget.js`;
		
		// Make an HTTP request to get the script content
		const req = new Request(url);
		const scriptContent = await req.loadString();

		let fileManager = FileManager.iCloud()		

		const dir = fileManager.documentsDirectory();
		const path = fileManager.joinPath(dir, Script.name() + ".js");
		
		fileManager.writeString(path, scriptContent);
		
		console.log("Updated Script")
		await displayMessage("Updated Script", "", "Ok...")
	} catch (error) {
		console.error(`Failed to update script: ${error}`);
	}


}




if (config.runsInWidget) {
	if (new String(args.widgetParameter) == "") {
		const widget = await createWidget(files.resetDate.value, false, config.widgetFamily, false)
		Script.setWidget(widget) 
		Script.complete()
	
	} else if (new String(args.widgetParameter) == "emoji") {
		const widget = await createWidget(files.resetDate.value, true, config.widgetFamily, true)
		Script.setWidget(widget)
		Script.complete()
	} else {
		const widget = await createWidget(files.resetDate.value, true, config.widgetFamily, false)
		Script.setWidget(widget)
		Script.complete()
	}
}
async function presentWidget() {
	console.log("Presenting Widget")


	let sizeOptions = [
		"small", "medium", "large", "accessoryRectangular", "accessoryInline", "accessoryCircular", "emoji"
	]
	let choice = await chooseFromList("Choose Size", "Nevermind", sizeOptions)
	if (choice == -1) { return; }

	if (choice == 6) {
		const widget = await createWidget(files.resetDate.value, true, "accessoryRectangular", true)
		await widget.presentAccessoryRectangular()
	
		Script.setWidget(widget)
		Script.complete()
		return;
	}

	const widget = await createWidget(files.resetDate.value, true, sizeOptions[choice], false)

	switch (choice) {
		case 0:
			await widget.presentSmall()
		break;
		case 1:
			await widget.presentMedium()
		break;
		case 2:
			await widget.presentLarge()
		break;
		case 3:
			await widget.presentAccessoryRectangular()
		break;
		case 4:
			await widget.presentAccessoryInline()
		break;
		case 5:
			await widget.presentAccessoryCircular()
		break;
	
	}
	
	Script.setWidget(widget)
	Script.complete()
}






async function createWidget(goalDate, countDown, widgetFamily, emoji) {
	
	let widget = new ListWidget()

	// const totalDays = getDayCountUp(new Date(), goalDate)
	console.log(new Date(goalDate)); 

	if (!countDown) { return widget }

	const mainStack = widget.addStack()
	const w = mainStack.addStack()
	
	if (widgetFamily != "small" && widgetFamily != "medium" && widgetFamily != "large" && widgetFamily != "extraLarge") {
		w.backgroundColor = new Color("#000000")
		w.addAccessoryWidgetBackground = true;
		w.cornerRadius = 10
		if (widgetFamily == "accessoryCircular") {
			w.size = new Size(75, 75)
		} else {
			w.size = new Size(150, 50) // accessoryRectangular
			w.setPadding(10, 10, 10, 10)
		}
	} else {
		widget.backgroundColor = new Color("#ffffff")
	}
	
	w.layoutHorizontally()
	w.centerAlignContent()
	w.spacing = 0	
	
	let date;
	
	
	if ( emoji ) {

		let count = getDayCountUp(new Date(), new Date(goalDate))
		let pickedFace = pickFace(count)
		let face = w.addText(pickedFace)
		face.minimumScaleFactor = 0.01
		face.font = Font.boldSystemFont(500)
		
		w.size = new Size(pickedFace.length * 15, 50)
        
        if (widgetFamily == "small") {
            face.textColor = new Color("#000000")
        }
		
		return widget
	}


	if (widgetFamily == "small") {
		w.layoutVertically();

		w.addSpacer()

		date = w.addDate(new Date(goalDate))

		w.addSpacer()

		date.centerAlignText()		
		date.textColor = new Color("#000000")
		
		w.addSpacer();
	}
	
	if (widgetFamily == "medium" || widgetFamily == "large") {
		w.addSpacer()

		date = w.addDate(new Date(goalDate))

		w.addSpacer()

		date.centerAlignText()		
		date.textColor = new Color("#000000")
		
	}

	if (widgetFamily == "extraLarge") {
		w.addSpacer()

		date = w.addDate(new Date(goalDate))

		// w.addSpacer()

		date.centerAlignText()		
		date.textColor = new Color("#000000")

		w.addSpacer();
	}

	// If is circular 
	if (widgetFamily == "accessoryCircular") { 
		// Is accessory circular
		let days = getDayCountUp(new Date(), new Date(goalDate))
		await progressCircle(w, days, "f0f0f0", "4d4d4d", 70, 7)
	}

	// If Widget is square widget on home screen
	if (widgetFamily == "accessoryRectangular") {
		date = w.addDate(new Date(goalDate))
		date.centerAlignText()		
		date.textColor = new Color("#ffffff")	
	}
	if (widgetFamily == "accessoryInline") {

		date = w.addDate(new Date(goalDate))

		date.leftAlignText()		
		date.textColor = new Color("#ffffff")
	} 
		
	try {
		date.applyRelativeStyle()
		date.minimumScaleFactor = 0.01
		date.font = Font.boldSystemFont(500)
	} catch (err) {}

    return widget
}



async function progressCircle( on, value = 50, colour = "hsl(0, 0%, 100%)", background = "hsl(0, 0%, 10%)", size = 56, barWidth = 5.5) {
    if (value > 1) {
        value /= 100
    }
    if (value < 0) {
        value = 0
    }
    if (value > 1) {
        value = 1
    }

    async function isUsingDarkAppearance() {
        return !Color.dynamic(Color.white(), Color.black()).red
    }
    let isDark = await isUsingDarkAppearance()

    if (colour.split("-").length > 1) {
        if (isDark) {
            colour = colour.split("-")[1]
        } else {
            colour = colour.split("-")[0]
        }
    }

    if (background.split("-").length > 1) {
        if (isDark) {
            background = background.split("-")[1]
        } else {
            background = background.split("-")[0]
        }
    }

    let w = new WebView()
    await w.loadHTML('<canvas id="c"></canvas>')

    let base64 = await w.evaluateJavaScript(
        `
        let colour = "${colour}",
        background = "${background}",
        size = ${size}*3,
        lineWidth = ${barWidth}*3,
        percent = ${value * 100}
            
        let canvas = document.getElementById('c'),
        c = canvas.getContext('2d')
        canvas.width = size
        canvas.height = size
        let posX = canvas.width / 2,
        posY = canvas.height / 2,
        onePercent = 360 / 100,
        result = onePercent * percent
        c.lineCap = 'round'
        c.beginPath()
        c.arc( posX, posY, (size-lineWidth-1)/2, (Math.PI/180) * 270, (Math.PI/180) * (270 + 360) )
        c.strokeStyle = background
        c.lineWidth = lineWidth 
        c.stroke()
        c.beginPath()
        c.strokeStyle = colour
        c.lineWidth = lineWidth
        c.arc( posX, posY, (size-lineWidth-1)/2, (Math.PI/180) * 270, (Math.PI/180) * (270 + result) )
        c.fillStyle = colour
        c.font = "bold 70px Avenir Next";
        c.textAlign = "center"
        c.fillText(Math.floor(${value * 100}), posX + 4, posY + 10);
		c.font = "bold 35px Avenir Next";
		c.fillText("Days", posX, posY + 53);
        c.stroke()
        completion(canvas.toDataURL().replace("data:image/png;base64,",""))`,
        true
    )
    const image = Image.fromData(Data.fromBase64String(base64))
    
    let stack = on.addStack()
    stack.size = new Size(size, size)
    stack.backgroundImage = image
    stack.centerAlignContent()
    let padding = barWidth * 2
    stack.setPadding(padding, padding, padding, padding)

    return stack
}


function getDayCountUp(startDate, endDate) {

	let currentDate = new Date(startDate);
	let startingDate = new Date(endDate);
	
	const timeDifference = currentDate.getTime() - startingDate.getTime();

	// Convert the time difference to other units if needed (e.g., seconds, minutes, hours, days)
	const millisecondsInOneSecond = 1000;
	const secondsInOneMinute = 60;
	const minutesInOneHour = 60;
	const hoursInOneDay = 24;
	
	const secondsDifference = timeDifference / millisecondsInOneSecond;
	const minutesDifference = secondsDifference / secondsInOneMinute;
	const hoursDifference = minutesDifference / minutesInOneHour;
	const daysDifference = hoursDifference / hoursInOneDay;
	
	let x = Math.floor(daysDifference)
	if (x < 0) {
		x = 0
	}
	
	return x
}

function pickFace(days) {

	switch (days) {
		case 0:
			return "(ﾟ∩ﾟ)"
		case 1:
			return "┌( ಠ_ಠ)┘"
		case 2:
			return "(ㆆ _ ㆆ)"
		case 3:
			return "ᕕ( ಠ‿ಠ)ᕗ"
	}

	let higherFaces = [
		"(• ε •)", 
		"(っ◕‿◕)っ", 
		"( ⚈ワ⚈)", 
		"╰( ⁰ ਊ ⁰ )━☆*･｡ﾟ",
		"ᕕ( ᐛ )ᕗ",
		"( ◔ ʖ̯ ◔ )",
		"(｢•-•)｢",
		"＼(ﾟｰﾟ＼)"
	]

	let currentDate = new Date()
	
	let timezoneOff = currentDate.getTimezoneOffset() * 60 * 1000
	let miliInDay = 24 * 60 * 60 * 1000
	
	return higherFaces[Math.floor((currentDate.getTime() - timezoneOff) / miliInDay) % higherFaces.length]
}
